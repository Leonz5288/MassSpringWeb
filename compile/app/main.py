
import taichi as ti
import numpy as np
import math
import hub

max_steps = 4096
vis_interval = 256
output_vis_interval = 8
steps = 1024
assert steps * 2 <= max_steps
head_id = 0
elasticity = 0.0
gravity = -1.8
friction = 2.5
gradient_clip = 1
spring_omega = 10
damping = 15
n_objects = 50
n_springs = 100
n_sin_waves = 10
n_hidden = 32
n_input_states = n_sin_waves + 4 * n_objects + 2

max_num_particle = 256
max_num_spring = 512
dt = 0.004
learning_rate = 25
ground_height = 0.1

pos = ti.Vector.field(2, float, max_num_particle)
spring_anchor_a = ti.field(int, n_springs)
spring_anchor_b = ti.field(int, n_springs)

real_obj = ti.field(int, ()) ## used to store real num_obj
real_spring = ti.field(int, ()) ## used to store real num_spring
obj_mask = ti.field(int, n_objects)
spring_mask = ti.field(int, n_springs)

x = ti.Vector.field(2, float)
v = ti.Vector.field(2, float)
v_inc = ti.Vector.field(2, float)
ti.root.dense(ti.l, max_steps).dense(ti.i, n_objects).place(x, v, v_inc)
    
loss = ti.field(float, ())
spring_length = ti.field(float, n_springs)
spring_stiffness = ti.field(float, n_springs)
spring_actuation = ti.field(float, n_springs)
weights1 = ti.field(float, (n_hidden, n_input_states))
bias1 = ti.field(float, n_hidden)
weights2 = ti.field(float, (n_springs, n_hidden))
bias2 = ti.field(float, n_springs)
hidden = ti.field(float, (max_steps, n_hidden))
center = ti.Vector.field(2, float, max_steps)
target_v = ti.Vector.field(2, float, max_steps)
act = ti.field(float, (max_steps, n_springs))
increase = ti.field(int, ())

ti.root.lazy_grad()


objects = []
springs = []
points = []
point_id = []
mesh_springs = []

@hub.kernel
def set_mask():
    real_obj[None] = 0
    real_spring[None] = 0
    for i in range(n_objects):
        obj_mask[i] = 0
    for i in range(n_springs):
        spring_mask[i] = 0

@hub.kernel
def pass_point(a: float, b: float):
    i = real_obj[None]
    x[0, i][0] = a
    x[0, i][1] = b
    real_obj[None] += 1

@hub.kernel
def pass_spring(a: int, b: int, length: float, stiff: float, act: float):
    i = real_spring[None]
    spring_anchor_a[i] = a
    spring_anchor_b[i] = b
    spring_length[i] = length
    spring_stiffness[i] = stiff
    spring_actuation[i] = act
    real_spring[None] += 1

@hub.kernel
def pass_parameter(rate: int, head:int):
    learning_rate = rate
    head_id = head

@hub.kernel
def reset() -> int:
    loss[None] = 0
    loss.grad[None] = 1
    increase[None] = 0

    for i in range(real_obj[None]):
        obj_mask[i] = 1
    for i in range(real_spring[None]):
        spring_mask[i] = 1
    return steps

@hub.kernel
def set_target():
    for i in range(max_steps):
        if i < 512:
            target_v[i][0] = 0.1
        else:
            target_v[i][0] = 0.1
        target_v[i][1] = 0.0

@hub.kernel
def compute_center(t: int):
    for _ in range(1):
        c = ti.Vector([0.0, 0.0])
        for i in ti.static(range(n_objects)):
            c += x[t, i] * obj_mask[i]
        center[t] = (1.0 / real_obj[None]) * c

@hub.grad
def compute_center_grad(t: int):
    for _ in range(1):
        c = ti.Vector([0.0, 0.0])
        for i in ti.static(range(n_objects)):
            c += x[t, i] * obj_mask[i]
        center[t] = (1.0 / real_obj[None]) * c

@hub.kernel
def nn1(t: int):
    for i in range(n_hidden):
        actuation = 0.0
        for j in ti.static(range(n_sin_waves)):
            actuation += weights1[i, j] * ti.sin(spring_omega * increase[None] * dt + 2 * math.pi / n_sin_waves * j)
        for j in ti.static(range(n_objects)):
            offset = (x[t, j] - center[t]) * obj_mask[i]
            # use a smaller weight since there are too many of them
            actuation += weights1[i, j * 4 + n_sin_waves] * offset[0] * 0.05 * obj_mask[i]
            actuation += weights1[i, j * 4 + n_sin_waves + 1] * offset[1] * 0.05 * obj_mask[i]
            actuation += weights1[i, j * 4 + n_sin_waves + 2] * v[t, j][0] * 0.05 * obj_mask[i]
            actuation += weights1[i, j * 4 + n_sin_waves + 3] * v[t, j][1] * 0.05 * obj_mask[i]
        actuation += weights1[i, real_obj[None] * 4 + n_sin_waves] * target_v[t][0]
        actuation += weights1[i, real_obj[None] * 4 + n_sin_waves + 1] * target_v[t][1]
        actuation += bias1[i]
        actuation = ti.tanh(actuation)
        hidden[t, i] = actuation

