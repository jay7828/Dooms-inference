import numpy as np

from dooms.controllers.base import Context, Keypoint
from dooms.controllers.pos_align import PosAlign
from dooms.controllers.stack import solve_stack
from dooms.controllers.base import TaskTerm
from dooms.sim.base import RobotState


class FakeRobot:
    n_joints = 3

    def jacobian(self, p):
        return np.eye(3), np.zeros((3, 3))


def _ctx(tcp):
    s = RobotState(np.zeros(3), np.zeros(3), np.array(tcp, float), np.eye(3), 0.08, np.zeros(6))
    cfg = {"execution": {"pos_gain": 5.0, "max_lin_speed": 0.3, "pos_tol": 0.005}}
    return Context(FakeRobot(), s, {"a": Keypoint("a", np.array([0.5, 0.0, 0.1]), np.array([0, 0, 1.0]))}, cfg)


def test_pos_align_error_and_offset():
    ctx = _ctx([0.5, 0.0, 0.0])
    c = PosAlign("eef_tcp", "a", "z", 0.05)
    c.on_stage_start(ctx)
    t = c.term(ctx)
    assert np.isclose(t.e[0], 0.15)         # target z = 0.1 + 0.05
    assert not c.finished(ctx)
    assert c.finished(_ctx([0.5, 0.0, 0.15]))


def test_stack_respects_priority():
    e_z = TaskTerm(J=np.array([[0, 0, 1.0]]), e=np.array([0.1]), gain=1.0, v_max=1.0)
    e_conflict = TaskTerm(J=np.array([[0, 0, 1.0]]), e=np.array([-0.1]), gain=1.0, v_max=1.0)
    dq = solve_stack([[e_z], [e_conflict]], 3, damping=1e-3)
    assert dq[2] > 0.09                     # the high-priority task wins
