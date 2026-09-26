// Dooms studio — UI logic. Talks to the server over one WebSocket (events + live poses) and a few REST endpoints.
import { createViewer } from "/static/viewer.js";

const API = (window.DOOMS_API || "").replace(/\/$/, ""); // "" = same origin; set in config.js when the UI is hosted apart from the backend
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const I = {
  check: '<svg class="i" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg>',
  alert: '<svg class="i" viewBox="0 0 24 24"><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/></svg>',
  x: '<svg class="i" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6M9 9l6 6"/></svg>',
  info: '<svg class="i" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>',
  layers: '<svg class="i" viewBox="0 0 24 24"><path d="m12 2 10 5-10 5L2 7l10-5z"/><path d="m2 12 10 5 10-5"/><path d="m2 17 10 5 10-5"/></svg>',
  play: '<svg class="i" viewBox="0 0 24 24"><polygon points="6 3 20 12 6 21 6 3"/></svg>',
  stop: '<svg class="i" viewBox="0 0 24 24"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>',
};

/* ------------------------------------------------------------------ state */
const S = {
  ws: null, cfg: null, scenes: {}, running: false, scene: "sandbox", planner: "scripted", grounding: "vlm", speed: "1",
  aws: null,                       // {mode, creds, region, model, identity} once validated
  run: null, frameUrl: null, t0: 0,
};
const V = createViewer($("#gl"), $("#stage"));

/* ------------------------------------------------------------------ small UI helpers */
function toast(kind, title, msg = "", ms = 6000) {
  const el = document.createElement("div");
  el.className = `toast ${kind}`;
  el.innerHTML = `${kind === "err" ? I.alert : kind === "ok" ? I.check : I.info}<div><b>${esc(title)}</b>${msg ? `<span>${esc(msg)}</span>` : ""}</div>`;
  $("#toasts").appendChild(el);
  setTimeout(() => el.remove(), ms);
}
function seg(root, onchange) {
  root.addEventListener("click", (e) => {
    const b = e.target.closest("button[data-value]");
    if (!b || b.disabled) return;
    $$("button", root).forEach((x) => x.classList.toggle("on", x === b));
    onchange?.(b.dataset.value);
  });
  return { get: () => $("button.on", root)?.dataset.value, set(v) { $$("button", root).forEach((x) => x.classList.toggle("on", x.dataset.value === String(v))); } };
}
const segPlanner = seg($("#seg-planner"), (v) => { S.planner = v; renderPlannerNote(); });
const segGround = seg($("#seg-grounding"), (v) => (S.grounding = v));
const segSpeed = seg($("#seg-speed"), (v) => (S.speed = v));
const logLine = (msg, cls = "") => {
  const d = document.createElement("div");
  if (cls) d.className = cls;
  const t = S.t0 ? ((Date.now() - S.t0) / 1000).toFixed(1).padStart(5, " ") : "  0.0";
  d.innerHTML = `<time>${t}s</time>${esc(msg)}`;
  $("#log").appendChild(d);
  $("#log").scrollTop = 1e9;
};

