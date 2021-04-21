import taichi as ti
import numpy as np
import atexit

ti.init()


def kernel(foo):
    from taichi.lang.kernel import _kernel_impl
    foo = _kernel_impl(foo, level_of_class_stackframe=3)
    nargs = foo._primal.func.__code__.co_argcount
    args = [0 for i in range(nargs)]
    foo(*args)
    return foo

def grad(foo):
    from taichi.lang.kernel import _kernel_impl
    foo = _kernel_impl(foo, level_of_class_stackframe=3)
    nargs = foo._adjoint.func.__code__.co_argcount
    args = [0 for i in range(nargs)]
    foo.grad(*args)
    return foo.grad

def substep_nr(num):
    @ti.kernel
    def hub_get_substep_nr() -> int:
        return num

    hub_get_substep_nr()


def bind_particles(pos, num=None):
    if num is None:
        num = pos.shape[0]

    @ti.kernel
    def hub_get_num_particles() -> int:
        if ti.static(isinstance(num, int)):
            return num
        else:
            return num[None]

    @ti.kernel
    def hub_get_particles(posout: ti.ext_arr()):
        for I in ti.grouped(pos):
            for j in ti.static(range(2)):
                posout[I, j] = pos[I][j]

    posout = np.empty((*pos.shape, 2), dtype=np.float32)
    hub_get_num_particles()
    hub_get_particles(posout)

def bind_spring_anchors(pos1, pos2, num=None):
    if num is None:
        num = pos1.shape[0]

    @ti.kernel
    def get_num_springs() -> int:
        if ti.static(isinstance(num, int)):
            return num
        else:
            return num[None]

    @ti.kernel
    def get_spring_anchors(posout: ti.ext_arr()):
        for i in range(num):
            posout[i] = pos1[i]
        for i in range(num):
            posout[i + num] = pos2[i]

    posout = np.empty(num * 2, dtype=np.int32)
    get_num_springs()
    get_spring_anchors(posout)



import hub

__all__ = [
    'hub',
    'ti',
]
