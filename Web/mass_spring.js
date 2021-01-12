class MassSpring {
    constructor(canvas) {
        this.paused = false;
        this.frame = 1;
        this.steps = 0;
        
        this.canvas = canvas;
        
        this.loss = [];
    }
}