/* ------------------------------------------------------------------ AWS credentials (memory + optional browser storage) */
const AWS_KEY = "dooms.aws";
function loadAws() {
  for (const store of [sessionStorage, localStorage]) {
    try { const v = JSON.parse(store.getItem(AWS_KEY) || "null"); if (v?.creds) return v; } catch { /* ignore */ }
  }
  return null;
}
function saveAws(remember) {
  try {
    sessionStorage.removeItem(AWS_KEY); localStorage.removeItem(AWS_KEY);
    if (S.aws) (remember ? localStorage : sessionStorage).setItem(AWS_KEY, JSON.stringify({ ...S.aws, remember }));
  } catch { /* storage blocked: keep in memory only */ }
}
function renderAwsChip() {
  const chip = $("#btn-aws"), server = S.cfg?.bedrock_ready && !S.cfg?.require_user_keys;
  chip.classList.toggle("ok", !!S.aws || server);
  $("#aws-label").innerHTML = S.aws ? `AWS <small>${esc(S.aws.identity || "connected")}</small>` : server ? "AWS <small>server key</small>" : "Connect AWS";
  renderPlannerNote();
}
function renderPlannerNote() {
  const el = $("#planner-note");
  if (S.planner !== "bedrock") { el.innerHTML = ""; return; }
  if (S.aws) {
    el.innerHTML = `<div class="callout ok">${I.check}<div>Your AWS account · ${esc(S.aws.region)}<br><span class="hint">${esc(S.aws.model.replace(/^(us|global|eu|apac)\.anthropic\./, ""))}</span></div></div>`;
  } else if (S.cfg?.bedrock_ready && !S.cfg?.require_user_keys) {
    el.innerHTML = `<div class="callout">${I.info}<div>Using the server's AWS credentials. <a href="#" id="use-own" style="color:var(--accent-h)">Use mine</a></div></div>`;
    $("#use-own").onclick = (e) => { e.preventDefault(); openAws(); };
  } else {
    el.innerHTML = `<div class="callout warn">${I.alert}<div>Claude needs an AWS account with Bedrock access.<br><button class="btn" id="callout-connect">Connect AWS</button></div></div>`;
    $("#callout-connect").onclick = openAws;
  }
}
const modal = $("#aws-modal");
const modeSeg = seg($("#aws-mode"), (m) => { $("#mode-keys").hidden = m !== "keys"; $("#mode-bearer").hidden = m !== "bearer"; });
function openAws() {
  const a = S.aws;
  if (a) {
    modeSeg.set(a.mode); $("#mode-keys").hidden = a.mode !== "keys"; $("#mode-bearer").hidden = a.mode !== "bearer";
    $("#aws-akid").value = a.creds.access_key_id || ""; $("#aws-secret").value = a.creds.secret_access_key || "";
    $("#aws-token").value = a.creds.session_token || ""; $("#aws-bearer").value = a.creds.bearer_token || "";
    $("#aws-region").value = a.region; $("#aws-remember").checked = !!a.remember;
    fillModels(a.models || [a.model], a.model);
  }
  $("#aws-disconnect").hidden = !a;
  setAwsStatus(a ? "ok" : "", a ? `Connected as ${a.identity}.` : "");
  modal.showModal();
}
function fillModels(models, selected) {
  const sel = $("#aws-model");
  const list = [...new Set([selected, ...models].filter(Boolean))];
  sel.innerHTML = list.map((m) => `<option value="${esc(m)}">${esc(m.replace(/^(us|global|eu|apac)\.anthropic\./, "").replace(/-v\d+:\d+$/, ""))}</option>`).join("");
  sel.value = selected;
}
function setAwsStatus(kind, msg) {
  const el = $("#aws-status");
  el.className = "vstatus" + (kind ? ` show ${kind}` : "");
  el.textContent = msg;
}
function readForm() {
  const mode = modeSeg.get();
  const creds = { region: $("#aws-region").value };
  if (mode === "keys") { creds.access_key_id = $("#aws-akid").value.trim(); creds.secret_access_key = $("#aws-secret").value.trim(); creds.session_token = $("#aws-token").value.trim(); }
  else creds.bearer_token = $("#aws-bearer").value.trim();
  return { mode, creds };
}
$("#aws-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const { mode, creds } = readForm();
  if (mode === "keys" && !(creds.access_key_id && creds.secret_access_key)) return setAwsStatus("bad", "Enter the access key ID and the secret access key.");
  if (mode === "bearer" && !creds.bearer_token) return setAwsStatus("bad", "Enter the Bedrock API key.");
  const btn = $("#aws-validate"); btn.disabled = true;
  setAwsStatus("busy", "Checking credentials and Claude access…");
  try {
    const r = await fetch(API + "/api/bedrock/validate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ credentials: creds, model: $("#aws-model").value || null }) });
    const d = await r.json();
    if (!r.ok) throw new Error(d.detail || "Validation failed");
    if (!d.ok) return setAwsStatus("bad", d.message || "Could not connect.");
    const model = d.tested_model;
    S.aws = { mode, creds, region: d.region, model, models: d.models, identity: d.identity || "connected" };
    saveAws($("#aws-remember").checked);
    fillModels(d.models, model);
    setAwsStatus("ok", `Connected as ${S.aws.identity}. ${d.models.length} Claude model${d.models.length === 1 ? "" : "s"} available.`);
    $("#aws-disconnect").hidden = false;
    renderAwsChip();
    toast("ok", "AWS connected", "Select the Claude planner to use it.");
    setTimeout(() => modal.close(), 900);
  } catch (err) { setAwsStatus("bad", String(err.message || err)); }
  finally { btn.disabled = false; }
});
$("#aws-model").addEventListener("change", () => { if (S.aws) { S.aws.model = $("#aws-model").value; saveAws($("#aws-remember").checked); renderPlannerNote(); } });
$("#aws-disconnect").onclick = () => { S.aws = null; saveAws(false); ["#aws-akid", "#aws-secret", "#aws-token", "#aws-bearer"].forEach((s) => ($(s).value = "")); renderAwsChip(); setAwsStatus("", ""); $("#aws-disconnect").hidden = true; toast("info", "Disconnected", "Your credentials were removed from this browser session."); };
$("#aws-cancel").onclick = $("#aws-close").onclick = () => modal.close();
modal.addEventListener("click", (e) => { if (e.target === modal) modal.close(); });
$$("[data-toggle]").forEach((b) => (b.onclick = () => { const i = $("#" + b.dataset.toggle); i.type = i.type === "password" ? "text" : "password"; b.textContent = i.type === "password" ? "Show" : "Hide"; }));
$("#btn-aws").onclick = openAws;

