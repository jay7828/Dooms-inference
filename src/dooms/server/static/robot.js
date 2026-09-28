// Real robot (SO-101): connection, setup wizard, live status. Talks to the session worker with {type:"hw", op, args}.
const G = "/static/guide/";
const STEPS = [["connect", "Connect"], ["arm", "Arm calibration"], ["camera", "Camera"], ["camcal", "Camera calibration"], ["test", "Test & safety"]];
const JOINTS = ["shoulder_pan", "shoulder_lift", "elbow_flex", "wrist_flex", "wrist_roll", "gripper"];
const NICE = (j) => j.replace(/_/g, " ");
// virtual robot only: stand-ins for the person's hands (model degrees)
const REF = [0, 0, 0, 0, 0, -10];
const LO = [-108, -98, -95, -93, -155, -9], HI = [108, 98, 95, 93, 160, 98];
const DIR_SIGN = { shoulder_pan: -1, shoulder_lift: 1, elbow_flex: 1, wrist_flex: 1, wrist_roll: 1, gripper: 1 };

export function createRobot(ctx) {
  const { $, $$, esc, toast } = ctx;
  const st = { status: null, ports: [], cameras: [], step: null, busy: false, port: "", camera: "", sig: "", msg: "", msgKind: "", hover: false, timers: [] };
  const hw = (op, args = {}) => ctx.send({ type: "hw", op, args });
  const modal = $("#robot-modal");
  const s = () => st.status || {};

  /* ---------------------------------------------------------------- status helpers */
  const done = {
    connect: () => !!s().connected,
    arm: () => !!s().calibrated,
    camera: () => !!s().camera,
    camcal: () => !!s().camera_calibrated,
    test: () => !!s().ready && !!s().torque,
  };
  function firstTodo() { return (STEPS.find(([k]) => !done[k]()) || STEPS[4])[0]; }
  function setMsg(text, kind = "") {
    st.msg = text; st.msgKind = kind;
    const el = $("#rm-msg"); if (el) { el.textContent = text || ""; el.className = "rm-msg " + kind; }
  }

  /* ---------------------------------------------------------------- command-panel bar */
  function renderBar() {
    const x = s();
    const dot = $("#rb-dot"), txt = $("#rb-text");
    dot.className = "dot " + (!x.connected ? "" : x.ready ? "ok" : "warn");
    if (!x.connected) txt.textContent = "Not connected";
    else {
      const t = x.telemetry || {};
      txt.textContent = `${x.virtual ? "Virtual SO-101" : x.port}${t.voltage ? ` · ${t.voltage.toFixed(1)} V` : ""}${t.temperature ? ` · ${t.temperature} °C` : ""}${x.torque ? " · holding" : " · limp"}`;
    }
    $("#rb-steps").innerHTML = x.connected ? STEPS.slice(1, 4).map(([k, l]) => `<span class="${done[k]() ? "ok" : "todo"}">${done[k]() ? "✓" : "•"} ${l}</span>`).join("") : "";
    $("#rb-setup").textContent = x.ready ? "Setup" : x.connected ? "Continue setup" : "Set up";
    $("#rb-setup").className = "btn" + (x.ready ? "" : " primary");
    $("#rb-tools").hidden = !x.connected || !x.calibrated;
    $("#rb-torque").classList.toggle("on", !!x.torque);
    $("#rb-torque").textContent = x.torque ? "Torque on" : "Torque off";
    ctx.onChange?.();
  }
  $("#rb-setup").onclick = () => open();
  $("#rb-torque").onclick = () => { if (!s().torque || confirm("Switch the torque off? Support the arm: it will go limp.")) hw("torque", { on: !s().torque }); };
  $("#rb-home").onclick = () => hw("home");
  $("#rb-rest").onclick = () => hw("rest");
  $("#rb-stop").onclick = () => stop();
  function stop() { clearTimers(); ctx.send({ type: "stop" }); hw("stop"); }

  /* ---------------------------------------------------------------- wizard */
  function open(step) {
    st.step = step || firstTodo();
    hw("ports");
    if (s().connected) hw("cameras");
    render();
    if (!modal.open) modal.showModal();
  }
  $("#rm-close").onclick = () => modal.close();
  $("#rm-stop").onclick = () => stop();
  modal.addEventListener("close", () => { clearTimers(); st.hover = false; });

  function nav() {
    $("#rm-nav").innerHTML = STEPS.map(([k, l], i) => `<button type="button" data-k="${k}" class="${st.step === k ? "on" : ""}"><span class="n ${done[k]() ? "ok" : ""}">${done[k]() ? "✓" : i + 1}</span>${l}</button>`).join("");
    $$("#rm-nav button").forEach((b) => (b.onclick = () => { st.step = b.dataset.k; st.hover = false; render(); if (st.step === "camera" || st.step === "camcal") hw("cameras"); }));
    $("#rm-chip").textContent = s().connected ? (s().virtual ? "virtual robot" : s().port) : "not connected";
  }

  function render() {
    if (!modal.open && st.step === null) return;
    nav();
    const body = $("#rm-body");
    body.innerHTML = VIEWS[st.step]();
    BIND[st.step]?.();
    setMsg(st.msg, st.msgKind);
    st.sig = signature();
    drawOverlay();
  }
  function signature() { const x = s(); return JSON.stringify([x.connected, x.calibrated, x.camera, x.camera_calibrated, x.torque, x.ready, x.wizard && x.wizard.kind, x.wizard && x.wizard.stage, x.wizard && x.wizard.index, x.wizard && x.wizard.points && x.wizard.points.length, x.wizard && !!x.wizard.result]); }

  function selfTest(r) {
    if (!r) return `<p class="hint">Self-test checks every servo, the link speed, power, temperature and the calibration, then bends the wrist 6° and back (once calibrated). Run it after connecting, and whenever something feels off.</p>`;
    const icon = { ok: "✓", warn: "!", fail: "✕" };
    return `<div class="selftest" id="rm-st"><div class="st-h ${r.ok ? "ok" : "fail"}">${r.ok ? "Self-test passed" : "Self-test found problems"}</div>${r.checks.map((c) => `<div class="st-row ${c.status}"><span class="st-i">${icon[c.status]}</span><div><b>${esc(c.name)}</b> <span>${esc(c.detail)}</span>${c.fix ? `<div class="st-fix">${esc(c.fix)}</div>` : ""}</div></div>`).join("")}</div>`;
  }
  const need = (what, step) => `<div class="callout warn">${ctx.I.alert}<div>${what} <button class="btn" type="button" data-go="${step}">Go there</button></div></div>`;
  const live = (clickable) => `<div class="live ${clickable ? "click" : ""}" id="rm-live-wrap">${s().camera ? `<img id="rm-live" alt="Camera">` : `<div class="ph">No camera connected</div>`}<canvas id="rm-ov"></canvas></div>`;

  const VIEWS = {
    connect() {
      const x = s();
      const opts = st.ports.map((p) => `<option value="${esc(p.id)}" ${p.id === (st.port || x.port) ? "selected" : ""}>${esc(p.name)}${p.likely ? " (likely the arm)" : ""}</option>`).join("");
      return `<div class="wiz-grid"><div>
        <h3>Connect the arm</h3>
        <p>Plug the arm's power supply in, switch it on, then connect the driver board's USB cable to this computer. Pick its port below. No robot here yet? Choose <b>Virtual SO-101</b> to try every step on a simulated arm.</p>
        <div class="wiz-row"><select class="sel" id="rm-port" style="flex:1" ${x.connected ? "disabled" : ""}>${opts || '<option value="">Looking for ports…</option>'}</select>
          <button class="btn icon" type="button" id="rm-ports" title="Refresh">↻</button></div>
        <div class="wiz-row">${x.connected ? `<button class="btn" type="button" id="rm-disconnect">Disconnect</button><button class="btn primary" type="button" id="rm-selftest">Run self-test</button>` : `<button class="btn primary" type="button" id="rm-connect">Connect</button>`}</div>
        ${x.connected ? selfTest(x.self_test) : ""}
        ${x.connected ? `<div class="kv"><span>Port</span><b>${esc(x.port)}</b><span>Servos</span><b>6 of 6 answering</b><span>Supply</span><b>${x.telemetry?.voltage ? x.telemetry.voltage.toFixed(1) + " V" : "–"}</b><span>Hottest servo</span><b>${x.telemetry?.temperature ?? "–"} °C</b><span>Calibration</span><b>${x.calibrated ? "saved, loaded" : "needed"}</b></div>` : ""}
        <p class="hint" style="margin-top:10px">Port not listed? Unplug and replug the USB cable, then refresh. On a Mac the arm appears as <code>/dev/cu.usbmodem…</code> or <code>/dev/cu.usbserial…</code>.</p>
      </div><div><img class="ref-img" src="${G}wiring.png" alt="Wiring"></div></div>`;
    },
    arm() {
      const x = s();
      if (!x.connected) return need("Connect the arm first.", "connect");
      const w = x.wizard && x.wizard.kind === "arm" ? x.wizard : null;
      const vr = x.virtual;
      if (!w) {
        return `<div class="wiz-grid"><div>
          <h3>Arm calibration ${x.calibrated ? '<span class="grade good">· done</span>' : ""}</h3>
          <p>Teaches the app how each servo is mounted. Three short steps, all with the torque <b>off</b>: you move the arm by hand. Takes about two minutes.</p>
          <p><b>Before you start:</b> clear the table, and hold the arm when the torque goes off, or it will sag.</p>
          ${x.calibrated ? `<p>Check it: with the torque off, move the arm by hand. The 3D arm in the main view must follow exactly. If a joint moves the wrong way, recalibrate.</p>` : ""}
          <div class="wiz-row"><button class="btn primary" type="button" id="rm-cal-start">${x.calibrated ? "Recalibrate" : "Start calibration"}</button>
          ${x.calibrated ? `<button class="btn" type="button" id="rm-limp">Torque off to check</button>` : ""}</div>
        </div><div><img class="ref-img" src="${G}ref_pose.png" alt="Reference pose"></div></div>`;
      }
      if (w.stage === "reference") {
        return `<div class="wiz-grid"><div>
          <h3>1 · Reference pose</h3>
          <p>Move the arm by hand into the pose shown: upper arm straight up, forearm level and pointing forward, gripper straight ahead and <b>closed</b>. Eyeballing is fine; the camera step later corrects small errors.</p>
          <div class="wiz-row"><button class="btn primary" type="button" id="rm-cal-ref">Record reference pose</button><button class="btn ghost" type="button" id="rm-cal-cancel">Cancel</button></div>
          <p class="hint">Recording writes each servo's offset so this pose reads mid-scale (like LeRobot's calibration).</p>
          ${vr ? `<div class="virtual"><span class="label">Virtual robot</span><button class="btn" type="button" id="rm-v-ref">Pose it for me</button></div>` : ""}
        </div><div><img class="ref-img" src="${G}ref_pose.png" alt="Reference pose"></div></div>`;
      }
      if (w.stage === "directions") {
        return `<div class="wiz-grid"><div>
          <h3>2 · Directions <span class="hint">${w.index + 1} of ${w.total}</span></h3>
          <p><b>${esc(w.text)}</b>, by about a quarter turn. The app notices the motion and moves to the next joint by itself.</p>
          <div class="kv" id="rm-joints"></div>
          <div class="wiz-row"><button class="btn ghost" type="button" id="rm-cal-cancel">Cancel</button></div>
          ${vr ? `<div class="virtual"><span class="label">Virtual robot</span><button class="btn" type="button" id="rm-v-dir">Move it for me</button></div>` : ""}
        </div><div><img class="ref-img" src="${G}dir_${w.joint}.png" alt="${esc(w.text)}"></div></div>`;
      }
      return `<div class="wiz-grid"><div>
          <h3>3 · Range</h3>
          <p>Move every joint slowly from one end of its travel to the other (as far as it goes without hitting the table), and open the gripper fully once. Bars fill as you go.</p>
          <div class="bars" id="rm-bars"></div>
          <div class="wiz-row"><button class="btn primary" type="button" id="rm-cal-finish">Finish</button><button class="btn ghost" type="button" id="rm-cal-cancel">Cancel</button></div>
          ${vr ? `<div class="virtual"><span class="label">Virtual robot</span><button class="btn" type="button" id="rm-v-range">Sweep for me</button></div>` : ""}
        </div><div><img class="ref-img" src="${G}rest_pose.png" alt="Arm"></div></div>`;
    },
    camera() {
      const x = s();
      if (!x.connected) return need("Connect the arm first.", "connect");
      const opts = st.cameras.map((c) => `<option value="${esc(c.id)}" ${c.id === (st.camera || x.camera) ? "selected" : ""}>${esc(c.name)}</option>`).join("");
      return `<div class="wiz-grid"><div>
        <h3>Overview camera</h3>
        <p>One fixed camera that sees the whole work area. A USB webcam, or your phone: an iPhone near a Mac shows up here by itself (Continuity Camera); on Android use a webcam app (DroidCam, IP Webcam) and pick it, or paste its stream address.</p>
        <div class="wiz-row"><select class="sel" id="rm-cam" style="flex:1">${opts || '<option value="">Looking for cameras…</option>'}<option value="__url">Stream address (http://…)</option></select>
          <button class="btn icon" type="button" id="rm-cams" title="Refresh">↻</button></div>
        <div class="wiz-row" id="rm-url-row" hidden><input class="inp mono" id="rm-url" placeholder="http://192.168.1.20:8080/video"></div>
        <div class="wiz-row">${x.camera ? `<button class="btn" type="button" id="rm-cam-close">Close</button>` : ""}<button class="btn primary" type="button" id="rm-cam-open">${x.camera ? "Switch" : "Open"}</button></div>
        <p><b>Placement:</b> 40-55 cm from the base, 35-45 cm high, looking down at about 45°. Fixed on a tripod or clamp: if it moves, redo the camera calibration.</p>
        ${live(false)}
      </div><div><img class="ref-img" src="${G}table_layout.png" alt="Table layout"><img class="ref-img" style="margin-top:8px" src="${G}camera_view.png" alt="Good camera view"></div></div>`;
    },
    camcal() {
      const x = s();
      if (!x.connected) return need("Connect the arm first.", "connect");
      if (!x.calibrated) return need("Calibrate the arm first.", "arm");
      if (!x.camera) return need("Open the camera first.", "camera");
      const w = x.wizard && x.wizard.kind === "camera" ? x.wizard : null;
      if (!w) {
        const q = x.camera_quality;
        return `<div class="wiz-grid"><div>
          <h3>Camera calibration ${x.camera_calibrated ? `<span class="grade ${q?.grade}">· ${q?.grade}</span>` : ""}</h3>
          <p>Tells the app where the camera is. Put 6 small pieces of tape on the table where the layout shows (measure from the centre of the base). Then, for each mark: rest the <b>closed jaw tips</b> on it, and click the same mark in the camera image.</p>
          ${x.camera_calibrated ? `<p>${esc(q?.text || "")} Estimated field of view ${q?.fov}°.</p>` : ""}
          <div class="wiz-row"><button class="btn primary" type="button" id="rm-cc-start">${x.camera_calibrated ? "Recalibrate" : "Start"}</button></div>
          ${live(false)}
        </div><div><img class="ref-img" src="${G}touch_mark.png" alt="Touch a mark"><img class="ref-img" style="margin-top:8px" src="${G}table_layout.png" alt="Table layout"></div></div>`;
      }
      const res = w.result;
      const rows = w.points.map((p, i) => `<tr><td>${i + 1}</td><td>${p.world.slice(0, 2).map((v) => (v * 100).toFixed(1)).join(", ")} cm</td><td>${p.pixel.map((v) => Math.round(v)).join(", ")}</td><td>${res ? res.errors[i] + " px" : ""}</td><td><button class="btn ghost icon" type="button" data-rm="${i}" title="Remove">×</button></td></tr>`).join("");
      return `<div class="wiz-grid"><div>
        <h3>Touch and click <span class="hint">${w.points.length} of 6</span></h3>
        <p>Rest the closed jaw tips on a tape mark (torque off, by hand), then click that mark below. Jaw tip height now: <b id="rm-tipz">–</b></p>
        ${live(true)}
        ${x.virtual ? `<div class="virtual"><span class="label">Virtual robot: put the tips on mark</span> ${[1, 2, 3, 4, 5, 6].map((k) => `<button class="btn" type="button" data-mark="${k - 1}">${k}</button>`).join(" ")}</div>` : ""}
      </div><div>
        <table class="pts"><tr><td>#</td><td>tips at</td><td>pixel</td><td>error</td><td></td></tr>${rows || '<tr><td colspan="5" class="hint">No points yet</td></tr>'}</table>
        <div class="wiz-row"><button class="btn" type="button" id="rm-cc-solve" ${w.points.length < 4 ? "disabled" : ""}>Solve</button>
          <button class="btn primary" type="button" id="rm-cc-save" ${!res || res.grade === "bad" ? "disabled" : ""}>Save</button></div>
        ${res ? `<p><span class="grade ${res.grade}">${res.grade.toUpperCase()}</span> · ${esc(res.text)} Field of view ${res.fov}°.${res.arm_fix_deg && res.arm_fix_deg.some((v) => Math.abs(v) > 0.05) ? ` Arm zero corrected by ${res.arm_fix_deg.map((v) => v.toFixed(1)).join("/")}° (lift/elbow/wrist).` : ""}</p>` : ""}
        <img class="ref-img" src="${G}touch_mark.png" alt="Touch a mark">
      </div></div>`;
    },
    test() {
      const x = s();
      if (!x.ready) return need("Finish the steps above first.", firstTodo());
      const sf = x.safety || {};
      return `<div class="wiz-grid"><div>
        <h3>Test</h3>
        <p>Torque on, go home, then <b>click a spot on the table</b> in the image: the arm hovers 2 cm above it. If it lands on the spot, everything is calibrated.</p>
        <div class="wiz-row">
          <button class="btn ${x.torque ? "" : "primary"}" type="button" id="rm-tq">${x.torque ? "Torque off" : "Torque on"}</button>
          <button class="btn" type="button" id="rm-home" ${x.torque ? "" : "disabled"}>Home</button>
          <button class="btn" type="button" id="rm-rest" ${x.torque ? "" : "disabled"}>Rest</button>
          <button class="btn" type="button" id="rm-open" ${x.torque ? "" : "disabled"}>Open</button>
          <button class="btn" type="button" id="rm-closeg" ${x.torque ? "" : "disabled"}>Close</button>
          <label class="row hint" style="cursor:pointer;margin-left:auto"><input type="checkbox" id="rm-hover" ${st.hover ? "checked" : ""} ${x.torque ? "" : "disabled"}> click to hover</label>
        </div>
        ${live(true)}
        ${x.virtual ? `<div class="virtual"><span class="label">Virtual robot</span> <button class="btn" type="button" id="rm-v-arrange">Place the objects</button> <span class="hint">calibrate on a cleared table, then set the objects out</span></div>` : ""}
      </div><div>
        <h3>Jog the jaw tips <span class="hint">1 cm steps</span></h3>
        <div class="wiz-row"><div class="jog">
          <span></span><button class="btn" type="button" data-jog="1,0,0" title="forward">X+</button><span></span>
          <button class="btn" type="button" data-jog="0,1,0" title="robot's left">Y+</button><span></span><button class="btn" type="button" data-jog="0,-1,0" title="robot's right">Y−</button>
          <span></span><button class="btn" type="button" data-jog="-1,0,0" title="back">X−</button><span></span></div>
          <div class="jog" style="grid-template-columns:30px"><button class="btn" type="button" data-jog="0,0,1">Z+</button><button class="btn" type="button" data-jog="0,0,-1">Z−</button></div>
          <div class="kv" id="rm-joints" style="margin-left:10px"></div></div>
        <h3 style="margin-top:14px">Safety</h3>
        <div class="slider"><span>Speed</span><input type="range" min="10" max="100" step="5" id="rm-speed" value="${sf.speed_pct}"><b id="rm-speed-v">${sf.speed_pct}%</b></div>
        <div class="slider"><span>Torque limit</span><input type="range" min="30" max="100" step="5" id="rm-torque-pct" value="${sf.torque_pct}"><b id="rm-torque-v">${sf.torque_pct}%</b></div>
        <div class="slider"><span>Collision at</span><input type="range" min="50" max="100" step="5" id="rm-overload" value="${sf.overload_pct}"><b id="rm-overload-v">${sf.overload_pct}%</b></div>
        <p class="hint" style="margin-top:8px">Always active: joint limits, a table-floor guard, collision (overload) detection, and temperature and voltage watchdogs. Stop holds the arm; the power switch is the real emergency stop.</p>
      </div></div>`;
    },
  };

  /* ---------------------------------------------------------------- wiring per view */
  function common() {
    $$("[data-go]").forEach((b) => (b.onclick = () => { st.step = b.dataset.go; render(); }));
    const img = $("#rm-live");
    if (img && st.frameUrl) img.src = st.frameUrl;
    const wrap = $("#rm-live-wrap");
    if (wrap && wrap.classList.contains("click")) wrap.onclick = onImageClick;
  }
  const BIND = {
    connect() {
      common();
      $("#rm-ports").onclick = () => hw("ports");
      $("#rm-port")?.addEventListener("change", (e) => (st.port = e.target.value));
      $("#rm-connect") && ($("#rm-connect").onclick = () => {
        const port = $("#rm-port").value; st.port = port;
        if (!port) return setMsg("Pick a port first.", "err");
        setMsg("Connecting…"); hw("connect", { port, scene: ctx.scene(), seed: ctx.seed() });
      });
      $("#rm-disconnect") && ($("#rm-disconnect").onclick = () => hw("disconnect"));
      $("#rm-selftest") && ($("#rm-selftest").onclick = () => { setMsg("Running self-test… (the wrist may move a little)"); hw("self_test", { move: true }); });
    },
    arm() {
      common();
      $("#rm-cal-start") && ($("#rm-cal-start").onclick = () => { if (confirm("The torque goes off and the arm can sag. Hold it, then press OK.")) hw("calib_start"); });
      $("#rm-limp") && ($("#rm-limp").onclick = () => { if (confirm("Support the arm: it goes limp.")) hw("torque", { on: false }); });
      $("#rm-cal-ref") && ($("#rm-cal-ref").onclick = () => hw("calib_reference"));
      $("#rm-cal-finish") && ($("#rm-cal-finish").onclick = () => hw("calib_finish"));
      $$("#rm-cal-cancel").forEach((b) => (b.onclick = () => { clearTimers(); hw("calib_cancel"); }));
      $("#rm-v-ref") && ($("#rm-v-ref").onclick = () => handPose(REF));
      $("#rm-v-dir") && ($("#rm-v-dir").onclick = () => {
        const w = s().wizard; const i = JOINTS.indexOf(w.joint); const q = [...REF]; q[i] += DIR_SIGN[w.joint] * 26;
        handPose(q); later(1800, () => handPose(REF));
      });
      $("#rm-v-range") && ($("#rm-v-range").onclick = () => {
        let t = 0;
        JOINTS.forEach((j, i) => [LO[i], HI[i], REF[i]].forEach((v) => { const q = [...REF]; q[i] = v; later(t, () => handPose(q)); t += 1700; }));
        later(t, () => setMsg("Sweep done: press Finish.", "ok"));
        setMsg("Sweeping every joint…");
      });
      updateLive();
    },
    camera() {
      common();
      $("#rm-cams").onclick = () => hw("cameras");
      const sel = $("#rm-cam");
      const syncUrl = () => ($("#rm-url-row").hidden = sel.value !== "__url");
      sel.onchange = () => { st.camera = sel.value; syncUrl(); }; syncUrl();
      $("#rm-cam-open").onclick = () => {
        const src = sel.value === "__url" ? $("#rm-url").value.trim() : sel.value;
        if (!src) return setMsg("Pick a camera first.", "err");
        setMsg("Opening camera…"); hw("camera_open", { source: src });
      };
      $("#rm-cam-close") && ($("#rm-cam-close").onclick = () => hw("camera_close"));
    },
    camcal() {
      common();
      $("#rm-cc-start") && ($("#rm-cc-start").onclick = () => hw("camcal_start"));
      $("#rm-cc-solve") && ($("#rm-cc-solve").onclick = () => hw("camcal_solve"));
      $("#rm-cc-save") && ($("#rm-cc-save").onclick = () => hw("camcal_save"));
      $$("[data-rm]").forEach((b) => (b.onclick = () => hw("camcal_remove", { index: +b.dataset.rm })));
      $$("[data-mark]").forEach((b) => (b.onclick = () => hw("virtual_place_tip", { mark: +b.dataset.mark })));
      updateLive();
    },
    test() {
      common();
      $("#rm-tq").onclick = () => { if (!s().torque || confirm("Support the arm: it goes limp.")) hw("torque", { on: !s().torque }); };
      $("#rm-home").onclick = () => hw("home");
      $("#rm-rest").onclick = () => hw("rest");
      $("#rm-open").onclick = () => hw("gripper", { open: true });
      $("#rm-closeg").onclick = () => hw("gripper", { open: false });
      $("#rm-hover").onchange = (e) => { st.hover = e.target.checked; };
      $("#rm-v-arrange") && ($("#rm-v-arrange").onclick = () => hw("virtual_arrange", { seed: ctx.seed() }));
      $$("[data-jog]").forEach((b) => (b.onclick = () => { const [x, y, z] = b.dataset.jog.split(",").map(Number); hw("jog", { dx: x * 0.01, dy: y * 0.01, dz: z * 0.01 }); }));
      for (const [id, key] of [["rm-speed", "speed_pct"], ["rm-torque-pct", "torque_pct"], ["rm-overload", "overload_pct"]]) {
        const el = $("#" + id);
        el.oninput = () => ($(`#${id === "rm-speed" ? "rm-speed-v" : id === "rm-torque-pct" ? "rm-torque-v" : "rm-overload-v"}`).textContent = el.value + "%");
        el.onchange = () => hw("safety", { [key]: +el.value });
      }
      updateLive();
    },
  };

  function onImageClick(e) {
    const img = $("#rm-live"), x = s();
    if (!img || !img.naturalWidth || !x.camera_size) return;
    const r = img.getBoundingClientRect();
    const u = ((e.clientX - r.left) / r.width) * x.camera_size[0], v = ((e.clientY - r.top) / r.height) * x.camera_size[1];
    if (st.step === "camcal" && x.wizard?.kind === "camera") hw("camcal_add", { u, v });
    else if (st.step === "test") {
      if (!st.hover) { hw("locate", { u, v }); return; }
      setMsg("Moving above that spot…"); hw("hover", { u, v });
    }
  }

  function drawOverlay() {
    const cv = $("#rm-ov"), img = $("#rm-live"), x = s();
    if (!cv || !img) return;
    const w = cv.clientWidth, h = cv.clientHeight;
    cv.width = w * devicePixelRatio; cv.height = h * devicePixelRatio;
    const g = cv.getContext("2d"); g.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0); g.clearRect(0, 0, w, h);
    const pts = x.wizard?.kind === "camera" ? x.wizard.points : [];
    if (!x.camera_size || !pts.length) return;
    const k = w / x.camera_size[0];
    g.font = "600 12px system-ui"; g.lineWidth = 2;
    pts.forEach((p, i) => {
      const [u, v] = [p.pixel[0] * k, p.pixel[1] * k];
      g.strokeStyle = "#ff5e7a"; g.beginPath(); g.arc(u, v, 7, 0, Math.PI * 2); g.stroke();
      g.fillStyle = "#ff5e7a"; g.fillText(String(i + 1), u + 9, v - 7);
    });
  }

  function updateLive() {
    const x = s();
    const j = $("#rm-joints");
    if (j && x.joints) j.innerHTML = JOINTS.map((n) => `<span>${NICE(n)}</span><b>${x.joints[n].toFixed(1)}°</b>`).join("");
    const bars = $("#rm-bars"), p = x.wizard?.progress;
    if (bars && p) bars.innerHTML = JOINTS.map((n) => `<div class="bar"><span>${NICE(n)}</span><div class="tr"><i class="${p[n] >= (n === "shoulder_lift" || n === "elbow_flex" ? 0.35 : 0.45) ? "ok" : ""}" style="width:${Math.round(p[n] * 100)}%"></i></div><b>${Math.round(p[n] * 100)}%</b></div>`).join("");
    const tz = $("#rm-tipz");
    if (tz && x.tip) { const z = x.tip[2] * 100; tz.textContent = `${z.toFixed(1)} cm ${z < 1.5 ? "· on the table ✓" : "· lower it onto the mark"}`; tz.style.color = z < 1.5 ? "var(--ok)" : "var(--warn)"; }
  }

  /* ---------------------------------------------------------------- virtual-robot hands */
  function handPose(q) { if (s().torque) hw("torque", { on: false }); JOINTS.forEach((j, i) => hw("virtual_hand", { joint: j, deg: q[i] })); }
  function later(ms, fn) { st.timers.push(setTimeout(fn, ms)); }
  function clearTimers() { st.timers.forEach(clearTimeout); st.timers = []; }

  /* ---------------------------------------------------------------- events from the server */
  function handle(ev) {
    switch (ev.type) {
      case "hw_status": {
        st.status = ev;
        renderBar();
        if (ev.op && ev.op !== "tick" && ev.message) setMsg(ev.message, ev.stopped ? "" : "ok");
        if (ev.op === "connect" && ev.connected) hw("cameras");
        if (modal.open) { if (signature() !== st.sig || (ev.op && ev.op !== "tick")) render(); else { updateLive(); nav(); } }
        break;
      }
      case "hw_error": setMsg(ev.message, "err"); if (!modal.open) toast("err", "Robot", ev.message); break;
      case "hw_ports": st.ports = ev.ports; if (modal.open && st.step === "connect") render(); break;
      case "hw_cameras": st.cameras = ev.cameras; if (!st.camera && ev.cameras.length) st.camera = ev.cameras[0].id; if (modal.open && st.step === "camera") render(); break;
      case "hw_busy": st.busy = ev.busy; $("#rm-stop").classList.toggle("primary", ev.busy); break;
      case "hw_locate": setMsg(`That spot is at x ${(ev.point[0] * 100).toFixed(1)} cm, y ${(ev.point[1] * 100).toFixed(1)} cm from the base. Tick "click to hover" to send the arm there.`); break;
    }
  }
  function frame(url) {
    st.frameUrl = url;
    const img = $("#rm-live");
    if (img && modal.open) { img.src = url; if (!img.dataset.sized) { img.onload = () => { drawOverlay(); img.dataset.sized = "1"; }; } }
  }
  window.addEventListener("resize", drawOverlay);

  return {
    handle, frame, open, renderBar, stop,
    get status() { return st.status || {}; },
    ready: () => !!s().ready,
    refresh: () => hw("status"),
  };
}
