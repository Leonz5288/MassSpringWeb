let points = [];
let springs = [];
let is_grid = true;
let draw_box = false;

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
        if (event.key == "b") {
            draw_box = true;
        }
    });

    document.addEventListener('keyup', function(event) {
        if (event.key == "d") {
            delete_mode = false;
        }
        if (event.key == "b") {
            draw_box = false;
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

        // TODO: add this function to non-grid mode.
        if (draw_box && is_grid) {
            let box = getClosest(curX, curY);
            let ids = [];
            for (var i = 0; i < box.length; i++) {
                let temp_id = -1;
                points.forEach(function(point) {
                    if (distance(point.x, point.y, box[i].x, box[i].y) <= radius * 2) {
                        temp_id = point.id;
                    }
                });
                if (temp_id != -1) {
                    ids.push(temp_id);
                } else {
                    ids.push(anchor);
                    points.push({"x":box[i].x, "y":box[i].y, "id":anchor++});
                }
            }
            for (var i = 0; i < ids.length-1; i++) {
                for (var j = i+1; j < ids.length; j++) {
                    if (!findSpring(ids[i], ids[j])) {
                        let d = distance(points[ids[i]].x/512, points[ids[i]].y/512, points[ids[j]].x/512, points[ids[j]].y/512);
                        springs.push({"anchorA":ids[i], "anchorB":ids[j], "distance":d})
                    }
                }
            }
            console.log(springs);
            return;
        }

        if (is_grid) {
            let temp = getClosest(curX, curY);
            curX = temp[0].x;
            curY = temp[0].y;
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
        if (delete_mode || (draw_box && is_grid)) {
            adjust();
            return;
        }
        mouseDown = false;
        let curX = mouseX;
        let curY = mouseY;
        let onPoint = false;
        let pointId = -1;

        if (is_grid) {
            let temp = getClosest(curX, curY);
            curX = temp[0].x;
            curY = temp[0].y;
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
        let temp_anchor = -1;
        points.forEach(function(point) {
            if (distance(point.x, point.y, x, y) <= radius * 2) {
                id = points.indexOf(point);
                temp_anchor = point.id;
                return;
            }
        });
        if (id != -1) {
            let s_id = [];
            springs.forEach(function(spring) {
                if (spring.anchorA == temp_anchor || spring.anchorB == temp_anchor) {
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
        let ret = [];
        for (var i = 0; i < grid.length; i++) {
            let temp = distance(x, y, grid[i].x, grid[i].y);
            if (temp <= min) {
                min = temp;
                close = grid[i];
            }
        }
        ret.push(close);
        if (draw_box && is_grid) {
            for (var _ = 0; _ < 3; _++) {
                min = 10000;
                for (var i = 0; i < grid.length; i++) {
                    let temp = distance(x, y, grid[i].x, grid[i].y);
                    if (temp <= min && ret.find(function(a) {return a.x == grid[i].x && a.y == grid[i].y}) == undefined) {
                        min = temp;
                        close = grid[i];
                    }
                }
                ret.push(close);
            }
        }
        return ret;
    }

    function draw_point(point) {
        context.fillStyle = "black";
        context.beginPath();
        context.arc(point.x, point.y, radius, 0, Math.PI*2);
        context.closePath();
        context.fill();
    }

    function draw_line(anchorA, anchorB) {
        context.strokeStyle = "black";
        context.lineWidth = 3;
        context.beginPath();
        context.moveTo(anchorA.x, anchorA.y);
        context.lineTo(anchorB.x, anchorB.y);
        context.closePath();
        context.stroke();
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

        if (draw_box && is_grid) {
            context.globalAlpha = 0.5;
            let A = getClosest(mouseX, mouseY);
            A.forEach(function(a) {
                draw_point(a);
            });
            for (var i = 0; i < A.length-1; i++) {
                for (var j = i+1; j < A.length; j++) {
                    draw_line(A[i], A[j]);
                }
            }
            context.globalAlpha = 1;
        }

        points.forEach(function(point) {
            draw_point(point);
        });

        springs.forEach(function(spring) {
            let anchorA = points.find(function(point) {return point.id == spring.anchorA});
            let anchorB = points.find(function(point) {return point.id == spring.anchorB});
            draw_line(anchorA, anchorB);
        });

        if (mouseDown) {
            let A = {"x":points.find(findPoint).x, "y":points.find(findPoint).y};
            let B = {"x":mouseX, "y":mouseY};
            draw_line(A, B);
        }
        window.requestAnimationFrame(draw);
    }
    draw();
}

window.onload = user_create();