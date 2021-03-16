class Taichi {
    constructor(module) {
        this.module = module;
    }

    set_arg_int(index, value) {
        let args_base = this.module._Ti_args/4 + index * 2;
        let args = this.module.HEAP32.subarray(args_base, args_base + 1);

        args[0] = value;
    }

    set_arg_float(index, value) {
        let args_base = this.module._Ti_args/4 + index * 2;
        let args = this.module.HEAPF32.subarray(args_base, args_base + 1);

        args[0] = value;
    }

    get_ret_int(index, value) {
        let args_base = this.module._Ti_args/4 + index * 2;
        let args = this.module.HEAP32.subarray(args_base, args_base + 1);

        return args[0];
    }

    get_ret_float(index, value) {
        let args_base = this.module._Ti_args/4 + index * 2;
        let args = this.module.HEAPF32.subarray(args_base, args_base + 1);

        return args[0];
    }

    set_ext_arr(index, shape) {
        let earg_base = this.module._Ti_earg/4 + index * 8;
        let args_base = this.module._Ti_args/4 + index * 2;
        let earg = this.module.HEAP32.subarray(earg_base, earg_base + 8);
        let args = this.module.HEAP32.subarray(args_base, args_base + 1);

        args[0] = this.module._Ti_extr;

        let size = 1;
        for (let i = 0; i < shape.length; i++) {
            earg[i] = shape[i];
            size *= shape[i];
        }

        return size;
    }

    set_ext_arr_float(index, shape) {
        let size = this.set_ext_arr(index, shape);
        let extr_base = this.module._Ti_extr/4;
        let extr = this.module.HEAPF32.subarray(extr_base, extr_base + size);
        return extr;
    }

    set_ext_arr_int(index, shape) {
        let size = this.set_ext_arr(index, shape);
        let extr_base = this.module._Ti_extr/4;
        let extr = this.module.HEAP32.subarray(extr_base, extr_base + size);
        return extr;
    }

    set_ext_arr_uint8(index, shape) {
        let size = this.set_ext_arr(index, shape);
        let extr_base = this.module._Ti_extr;
        let extr = this.module.HEAPU8.subarray(extr_base, extr_base + size);
        return extr;
    }

    get(name) {
        let ret = this.module['_Tk_' + name];
        if (typeof ret == 'undefined') {
            for (let key in this.module) {
                if (key.startsWith('_Tk_' + name)) {
                    ret = this.module[key];
                    this.module['_Tk_' + name] = ret;
                    break;
                }
            }
        }
        if (typeof ret == 'undefined')
            return undefined;
        return function() {
            return ret(this.module._Ti_ctx);
        }.bind(this);
    }

    get_config_int(name) {
        let base = this.module['_Ti_cfg_' + name];
        if (typeof base == 'undefined')
            return undefined;
        return this.module.HEAP32[base/4];
    }

    get_config_float(name) {
        let base = this.module['_Ti_cfg_' + name];
        if (typeof base == 'undefined')
            return undefined;
        return this.module.HEAPF32[base/4];
    }

    get_config_str(name) {
        let base = this.module['_Ti_cfg_' + name];
        if (typeof base == 'undefined')
            return undefined;
        let ret = '';
        for (var i = base; this.module.HEAPU8[i] != 0; i++) {
            ret += String.fromCharCode(this.module.HEAPU8[i]);
        }
        return ret;
    }

    ready(cb) {
        this.module.onRuntimeInitialized = cb;
    }
}

class TaichiGUI {
    constructor(canvas, resx, resy) {
        this.resx = resx || 512;
        this.resy = resy || this.resx;
        this.canvas = canvas;
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = this.resx;
        this.canvas.height = this.resy;
        this.stopped = false;
    }

    animation(callback) {
        let that = this;
        function wrapped() {
            if (that.stopped) {
                return;
            }

            callback();
            window.requestAnimationFrame(wrapped);
        }
        wrapped();
    }

    circles(pos, radius) {
        radius = 5;
        this.ctx.fillStyle = 'black';
        for (let i = 0; i < pos.length;) {
            let x = (pos[i++]/2.0 * this.resx) % this.resx;
            let y = this.resy - ((pos[i++]/1.0 * this.resy) % this.resy);
            this.ctx.beginPath();
            this.ctx.arc(x, y, radius, 0, 2 * Math.PI);
            this.ctx.fill();
        }
    }

    line(pos1, pos2) {
        let x1 = (pos1[0]/2.0 * this.resx) % this.resx;
        let y1 = this.resy - ((pos1[1]/1.0 * this.resy) % this.resy);
        let x2 = (pos2[0]/2.0 * this.resx) % this.resx;
        let y2 = this.resy - ((pos2[1]/1.0 * this.resy) % this.resy);
        this.ctx.beginPath();
        this.ctx.moveTo(x1, y1);
        this.ctx.lineTo(x2, y2);
        this.ctx.stroke();
    }

    ground() {
        this.ctx.fillStyle = 'white';
        this.ctx.fillRect(0, 0, this.resx, this.resy);
        this.ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
        this.ctx.fillRect(0, 0.9*this.resy, this.resx, this.resy);
    }
}

if (typeof exports != 'undefined') {
    exports.Taichi = Taichi;
}