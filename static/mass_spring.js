paused = true;
direction = 1;

class MassSpring {
  constructor(canvas) {
    this.frame = 1;
    this.steps = 0;

    this.canvas = canvas;

    this.loss = [];
  }

  play() {
    console.log("play()");
    this.terminate();

    this.gui = new TaichiGUI(
      this.canvas,
      this.canvas.width,
      this.canvas.height
    );

    this.reset = this.program.get("reset");
    this.render = this.program.get("render");
    this.increasing = this.program.get("increasing");
    this.set_mask = this.program.get("set_mask");
    this.pass_point = this.program.get("pass_point");
    this.pass_spring = this.program.get("pass_spring");

    this.compute_center = this.program.get("compute_center");
    this.nn1 = this.program.get("nn1");
    this.nn2 = this.program.get("nn2");
    this.apply_spring_force = this.program.get("apply_spring_force");
    this.advance_toi = this.program.get("advance_toi");
    this.compute_loss = this.program.get("compute_loss");
    this.clear_states = this.program.get("clear_states");

    this.compute_center_grad = this.program.get("compute_center_grad");
    this.nn1_grad = this.program.get("nn1_grad");
    this.nn2_grad = this.program.get("nn2_grad");
    this.apply_spring_force_grad = this.program.get("apply_spring_force_grad");
    this.advance_toi_grad = this.program.get("advance_toi_grad");
    this.compute_loss_grad = this.program.get("compute_loss_grad");
    this.clear_gradients = this.program.get("clear_gradients");

    this.optimize = this.program.get("optimize");
    this.optimize1 = this.program.get("optimize1");

    this.copy_status = this.program.get("copy_status");
    this.export_data = this.program.get("hub_get_particles");
    this.get_num_particles = this.program.get("hub_get_num_particles");
    if (typeof this.get_num_particles == "undefined") {
      this.get_num_particles = function () {
        program.set_arg_int(0, 8192);
      };
    } // TODO: may delete??

    this.get_anchors = undefined;
    this.get_num_springs = this.program.get("get_num_springs");
    this.get_spring_anchors = this.program.get("get_spring_anchors");

    this.set_mask();
    for (var i = 0; i < points.length; i++) {
      this.program.set_arg_float(0, points[i].x / 512);
      this.program.set_arg_float(1, 1 - points[i].y / 512);
      this.pass_point();
    }
    for (var i = 0; i < springs.length; i++) {
      this.program.set_arg_int(0, springs[i].anchorA);
      this.program.set_arg_int(1, springs[i].anchorB);
      this.program.set_arg_float(2, springs[i].distance);
      this.program.set_arg_float(3, 2000);
      this.program.set_arg_float(4, 0.15);
      this.pass_spring();
    }
    this.reset();
    this.steps = this.program.get_ret_int(0);

    for (var _ = 0; _ < 2; _++) {
      direction = _;
      this.program.set_arg_int(0, direction);
      this.optimize();
      for (var iter = 0; iter < 70; iter++) {
        this.clear_states();
        this.program.set_arg_int(0, direction);
        this.clear_gradients();

        for (var i = 1; i < this.steps; i++) {
          this.program.set_arg_int(0, i - 1);
          this.program.set_arg_int(1, direction);
          this.compute_center();
          this.nn1();
          this.nn2();
          this.apply_spring_force();
          this.program.set_arg_int(0, i);
          this.advance_toi();
          this.increasing();
        }
        this.program.set_arg_int(0, this.steps - 1);
        this.program.set_arg_int(1, direction);
        this.compute_loss();

        // Backpropogation
        this.program.set_arg_int(0, this.steps - 1);
        this.program.set_arg_int(1, direction);
        this.compute_loss_grad();
        for (var i = this.steps - 1; i > 0; i--) {
          this.program.set_arg_int(1, direction);
          this.program.set_arg_int(0, i);
          this.advance_toi_grad();
          this.program.set_arg_int(0, i - 1);
          this.apply_spring_force_grad();
          this.nn2_grad();
          this.nn1_grad();
          this.compute_center_grad();
          this.increasing();
        }

        this.program.set_arg_int(0, iter);
        this.program.set_arg_int(1, direction);
        this.optimize1();
        this.loss.push(this.program.get_ret_float(0));
      }
      this.clear_states();
      console.log(this.loss);
    }

    this.fps = 0;
    this.frame = 1;
    this.last_time = Date.now();
    this.gui.animation(this.perFrame.bind(this));
  }

  onUpdate() {
    for (let i = 0; i < 4; i++) {
      this.substep();
      this.frame++;
    }
    this.render();

    this.get_num_springs();
    var num_spring = this.program.get_ret_int(0);
    let arr = this.program.set_ext_arr_int(0, [num_spring * 2]);
    this.get_spring_anchors();
    var anchor_a = arr.slice(0, num_spring);
    var anchor_b = arr.slice(num_spring, num_spring * 2);

    this.get_num_particles();
    var num = this.program.get_ret_int(0);
    let extr = this.program.set_ext_arr_float(0, [num, 2]);
    this.export_data();
    this.gui.circles(extr);
    for (let i = 0; i < num_spring; i++) {
      var pos1 = [extr[anchor_a[i] * 2], extr[anchor_a[i] * 2 + 1]];
      var pos2 = [extr[anchor_b[i] * 2], extr[anchor_b[i] * 2 + 1]];
      this.gui.line(pos1, pos2);
    }
    this.gui.line([0.01, 0.1], [1.99, 0.1]);
  }

  substep() {
    this.program.set_arg_int(0, 0);
    this.program.set_arg_int(1, direction);
    if (!paused) {
      this.compute_center();
      this.nn1();
      this.nn2();
    }
    this.apply_spring_force();
    this.program.set_arg_int(0, 1);
    this.advance_toi();
    this.increasing();
    this.copy_status();
  }

  perFrame() {
    if (Date.now() - this.last_time >= 1000) {
      this.last_time = Date.now();
      this.fps = 0;
    }
    this.onUpdate();
    this.fps++;
  }

  terminate() {
    this.frame = 0;
    if (typeof this.gui != "undefined") this.gui.stopped = true;
    this.gui = undefined;
    document.addEventListener("keydown", function (event) {
      if (event.key == "ArrowRight") {
        paused = false;
        direction = 0;
      }
      if (event.key == "ArrowLeft") {
        paused = false;
      }
    });
    document.addEventListener("keyup", function (event) {
      if (event.key == "ArrowRight") {
        paused = true;
        direction = 1;
      }
      if (event.key == "ArrowLeft") {
        paused = true;
      }
    });
  }

  loadScript(url) {
    console.log("loadScript(" + url + ")");
    $.ajax({
      url: url,
      type: "GET",
      dataType: "text",
      headers: {
        "Cache-Control": "no-cache",
      },
      success: function (res) {
        $("#label-status").html("loaded");
        console.log("Successfully loaded:", url);
        let module = eval(
          "(function mod" + Date.now() + "() { " + res + "; return Module; })()"
        );
        this.program = new Taichi(module);

        this.program.ready(
          function () {
            console.log("Replaying program...");
            $("#label-status").html("ready");
            this.play(this.program);
          }.bind(this)
        );
      }.bind(this),
      error: function (xmlhr, err, exc) {
        $("#label-status").html("error");
        alert("Error loading compiled script: " + err + exc);
      },
    });
  }
}