/* ------------------------------------------------------------------ scenes + composer */
const SCENE_INFO = {
  sandbox: ["Sandbox"], sandbox_fallen: ["Knocked-over bottle"], sandbox_blocked: ["Box beside the bottle"],
  put_bottle_in_box: ["Bottle → box"], put_cube_in_box: ["Cube → box"], stack_cubes: ["Stack cubes"],
};
function renderScenes() {
  const sel = $("#scene");
  sel.innerHTML = Object.values(S.scenes).map((s) => `<option value="${esc(s.name)}">${esc((SCENE_INFO[s.name] || [s.name])[0])}</option>`).join("");
  sel.value = S.scene;
  sel.onchange = () => { if (S.running) return; S.scene = sel.value; fillExamples(true); resetScene(); };
}
function fillExamples(setText) {
  const sc = S.scenes[S.scene];
  $("#chips").innerHTML = sc.examples.map((t) => `<button class="chip" type="button">${esc(t)}</button>`).join("");
  $$("#chips .chip").forEach((b) => (b.onclick = () => { $("#task").value = b.textContent; $("#task").focus(); }));
  if (setText) $("#task").value = sc.instruction;
}
$("#task").addEventListener("keydown", (e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && !S.running) start(); });
$("#seed").onchange = () => resetScene();
$("#seed-dice").onclick = () => { $("#seed").value = Math.floor(Math.random() * 1000); resetScene(); };
$("#btn-reset").onclick = () => resetScene();
$("#opt-toggle").onclick = () => { const o = $("#options"); o.hidden = !o.hidden; $("#opt-toggle").classList.toggle("open", !o.hidden); };

/* ------------------------------------------------------------------ 3D scene loading */
async function loadScene() {
  $("#loading").style.display = "grid";
  try {
    const sc = await (await fetch(API + `/api/scene/${S.scene}?seed=${+$("#seed").value || 0}`)).json();
    V.buildScene(sc);
    $("#loading").style.display = "none";
  } catch (e) { $("#loading").textContent = "Could not load the 3D scene."; }
}
function resetScene() {
  if (S.running) return;
  resetRun(); loadScene();
  if (S.ws?.readyState === 1) S.ws.send(JSON.stringify({ type: "reset", scene: S.scene, seed: +$("#seed").value || 0 }));
}
function showSceneState(ev) {
  const el = $("#scene-state"), dirty = ev.runs > 0;
  el.classList.toggle("dirty", dirty);
  el.textContent = dirty ? `modified · ${ev.runs} run${ev.runs > 1 ? "s" : ""}` : "fresh";
}