@hub.grad
def nn1_grad(t: int):
    for i in range(n_hidden):
        actuation = 0.0
        for j in ti.static(range(n_sin_waves)):
            actuation += weights1[i, j] * ti.sin(spring_omega * increase[None] * dt + 2 * math.pi / n_sin_waves * j)
        for j in ti.static(range(n_objects)):
            offset = (x[t, j] - center[t]) * obj_mask[i]
            # use a smaller weight since there are too many of them
            actuation += weights1[i, j * 4 + n_sin_waves] * offset[0] * 0.05 * obj_mask[i]
            actuation += weights1[i, j * 4 + n_sin_waves + 1] * offset[1] * 0.05 * obj_mask[i]
            actuation += weights1[i, j * 4 + n_sin_waves + 2] * v[t, j][0] * 0.05 * obj_mask[i]
            actuation += weights1[i, j * 4 + n_sin_waves + 3] * v[t, j][1] * 0.05 * obj_mask[i]
        actuation += weights1[i, real_obj[None] * 4 + n_sin_waves] * target_v[t][0]
        actuation += weights1[i, real_obj[None] * 4 + n_sin_waves + 1] * target_v[t][1]
        actuation += bias1[i]
        actuation = ti.tanh(actuation)
        hidden[t, i] = actuation

@hub.kernel
def nn2(t: int):
    for i in range(real_spring[None]):
        actuation = 0.0
        for j in ti.static(range(n_hidden)):
            actuation += weights2[i, j] * hidden[t, j]
        actuation += bias2[i]
        actuation = ti.tanh(actuation)
        act[t, i] = actuation

@hub.grad
def nn2_grad(t: int):
    for i in range(real_spring[None]):
        actuation = 0.0
        for j in ti.static(range(n_hidden)):
            actuation += weights2[i, j] * hidden[t, j]
        actuation += bias2[i]
        actuation = ti.tanh(actuation)
        act[t, i] = actuation

@hub.kernel
def apply_spring_force(t: int):
    for i in range(real_spring[None]):
        a = spring_anchor_a[i]
        b = spring_anchor_b[i]
        pos_a = x[t, a]
        pos_b = x[t, b]
        dist = pos_a - pos_b
        length = dist.norm() + 1e-4

        target_length = spring_length[i] * (1.0 + spring_actuation[i] * act[t, i])
        impulse = dt * (length - target_length) * spring_stiffness[i] / length * dist

        ti.atomic_add(v_inc[t + 1, a], -impulse)
        ti.atomic_add(v_inc[t + 1, b], impulse)

@hub.grad
def apply_spring_force_grad(t: int):
    for i in range(real_spring[None]):
        a = spring_anchor_a[i]
        b = spring_anchor_b[i]
        pos_a = x[t, a]
        pos_b = x[t, b]
        dist = pos_a - pos_b
        length = dist.norm() + 1e-4

        target_length = spring_length[i] * (1.0 + spring_actuation[i] * act[t, i])
        impulse = dt * (length - target_length) * spring_stiffness[i] / length * dist

        ti.atomic_add(v_inc[t + 1, a], -impulse)
        ti.atomic_add(v_inc[t + 1, b], impulse)

@hub.kernel
def advance_toi(t: int):
    for i in range(real_obj[None]):
        s = ti.exp(-dt * damping)
        old_v = s * v[t - 1, i] + dt * gravity * ti.Vector([0.0, 1.0]) + v_inc[t, i]
        old_x = x[t - 1, i]
        new_x = old_x + dt * old_v
        toi = 0.0
        new_v = old_v
        if new_x[1] < ground_height and old_v[1] < -1e-4:
            toi = -(old_x[1] - ground_height) / old_v[1]
            new_v = ti.Vector([0.0, 0.0])
        new_x = old_x + toi * old_v + (dt - toi) * new_v

        v[t, i] = new_v
        x[t, i] = new_x

@hub.grad
def advance_toi_grad(t: int):
    for i in range(real_obj[None]):
        s = ti.exp(-dt * damping)
        old_v = s * v[t - 1, i] + dt * gravity * ti.Vector([0.0, 1.0]) + v_inc[t, i]
        old_x = x[t - 1, i]
        new_x = old_x + dt * old_v
        toi = 0.0
        new_v = old_v
        if new_x[1] < ground_height and old_v[1] < -1e-4:
            toi = -(old_x[1] - ground_height) / old_v[1]
            new_v = ti.Vector([0.0, 0.0])
        new_x = old_x + toi * old_v + (dt - toi) * new_v

        v[t, i] = new_v
        x[t, i] = new_x

