from fastapi.testclient import TestClient

from dooms.server.app import app


def test_index_and_config():
    c = TestClient(app)
    assert "Dooms" in c.get("/").text
    cfg = c.get("/api/config").json()
    names = [s["name"] for s in cfg["scenes"]]
    assert names[0] == "sandbox" and "put_bottle_in_box" in names
    assert cfg["model"].startswith("us.anthropic.claude-sonnet-4-5")


def test_unparsable_demo_command_reports_error():
    c = TestClient(app)
    with c.websocket_connect("/ws") as ws:
        ws.send_json({"type": "run", "scene": "sandbox", "instruction": "wave hello", "llm": "scripted", "speed": 0})
        seen = []
        while True:
            m = ws.receive()
            if m.get("text"):
                import json
                ev = json.loads(m["text"])
                seen.append(ev["type"])
                if ev["type"] == "ended":
                    break
        assert "error" in seen


def test_static_assets_and_ui_shell_are_served():
    c = TestClient(app)
    html = c.get("/").text
    assert "/static/app.js" in html and "/static/app.css" in html and "Connect AWS" in html
    for f in ("app.js", "app.css", "viewer.js"):
        assert c.get(f"/static/{f}").status_code == 200


def test_hosted_mode_ignores_server_credentials(monkeypatch):
    import dooms.server.app as srv
    monkeypatch.setattr(srv, "REQUIRE_USER_KEYS", True)
    assert srv._has_credentials() is False
    cfg = TestClient(app).get("/api/config").json()
    assert cfg["require_user_keys"] is True and cfg["bedrock_ready"] is False


def test_embedded_token_guards_api_and_websocket(monkeypatch):
    import dooms.server.app as srv
    monkeypatch.setattr(srv, "AUTH_TOKEN", "s3cret-token")
    c = TestClient(app)
    assert c.get("/api/health").json()["ok"] is True                                  # health is always open
    assert c.get("/api/config").status_code == 401
    assert c.get("/api/config", headers={"x-dooms-token": "wrong"}).status_code == 401
    assert c.get("/api/config", headers={"x-dooms-token": "s3cret-token"}).status_code == 200
    import pytest
    from starlette.websockets import WebSocketDisconnect
    with pytest.raises(WebSocketDisconnect):
        with c.websocket_connect("/ws?token=nope"):
            pass
    with c.websocket_connect("/ws?token=s3cret-token") as ws:                         # accepted with the right token
        ws.send_json({"type": "stop"})


def test_stop_interrupts_a_model_call_immediately():
    """Stop must not wait for a slow Bedrock call (with retries) to return."""
    import threading
    import time

    import pytest

    from dooms.server.worker import Aborted, make_cancellable

    class Slow:
        remote = True

        def structured(self, **kw):
            time.sleep(5)
            return "late"

    cancel = threading.Event()
    llm = make_cancellable(Slow(), cancel)
    threading.Timer(0.3, cancel.set).start()
    t0 = time.time()
    with pytest.raises(Aborted):
        llm.structured(agent="x")
    assert time.time() - t0 < 1.5
    with pytest.raises(Aborted):              # already cancelled: not even started
        llm.structured(agent="x")


def test_stop_ends_a_running_episode():
    import json
    import time
    c = TestClient(app)
    with c.websocket_connect("/ws") as ws:
        ws.send_json({"type": "run", "scene": "put_cube_in_box", "instruction": "put the red cube into the box",
                      "llm": "scripted", "speed": 1, "skills": False})
        seen, sent = [], False
        t0 = time.time()
        while time.time() - t0 < 60:
            m = ws.receive()
            if m.get("text"):
                ev = json.loads(m["text"])
                seen.append(ev["type"])
                if ev["type"] == "subtask_start" and not sent:
                    ws.send_json({"type": "stop"})
                    sent = True
                if ev["type"] == "ended":
                    break
        assert sent and "stopped" in seen and "done" not in seen


def test_hosted_server_points_real_robots_to_the_desktop_app(monkeypatch):
    import json
    import dooms.server.app as srv
    monkeypatch.setattr(srv, "HOSTED", True)
    c = TestClient(srv.app)
    rr = c.get("/api/config").json()["real_robot"]
    assert rr["available"] is False and "desktop app" in rr["reason"]
    with c.websocket_connect("/ws") as ws:
        ws.send_json({"type": "hw", "op": "connect", "args": {"port": "virtual"}})
        ev = json.loads(ws.receive()["text"])
        assert ev["type"] == "hw_error" and ev["code"] == "hosted"
        ws.send_json({"type": "run", "mode": "real", "scene": "sandbox", "robot": "so101", "llm": "scripted",
                      "instruction": "put the red cube into the box"})
        ev = json.loads(ws.receive()["text"])
        assert ev["type"] == "error" and ev["code"] == "hosted"


def test_local_server_offers_real_robots():
    from dooms.server.app import app as local
    assert TestClient(local).get("/api/config").json()["real_robot"]["available"] is True
