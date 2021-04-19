direction = 1;

class MassSpring {
  constructor(canvas) {
    this.frame = 1;
    this.steps = 0;

    this.canvas = canvas;

    this.loss = [];
    this.stiffness = document.getElementById("p1").valueAsNumber;
    this.actuation = document.getElementById("p2").valueAsNumber;
    this.num_iter = document.getElementById("p3").valueAsNumber;
    this.learning_rate = document.getElementById("p4").valueAsNumber;
    this.pause = false;
  }

  play() {
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
    this.pass_parameter = this.program.get("pass_parameter");

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
      this.program.set_arg_float(3, this.stiffness);
      if (springs[i].act) {this.program.set_arg_float(4, this.actuation);}
      else {this.program.set_arg_float(4, 0.0);}
      this.pass_spring();
    }
    this.program.set_arg_float(0, this.learning_rate);
    this.program.set_arg_int(1, head_id);
    this.pass_parameter();
    this.reset();
    this.steps = this.program.get_ret_int(0);

      this.optimize();
      this.draw_graph(this.train.bind(this));
  }

  draw_graph(callback) {
    let i = 0;
    let n = this.num_iter;
    let that = this;
    function wrapped() {
      callback(i++);
      let id = window.requestAnimationFrame(function(timestamp) {
        wrapped();
      });
      if (i == n) {
        window.cancelAnimationFrame(id);
        console.log(that.loss);
        that.clear_states();
        that.fps = 0;
        that.frame = 1;
        that.last_time = Date.now();
        that.gui.animation(that.perFrame.bind(that));
      }
    }
    wrapped();
  }

  train(iter) {
      this.clear_states();
      this.clear_gradients();

      for (var i = 1; i < this.steps; i++) {
        this.program.set_arg_int(0, i - 1);
        this.compute_center();
        this.nn1();
        this.nn2();
        this.apply_spring_force();
        this.program.set_arg_int(0, i);
        this.advance_toi();
        this.increasing();
      }
      this.program.set_arg_int(0, this.steps-1);
      this.compute_loss();

      this.compute_loss_grad();
      // Backpropogation
      for (var i = this.steps - 1; i > 0; i--) {
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
      this.optimize1();
      this.loss.push(this.program.get_ret_float(0));
      if (iter % 10 == 0) {
        addData(myChart, iter, this.program.get_ret_float(0));
      }
  }

  onUpdate() {
    for (let i = 0; i < 4; i++) {
      this.substep();
      this.frame++;
    }
    this.program.set_arg_int(0, 1);
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

    this.gui.ground();
    this.gui.circles(extr);
    for (let i = 0; i < num_spring; i++) {
      var pos1 = [extr[anchor_a[i] * 2], extr[anchor_a[i] * 2 + 1]];
      var pos2 = [extr[anchor_b[i] * 2], extr[anchor_b[i] * 2 + 1]];
      if (pos1[0] >= 1.9 || pos2[0] >= 1.9) this.pause = true;
      this.gui.line(pos1, pos2);
    }
  }

  substep() {
    this.program.set_arg_int(0, 0);
    this.compute_center();
    if (!this.pause) {
      this.nn1();
      this.nn2();
    }
    this.apply_spring_force();
    this.program.set_arg_int(0, 1);
    this.advance_toi();
    this.increasing();
    this.program.set_arg_int(0, direction);
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