/* ------------------------------------------------------------------ pipeline panel */
const AGENTS = [
  ["task_decomposer", "01", "Task Decomposer", "Reads the scene and splits the task"],
  ["skill_generator", "02", "Skill Generator", "Reuses or creates controller skills"],
  ["parameter_setter", "03", "Parameter Setter", "Chooses the numbers"],
  ["vision_grounder", "04", "Vision Grounder", "Finds keypoints in 3D"],
];
function buildAgents() {
  $("#agents").innerHTML = AGENTS.map(([k, n, t, d]) => `<div class="agent" data-a="${k}"><div class="agent-h"><span class="no">${n}</span><h4>${t}</h4><span class="status">Idle</span></div><div class="agent-b">${k === "vision_grounder" ? '<img id="groundimg" alt="Grounded keypoints"><div id="groundtxt"></div>' : ""}</div></div>`).join("");
}
function setAgent(name, st) {
  const c = $(`.agent[data-a="${name}"]`);
  if (!c) return;
  c.classList.toggle("run", st === "run"); c.classList.toggle("done", st === "done");
  $(".status", c).innerHTML = st === "run" ? '<i class="spin"></i>thinking' : st === "done" ? `${I.check}done` : "";
}
const agentBody = (name) => $(`.agent[data-a="${name}"] .agent-b`);
function resetRun() {
  S.run = { subtasks: [], recipes: [], params: {}, current: null, skillInfo: {}, stepStatus: {} };
  AGENTS.forEach(([k]) => { setAgent(k, "idle"); if (k !== "vision_grounder") agentBody(k).innerHTML = ""; });
  const gi = $("#groundimg"); if (gi) gi.style.display = "none";
  const gt = $("#groundtxt"); if (gt) gt.innerHTML = "";
  $("#stepper").innerHTML = ""; $("#result").className = "result"; $("#result").innerHTML = "";
  $("#log").innerHTML = ""; $("#obstacle").classList.remove("show"); $("#obstacle-body").innerHTML = "";
  ["#m-calls", "#m-cost", "#m-tok", "#m-sim"].forEach((s) => ($(s).textContent = "–"));
  hideHud(); V.clearMarkers?.();
}
function renderSteps() {
  $("#stepper").innerHTML = S.run.subtasks.map((s) => `<div class="step ${S.run.stepStatus[s.id] || ""}"><span class="n">${String(s.id).padStart(2, "0")}</span><span>${esc(s.name)}</span></div>`).join("");
  const cur = $(".step.run"); cur?.scrollIntoView({ inline: "nearest", block: "nearest", behavior: "smooth" });
}
function ctrlText(c, sid) {
  const num = (n) => { const v = S.run.params[sid + ":" + n]; return v === undefined ? `<span class="p">${esc(n)}</span>` : `<span class="v">${esc(n)}=${v}</span>`; };
  let a = [];
  if (c.type === "PosAlign") a = [esc(c.source), esc(c.target), "axis=" + esc(c.axis), c.param ? num(c.param) : ""];
  else if (c.type === "AxisAlign" || c.type === "YawAlign") a = [esc(c.source), esc(c.target), c.param ? num(c.param) : ""];
  else if (c.type === "Force") a = ["axis=" + esc(c.axis), c.param ? num(c.param) : ""];
  else if (c.type === "Gripper") a = [esc(c.action), c.param ? num(c.param) : ""];
  return `<span class="p">[p${c.priority}${c.stage ? " · stage " + c.stage : ""}]</span> ${c.type}(${a.filter(Boolean).join(", ")})`;
}
function skillTag(id) {
  const k = S.run.skillInfo[id];
  return k ? `<span class="tag ${k.reused ? "reuse" : "new"}" title="${esc(k.description || "")}">${k.reused ? "↺" : "＋"} ${esc(k.skill)}</span>` : "";
}
function renderRecipes() {
  if (!S.run.recipes.length) return;
  const names = Object.fromEntries(S.run.subtasks.map((s) => [s.id, s.name]));
  agentBody("skill_generator").innerHTML = S.run.recipes.map((r) => `<details class="item ${S.run.current === r.subtask_id ? "cur" : ""}" ${S.run.current === r.subtask_id ? "open" : ""}><summary><span class="k">${String(r.subtask_id).padStart(2, "0")}</span><span class="nm">${esc(names[r.subtask_id] || "")}</span>${skillTag(r.subtask_id)}</summary><pre class="code">${r.controllers.map((c) => ctrlText(c, r.subtask_id)).join("\n")}</pre></details>`).join("");
}
function setHud(badge, text) { $("#hud").classList.add("show"); $("#hud-badge").textContent = badge; $("#hud-text").textContent = text; }
function hideHud() { $("#hud").classList.remove("show"); }
function showResult(kind, title, small) {
  const r = $("#result");
  r.className = `result show ${kind}`;
  r.innerHTML = `${kind === "ok" ? I.check : kind === "bad" ? I.x : I.alert}<div><b>${esc(title)}</b><small>${esc(small || "")}</small></div>`;
}
function usage(u) {
  if (!u) return;
  $("#m-calls").textContent = u.calls; $("#m-tok").textContent = `${(u.input_tokens / 1000).toFixed(1)}k / ${u.output_tokens}`; $("#m-cost").textContent = "$" + u.cost.toFixed(3);
}
function renderSkills(list) {
  $("#skill-count").textContent = list.length;
  $("#skills-list").innerHTML = list.length ? list.map((s) => `<details class="skill"><summary><b>${esc(s.name)}</b><span class="st">${s.successes}/${s.uses} ok</span></summary><p>${esc(s.description)}</p><pre class="code">roles: ${esc(s.roles.join(", ") || "—")}\n${s.controllers.map(esc).join("\n")}</pre></details>`).join("")
    : `<div class="empty">No skills yet</div>`;
}
async function loadSkills() { try { renderSkills(await (await fetch(API + "/api/skills")).json()); } catch { /* ignore */ } }
$("#btn-clearskills").onclick = async () => { if (confirm("Delete all stored skills?")) { await fetch(API + "/api/skills", { method: "DELETE" }); loadSkills(); } };