@hub.kernel
def compute_loss(t: int):
    ti.atomic_add(loss[None], dt * (target_v[t][0] - v[t, head_id][0])**2)

@hub.grad
def compute_loss_grad(t: int):
    ti.atomic_add(loss[None], dt * (target_v[t][0] - v[t, head_id][0])**2)

@hub.kernel
def clear_states():
    increase[None] = 0
    for t in range(0, max_steps):
        for i in range(0, real_obj[None]):
            v_inc[t, i] = ti.Vector([0.0, 0.0])

@hub.kernel
def render(t: int):
    for i in range(real_obj[None]):
        pos[i] = x[t, i]

@hub.kernel
def increasing():
    increase[None] += 1

@hub.kernel
def clear_gradients():
    loss[None] = 0.0
    loss.grad[None] = 1.0
    for i in range(n_hidden):
        for j in range(n_sin_waves + 4 * real_obj[None] + 2):
            weights1.grad[i, j] = 0.0
        bias1.grad[i] = 0.0
    for i in range(real_spring[None]):
        for j in range(n_hidden):
            weights2.grad[i, j] = 0.0
        bias2.grad[i] = 0.0
    for i in range(max_steps):
        center.grad[i] = ti.Vector([0.0, 0.0])
        target_v.grad[i] = ti.Vector([0.0, 0.0])
        for j in range(real_obj[None]):
            x.grad[i, j] = ti.Vector([0.0, 0.0])
            v.grad[i, j] = ti.Vector([0.0, 0.0])
            v_inc.grad[i, j] = ti.Vector([0.0, 0.0])
        for j in range(real_spring[None]):
            act.grad[i, j] = 0.0
        for j in range(n_hidden):
            hidden.grad[i, j] = 0.0
    for i in range(real_spring[None]):
        spring_length.grad[i] = 0.0
        spring_stiffness.grad[i] = 0.0
        spring_actuation.grad[i] = 0.0

@hub.kernel
def copy_status(d: int):
    for i in range(real_obj[None]):
        x[0, i] = x[1, i]
        v[0, i] = v[1, i]
        v_inc[0, i] = ti.Vector([0, 0])
        v_inc[1, i] = ti.Vector([0, 0])
    for i in range(real_spring[None]):
        act[0, i] = 0.0
    for i in range(n_hidden):
        hidden[0, i] = 0.0
    center[0] = ti.Vector([0, 0])
    if d == 0:
        target_v[0] = ti.Vector([-1.0, 0.0])
    elif d == 2:
        target_v[0] = ti.Vector([0.0, 0.0])
    elif d == 1:
        target_v[0] = ti.Vector([0.1, 0.0])

@hub.kernel
def optimize():
    for i in range(n_hidden):
        for j in range(n_sin_waves + 4 * real_obj[None] + 2):
            weights1[i, j] = ti.random() * ti.sqrt(2 / (n_hidden + (n_sin_waves + 4 * real_obj[None] + 2))) * 2

    for i in range(real_spring[None]):
        for j in range(n_hidden):
            # TODO: n_springs should be n_actuators
            weights2[i, j] = ti.random() * ti.sqrt(2 / (n_hidden + real_spring[None])) * 3
        
@hub.kernel
def optimize1(iter: int) -> float:
    #print('Iter=', iter, 'Loss=', loss[None])

    total_norm_sqr = 0.0
    for i in range(n_hidden):
        for j in range(n_sin_waves + 4 * real_obj[None] + 2):
            total_norm_sqr += weights1.grad[i, j]**2
        total_norm_sqr += bias1.grad[i]**2

    for i in range(real_spring[None]):
        for j in range(n_hidden):
            total_norm_sqr += weights2.grad[i, j]**2
        total_norm_sqr += bias2.grad[i]**2

    gradient_clip = 0.1
    ##scale = learning_rate * min(1.0, gradient_clip / total_norm_sqr ** 0.5)
    scale = gradient_clip / (total_norm_sqr ** 0.5 + 1e-6)
    for i in range(n_hidden):
        for j in range(n_sin_waves + 4 * real_obj[None] + 2):
            weights1[i, j] -= scale * weights1.grad[i, j]
        bias1[i] -= scale * bias1.grad[i]

    for i in range(real_spring[None]):
        for j in range(n_hidden):
            weights2[i, j] -= scale * weights2.grad[i, j]
        bias2[i] -= scale * bias2.grad[i]

    return loss[None]

hub.bind_particles(pos)
hub.bind_spring_anchors(spring_anchor_a, spring_anchor_b)