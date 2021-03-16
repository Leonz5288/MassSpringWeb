let points = [];
let springs = [];
let is_grid = true;

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
    let interval_h = canvas.width / 40;
    let interval_v = canvas.height / 20;
    let grid = [];

    let delete_mode = false;

    for(var i = 1; i < 40; i++) {
        for(var j = 1; j < 20; j++) {
            grid.push({"x":interval_h*i, "y":interval_v*j});
        }
    }

    document.addEventListener('keydown', function(event) {
        if (event.key == "d") {
            delete_mode = true;
        }
    });

    document.addEventListener('keyup', function(event) {
        if (event.key == "d") {
            delete_mode = false;
        }
    });

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
        let curX = mouseX;
        let curY = mouseY;
        // In delete mode, delete spring instead of adding.
        if (delete_mode) {
            deleteSpring(curX, curY);
            return;
        }

        if (is_grid) {
            let temp = getClosest(curX, curY);
            curX = temp.x;
            curY = temp.y;
        }

        mouseDown = true;
        points.forEach(function(point) {
            if (distance(point.x, point.y, curX, curY) <= radius * 2) {
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
            points.push({"x":curX, "y":curY, "id":anchor++});
        }
    }

    canvas.onmouseup = function(event) {
        if (delete_mode) return;
        mouseDown = false;
        let curX = mouseX;
        let curY = mouseY;
        let onPoint = false;
        let pointId = -1;

        if (is_grid) {
            let temp = getClosest(curX, curY);
            curX = temp.x;
            curY = temp.y;
        }

        points.forEach(function(point) {
            if (distance(point.x, point.y, curX, curY) <= radius * 2) {
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
                let d = distance(A.x/512, A.y/512, curX/512, curY/512);
                springs.push({"anchorA":connectId, "anchorB":anchor, "distance":d});
            }
            points.push({"x":curX, "y":curY, "id":anchor++});
        }
        adjust();
    }

    function deleteSpring(x, y) {
        let id = -1;
        let anchor = -1;
        points.forEach(function(point) {
            if (distance(point.x, point.y, x, y) <= radius * 2) {
                id = points.indexOf(point);
                anchor = point.id;
                return;
            }
        });
        if (id != -1) {
            let s_id = [];
            springs.forEach(function(spring) {
                if (spring.anchorA == anchor || spring.anchorB == anchor) {
                    s_id.push(springs.indexOf(spring));
                }
            });
            for (var i = s_id.length-1; i >= 0; i--) {
                springs.splice(s_id[i], 1);
            }
            points.splice(id, 1);
            anchor--;
            adjust();
        }
    }

    function distance(x1, y1, x2, y2) {
        return Math.sqrt(Math.pow(x1-x2, 2) + Math.pow(y1-y2, 2));
    }

    function findPoint(point) {
        return point.id == connectId;
    }

    function adjust() {
        // Adjust point's id and spring's anchors
        springs.forEach(function(spring) {
            let ptA = points.find(function(point) {return point.id == spring.anchorA});
            let ptB = points.find(function(point) {return point.id == spring.anchorB});
            spring.anchorA = points.indexOf(ptA);
            spring.anchorB = points.indexOf(ptB);
        });
        points.forEach(function(point) {
            point.id = points.indexOf(point);
        });
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

    function getClosest(x, y) {
        let min = 10000;
        let close;
        for (var i = 0; i < grid.length; i++) {
            let temp = distance(x, y, grid[i].x, grid[i].y);
            if (temp <= min) {
                min = temp;
                close = grid[i];
            }
        }
        return close;
    }

    function draw() {
        context.fillStyle = "rgb(255, 255, 255)";
        context.fillRect(0, 0, canvas.width, canvas.height);

        context.fillStyle = "rgba(0, 0, 0, 0.6)";
        context.fillRect(0, 0.9*canvas.height, canvas.width, canvas.height);

        if (is_grid) {
            for(var i = 0; i < 40; i++) {
                context.strokeStyle = 'rgba(0, 0, 0, 0.3)';
                context.lineWidth = 1;
                context.beginPath();
                context.moveTo(interval_h*i, 0);
                context.lineTo(interval_h*i, 0.85*canvas.height);
                context.closePath();
                context.stroke();
            }
            for(var i = 0; i < 18; i++) {
                context.strokeStyle = 'rgba(0, 0, 0, 0.3)';
                context.lineWidth = 1;
                context.beginPath();
                context.moveTo(0, interval_v*i);
                context.lineTo(canvas.width, interval_v*i);
                context.closePath();
                context.stroke();
            }
        }

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
            context.lineWidth = 3;
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