/* ------------------------------------------------------------------ event stream */
function handle(ev) {
  const R = S.run;
  switch (ev.type) {
    case "started":
      S.t0 = Date.now();
      logLine(`“${ev.instruction}” · ${ev.planner === "bedrock" ? "Claude" : "demo"} · seed ${ev.seed}${ev.continuing ? " · continuing" : ""}`);
      if (!ev.verified) logLine("No ground-truth check exists for this command", "w");
      break;
    case "status": setHud("···", ev.text); logLine(ev.text); break;
    case "agent_start": setAgent(ev.agent, "run"); setHud("AI", `${ev.agent.replace(/_/g, " ")}…`); logLine(`→ ${ev.agent}${ev.label ? " (" + ev.label + ")" : ""}`); break;
    case "agent_rejected": logLine(`${ev.agent} answer rejected, retrying: ${ev.reason}`, "w"); break;
    case "agent": {
      setAgent(ev.agent, "done"); usage(ev.usage);
      const o = ev.output;
      if (ev.agent === "task_decomposer") {
        R.subtasks = o.subtasks; R.stepStatus = {}; renderSteps();
        agentBody("task_decomposer").innerHTML = (o.observations ? `<p class="obs">${esc(o.observations)}</p>` : "")
          + (o.feasible === false ? `<p class="nofeas">Not feasible — ${esc(o.reason)}</p>` : "<ol>" + o.subtasks.map((s) => `<li>${esc(s.name)}</li>`).join("") + "</ol>");
      } else if (ev.agent === "parameter_setter") {
        o.values.forEach((v) => (R.params[v.subtask_id + ":" + v.name] = v.value)); renderRecipes();
        agentBody("parameter_setter").innerHTML = `<details class="item"><summary><span class="k">${o.values.length}</span>parameter values</summary><div style="padding:6px 10px 10px"><table class="t"><tr><th>#</th><th>param</th><th>value</th><th>why</th></tr>${o.values.map((v) => `<tr><td>${v.subtask_id}</td><td>${esc(v.name)}</td><td>${v.value}</td><td>${esc(v.rationale || "")}</td></tr>`).join("")}</table></div></details>`;
      } else if (ev.agent === "vision_grounder") {
        logLine(`${ev.label}: ` + (o.points || []).map((p) => `${p.name} (${Math.round(p.u)}, ${Math.round(p.v)})`).join("  "));
        setAgent("vision_grounder", "run");
      }
      break;
    }
    case "recipes":
      R.recipes = ev.recipes; R.skillInfo = Object.fromEntries((ev.skills || []).map((s) => [s.subtask_id, s]));
      if (!R.subtasks.length) { R.subtasks = ev.recipes.map((r) => ({ id: r.subtask_id, name: "Subtask " + r.subtask_id })); renderSteps(); }
      renderRecipes();
      logLine(`skills: ${(ev.skills || []).filter((s) => s.reused).length} reused, ${(ev.skills || []).filter((s) => !s.reused).length} new`);
      break;
    case "library": renderSkills(ev.skills); break;
    case "obstacle":
      $("#obstacle").classList.add("show"); $("#obstacle-body").innerHTML += `<p>${esc(ev.text)}</p>`; logLine("Obstacle detected — the agents decide how to clear it", "w");
      AGENTS.forEach(([k]) => setAgent(k, "idle")); R.recipes = []; R.subtasks = []; R.stepStatus = {}; $("#stepper").innerHTML = "";
      break;
    case "grounding":
      setAgent("vision_grounder", "done"); V.showMarkers(ev.keypoints);
      { const im = $("#groundimg"); im.src = "data:image/jpeg;base64," + ev.image; im.style.display = "block"; }
      $("#groundtxt").innerHTML = `<table class="t"><tr><th>keypoint</th><th>pixel</th><th>world xyz (m)</th></tr>${Object.entries(ev.keypoints).map(([n, k]) => `<tr><td>${esc(n)}</td><td>${k.pixel ? k.pixel.map((x) => Math.round(x)).join(", ") : "–"}</td><td>${k.pos.map((x) => x.toFixed(3)).join(", ")}</td></tr>`).join("")}</table>`;
      if (ev.source) logLine("Re-grounded from the " + ev.source);
      break;
    case "subtask_start":
      R.current = ev.id; R.stepStatus[ev.id] = "run"; renderSteps(); renderRecipes(); setHud(String(ev.id).padStart(2, "0"), ev.name); logLine(`▶ ${ev.id}. ${ev.name}`);
      break;
    case "subtask_end":
      R.stepStatus[ev.id] = ev.ok ? "ok" : "bad"; renderSteps();
      logLine(`${ev.ok ? "✓" : "✗"} ${ev.id}. ${ev.name} — ${ev.ok ? ev.sim_s + " s" : ev.verdict}`, ev.ok ? "g" : "e");
      break;
    case "replan":
      logLine("Replanning: " + ev.reason, "w"); AGENTS.forEach(([k]) => setAgent(k, "idle")); R.recipes = []; R.subtasks = []; R.stepStatus = {}; $("#stepper").innerHTML = ""; V.clearMarkers();
      break;
    case "scene_state": showSceneState(ev); break;
    case "done": finish(ev.result); break;
    case "error":
      logLine("Error: " + ev.message, "e"); toast("err", "Something went wrong", ev.message); showResult("bad", "Error", ev.message); setRunning(false);
      if (ev.code === "no_credentials") openAws();
      break;
    case "ended": setRunning(false); hideHud(); break;
    case "stopped": logLine("Stopped", "w"); toast("info", "Stopped"); setRunning(false); hideHud(); break;
  }
}
function finish(r) {
  $("#m-sim").textContent = r.sim_s.toFixed(0) + " s"; $("#m-calls").textContent = r.llm_calls;
  $("#m-tok").textContent = `${(r.input_tokens / 1000).toFixed(1)}k / ${r.output_tokens}`; $("#m-cost").textContent = "$" + r.cost_usd.toFixed(3);
  hideHud();
  if (r.infeasible) return showResult("neutral", "The planner says this can't be done with this robot", r.error.replace("cannot do this: ", ""));
  const preds = Object.entries(r.predicates || {}).map(([k, v]) => `${k}: ${v ? "true" : "false"}`).join(" · ");
  const extra = [`${r.subtasks_ok}/${r.subtasks_total} subtasks`, r.replans ? `${r.replans} replan${r.replans > 1 ? "s" : ""}` : null, r.obstacles_cleared ? "obstacle cleared" : null, r.grounding_err_mm_mean != null ? `grounding error ${r.grounding_err_mm_mean.toFixed(1)} mm` : null, preds || (r.verified ? null : "not verified against ground truth"), r.error ? "error: " + r.error : null].filter(Boolean).join("  ·  ");
  showResult(r.success ? "ok" : "bad", r.success ? (r.verified ? "Task completed" : "Finished without errors") : "Task failed", extra);
}

