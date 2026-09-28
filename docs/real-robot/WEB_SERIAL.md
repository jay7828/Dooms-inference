# Driving the SO-101 from the browser (Web Serial) — design note

**Status:** proposal, not built. **Today:** the hosted website shows "Use the desktop app" for real robots; the desktop
app (and the website run locally with `python scripts/serve.py`) supports the real SO-101 fully.

## 1. The problem

On the hosted website the server runs in the cloud. The real-robot code opens the arm's USB serial port and the camera
**on the server**, which works only when the server runs on the computer the arm is plugged into. A cloud server cannot
see anyone's USB devices, so real-robot mode is switched off there (`DOOMS_HOSTED=1`).

Option B keeps "nothing to install": the **browser** talks to the arm directly, using Chrome's Web Serial API, and to the
camera with `getUserMedia`.

## 2. How it would work

```
 user's computer                                                    cloud
┌──────────────────────────────────────────────────────┐        ┌──────────────────────────┐
│ Chrome tab                                            │        │ Dooms server             │
│  ├─ Web Serial ──USB── SO-101 servo bus               │  WSS   │  ├─ Task Decomposer       │
│  ├─ getUserMedia ───── overview camera                │◄──────►│  ├─ Skill Generator       │
│  ├─ control loop (50 Hz) + safety layer  [must be     │ plans, │  ├─ Parameter Setter      │
│  │   local: see section 3]                            │ images │  ├─ Vision Grounder       │
│  └─ 3D twin, setup wizard (as today)                  │        │  └─ skill library         │
└──────────────────────────────────────────────────────┘        └──────────────────────────┘
```

Per task, only a handful of messages cross the internet: the camera image goes up; the plan, skill recipes, numbers and
grounded keypoints come down; subtask results go up. Internet lag of a few hundred milliseconds does not matter for these.

## 3. The key decision: where the control loop runs

The arm is steered by a closed loop: 50 times a second it reads the joints, the controllers compute the next small
motion, and the result is written to the servos. Safety checks (collision/overload, table guard, limits, temperature,
voltage) run inside that loop.

**B1 — relay the loop to the cloud (rejected).** The browser only forwards bytes; the loop runs on the server.

| Problem | Why it matters |
|---|---|
| Round trip 50-300 ms vs a 20 ms loop | The controller acts on joint readings that are 3-15 ticks old: overshoot, oscillation, jerky motion near objects. |
| Jitter and lost packets | Uneven command timing; the stall detector and tolerances misfire. |
| Remote safety | A collision is seen only after the round trip; stopping is delayed by the same lag. |
| Connection drop mid-motion | The loop is gone. The servos stop at the last goal (each goal is a small step, so the arm halts), but mid-grasp or mid-carry, with nothing supervising. |

**B2 — run the loop in the browser (the only acceptable variant).** The browser does exactly what the desktop app's
local server does today: protocol, calibration, controllers, safety, all next to the arm. The cloud only plans. A
network drop then means "finish or halt the current subtask safely and wait", not "arm without supervision".

## 4. What B2 needs in the browser

| Piece | Today (Python, tested) | In the browser | Effort |
|---|---|---|---|
| Feetech STS protocol | `hardware/feetech.py` | TypeScript over Web Serial (`port.readable/writable`) | small |
| Arm calibration + setup wizard | `hardware/so101.py`, `session.py` | port the state machine; the UI already exists | medium |
| Safety layer | `hardware/real_env.py` | port as is; must run in the same place as the loop | medium |
| Kinematics (forward kinematics, Jacobian) | MuJoCo twin | MuJoCo WebAssembly build, or a hand-written 5-joint model | medium-large |
| Controllers + prioritised null-space solver | `controllers/`, `execution/` | port (small linear algebra: SVD of at most 6×5 matrices) | large |
| Depth-free grounding + camera calibration | `perception/`, `camera_calibration.py` | OpenCV.js, or keep on the server (image in, 3D points out) | medium |
| Camera | OpenCV capture | `getUserMedia` (all major browsers) | small |

Keeping planning, grounding and camera calibration on the server limits the port to protocol, calibration, safety,
kinematics and controllers. Everything else is reused.

## 5. Browser and platform support

| | Web Serial (arm) | Camera |
|---|---|---|
| Chrome / Edge / Opera, desktop (Windows, macOS, Linux, ChromeOS) | yes | yes |
| Firefox | **no** | yes |
| Safari | **no** | yes |
| Phones / tablets | not a target (the arm needs a USB host computer anyway) | — |

Also: Web Serial works only on HTTPS pages, and the person must pick the port once from the browser's prompt (the
permission is remembered per site). Only one tab can hold the port at a time. Linux users may need to be in the
`dialout` group.

## 6. Failure modes and how B2 handles them

| Event | Result with B2 |
|---|---|
| Internet drops | The local loop completes or halts the current subtask and holds; the next subtask waits for the server. |
| Tab hidden / minimised | Chrome throttles page timers in background tabs, so the loop runs in a dedicated Web Worker; to be safe, motion also pauses while the tab is hidden. |
| Tab closed, page reloaded, browser crash, laptop sleep | The loop stops; the servos hold the last goal (a small step from the current pose), so the arm stops and holds. |
| USB unplugged | Same as above; the page reports "lost the connection". |
| Two tabs | The second cannot open the port (locked). |
| Stop / Esc | Handled locally: immediate hold, no server round trip. |

The power switch stays the real emergency stop, as everywhere.

## 7. Security

- The site can only open the port the person chose in the browser prompt; the server never gets raw serial access.
- The server sends plans and numbers, not motor commands; limits, speed caps and safety checks are enforced in the
  browser, next to the arm, whatever the server sends.
- Camera frames go to the server only when a task needs them (planning and grounding).

## 8. Comparison

| | A. Local robot bridge | **B2. Browser (Web Serial)** | C. Desktop app (today) |
|---|---|---|---|
| Install | small helper app | nothing | desktop app |
| Browsers | any | Chrome / Edge only | n/a |
| Control loop + safety | local, existing Python | local, rewritten in TypeScript/WASM | local, existing Python |
| New code | little (reuse `hardware/`) | most of the real-robot stack re-implemented | none |
| Risk | low | medium: two implementations to keep in sync | none |
| Rough effort | about 1 week | about 3-4 weeks including testing | done |

## 9. Testing plan (if built)

- A browser build of the virtual SO-101: the same servo model as `hardware/virtual.py`, exposed to the page as a fake
  serial port, so the whole flow runs in CI without hardware (as the Python version is tested today).
- Cross-check: for the same joint readings and plan, the browser loop must command the same goals as the Python loop.
- Fault injection: drop the WebSocket mid-motion, hide the tab, unplug (close) the port, and require the arm to hold.
- Then a real arm at low speed, following the existing guide.

## 10. Recommendation

1. **Now:** hosted website = simulation; real robots via the desktop app (done).
2. **Next, if the website must drive real arms:** option A (a small local bridge) reuses the tested Python stack and works
   in every browser.
3. **Option B2** only if "no install at all" is a hard requirement and Chrome/Edge-only is acceptable. Never B1.
