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