/* ------------------------------------------------------------------ run / stop / socket */
function setRunning(v) {
  S.running = v;
  const b = $("#run");
  b.className = "btn " + (v ? "danger" : "primary");
  b.innerHTML = v ? `${I.stop}<span>Stop</span>` : `${I.play}<span>Run</span>`;
  ["#task", "#seed", "#seed-dice", "#btn-reset", "#skills"].forEach((s) => ($(s).disabled = v));
  $$("#scene, #seg-planner button, #seg-grounding button").forEach((x) => (x.disabled = v));
}
function start() {
  if (!S.ws || S.ws.readyState !== 1) return toast("err", "Not connected", "The server connection is down. Retrying…");
  if (!V.ready) return toast("info", "Still loading", "The 3D scene is not ready yet.");
  if (S.planner === "bedrock" && !S.aws && !(S.cfg.bedrock_ready && !S.cfg.require_user_keys)) { openAws(); return toast("info", "Connect AWS first", "Add your credentials to use Claude."); }
  resetRun(); setRunning(true); S.t0 = Date.now();
  const msg = { type: "run", scene: S.scene, instruction: $("#task").value.trim(), llm: S.planner, grounding: S.grounding, speed: +S.speed, skills: $("#skills").checked, seed: +$("#seed").value || 0 };
  if (S.planner === "bedrock" && S.aws) { msg.credentials = { ...S.aws.creds }; msg.model = S.aws.model; }
  S.ws.send(JSON.stringify(msg));
}
$("#run").onclick = () => (S.running ? S.ws.send(JSON.stringify({ type: "stop" })) : start());

