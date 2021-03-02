let points = [];
let springs = [];

function user_create() {
    console.log("in robots");
    let canvas = document.getElementById("canvas");
    let context = canvas.getContext('2d');

    let mouseX = -10;
    let mouseY = -10;
    let anchor = 0; // Record of the id of the points
    let radius = 5;
    let mouseDown = false;
    let connectId = -1; // Temp id of the connecting spring

    canvas.onmousemove = function(event) {
        mouseX = event.clientX;
        mouseY = event.clientY;
        let box = /** @type {HTMLCanvasElement} */(event.target).getBoundingClientRect();
        mouseX -= box.left;
        mouseY -= box.top;
    }

    canvas.onmouseleave = function(event) {
        mouseX = -10;
        mouseY = -10;
    }

    canvas.onmousedown = function(event) {
        let onPoint = false;
        let pointId = -1;
        mouseDown = true;
        points.forEach(function(point) {
            if (distance(point.x, point.y, mouseX, mouseY) <= radius * 2) {
                onPoint = true;
                pointId = point.id;
                return;
            }
        });
        
        if (onPoint) {
            // Connect current point to another
            connectId = pointId;
        } else {
            // Create a point and connect to another
            connectId = anchor;
            points.push({"x":mouseX, "y":mouseY, "id":anchor++});
        }
    }

    canvas.onmouseup = function(event) {
        mouseDown = false;
        let onPoint = false;
        let pointId = -1;
        points.forEach(function(point) {
            if (distance(point.x, point.y, mouseX, mouseY) <= radius * 2) {
                onPoint = true;
                pointId = point.id;
                return;
            }
        });
        if (onPoint) {
            if (connectId != pointId && !findSpring(connectId, pointId)) {
                let A = points.find(function(point) {return point.id == connectId});
                let B = points.find(function(point) {return point.id == pointId});
                let d = distance(A.x/512, A.y/512, B.x/512, B.y/512);
                springs.push({"anchorA":connectId, "anchorB":pointId, "distance":d});
            }
        } else {
            if (connectId != anchor) {
                let A = points.find(function(point) {return point.id == connectId});
                let d = distance(A.x/512, A.y/512, mouseX/512, mouseY/512);
                springs.push({"anchorA":connectId, "anchorB":anchor, "distance":d});
            }
            points.push({"x":mouseX, "y":mouseY, "id":anchor++});
        }
    }

    function distance(x1, y1, x2, y2) {
        return Math.sqrt(Math.pow(x1-x2, 2) + Math.pow(y1-y2, 2));
    }

    function findPoint(point) {
        return point.id == connectId;
    }

    function findSpring(a, b) {
        let found = false;
        springs.forEach(function(spring) {
            if (spring.anchorA == a && spring.anchorB == b) {
                found = true;
                return;
            }
            if (spring.anchorB == a && spring.anchorA == b) {
                found = true;
                return;
            }
        });
        return found;
    }

    function draw() {
        context.fillStyle = "white";
        context.fillRect(0, 0, canvas.width, canvas.height);

        points.forEach(function(point) {
            context.fillStyle = "black";
            context.beginPath();
            context.arc(point.x, point.y, radius, 0, Math.PI*2);
            context.closePath();
            context.fill();
        });

        springs.forEach(function(spring) {
            let anchorA = points.find(function(point) {return point.id == spring.anchorA});
            let anchorB = points.find(function(point) {return point.id == spring.anchorB});
            context.strokeStyle = "black";
            context.beginPath();
            context.moveTo(anchorA.x, anchorA.y);
            context.lineTo(anchorB.x, anchorB.y);
            context.closePath();
            context.stroke();
        });

        if (mouseDown) {
            context.strokeStyle = "black";
            context.beginPath();
            context.moveTo(points.find(findPoint).x, points.find(findPoint).y);
            context.lineTo(mouseX, mouseY);
            context.closePath();
            context.stroke();
        }
        window.requestAnimationFrame(draw);
    } 
    draw();
}

window.onload = user_create();