function connect() {
  const ws = (S.ws = new WebSocket((API ? API.replace(/^http/, "ws") : (location.protocol === "https:" ? "wss://" : "ws://") + location.host) + "/ws"));
  ws.binaryType = "arraybuffer";
  ws.onopen = () => {
    $("#conn").classList.add("on"); $("#conn").title = "Connected";
    ws.send(JSON.stringify({ type: "load", scene: S.scene, seed: +$("#seed").value || 0 }));
    const q = new URLSearchParams(location.search); // ?autorun=1&scene=&cmd=&speed=&seed=&planner=  (demos / tests)
    if (q.has("autorun") && !window.__ran) {
      window.__ran = true;
      if (q.get("scene")) { S.scene = q.get("scene"); renderScenes(); fillExamples(true); }
      if (q.get("seed")) $("#seed").value = q.get("seed");
      if (q.get("speed")) { S.speed = q.get("speed"); segSpeed.set(S.speed); }
      if (q.get("planner")) { S.planner = q.get("planner"); segPlanner.set(S.planner); renderPlannerNote(); }
      if (q.get("cmd")) $("#task").value = q.get("cmd");
      resetScene();
      const go = () => (V.ready ? start() : setTimeout(go, 200));
      setTimeout(go, 500);
    }
  };
  ws.onclose = () => { $("#conn").classList.remove("on"); $("#conn").title = "Reconnecting…"; setRunning(false); setTimeout(connect, 1500); };
  ws.onmessage = (m) => {
    if (typeof m.data === "string") return handle(JSON.parse(m.data));
    const kind = new Uint8Array(m.data, 0, 1)[0];
    if (kind === 1) { // live body poses: [t, nbody * (x y z qw qx qy qz)]
      const f = new Float32Array(m.data, 4);
      if (V.ready) V.applyPoses(f.subarray(1));
      $("#pill-sim").textContent = `t = ${f[0].toFixed(1)} s`; if (S.running) $("#m-sim").textContent = f[0].toFixed(1) + " s";
    } else { // agent camera frame
      const url = URL.createObjectURL(new Blob([m.data.slice(4)], { type: "image/jpeg" })), old = S.frameUrl;
      $("#frame").src = url; S.frameUrl = url; if (old) setTimeout(() => URL.revokeObjectURL(old), 500);
    }
  };
}

/* ------------------------------------------------------------------ viewport tools + tabs */
$("#btn-view").onclick = () => V.resetView();
$("#btn-pip").onclick = () => { const p = $("#pip"); const on = p.style.display === "none"; p.style.display = on ? "" : "none"; $("#btn-pip").classList.toggle("on", on); };
$$("#tabs .tab").forEach((t) => (t.onclick = () => {
  $$("#tabs .tab").forEach((x) => x.classList.toggle("on", x === t));
  $$(".pane").forEach((p) => p.classList.toggle("on", p.id === "pane-" + t.dataset.pane));
}));
document.addEventListener("keydown", (e) => { if (e.key === "Escape" && modal.open) modal.close(); });

/* ------------------------------------------------------------------ boot */
(async function init() {
  S.aws = loadAws();
  buildAgents(); resetRun();
  S.cfg = await (await fetch(API + "/api/config")).json();
  S.cfg.scenes.forEach((s) => (S.scenes[s.name] = s));
  if (!S.scenes[S.scene]) S.scene = S.cfg.scenes[0].name;
  renderScenes(); fillExamples(true); renderAwsChip(); renderSkills([]);
  connect(); loadScene(); loadSkills();
})();
