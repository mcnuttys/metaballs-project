import * as utils from "./utils.js";
import * as classes from "./classes.js";

let ctx, canvas;
let canvasWidth = 600;
let canvasHeight = 600;

// The number of nodes to cross the width of the canvas
let nodeRes = 16;
let nodes;

let squares;

let ballCount = 4;
let balls;

// Mouse stuff
let mouseX = 0;
let mouseY = 0;
let selectedBall;
let hold = false;
let holdTimer;
const holdTime = 0.1;

let decayRange = 4;

// UI interactive stuff...
let drawBlobs = true;
let drawBalls = true;
let drawNodes = true;
let drawNodeWeights = true;
let drawSquares = true;
let drawSquareCosts = true;
let drawAntiNodes = false;
let wrapMode = "bounce";
let launchStrength = 0.01;
let createEnabled = true;
let ballRadius = 50;
let createColor = { r: 255, g: 0, b: 0 };

function init() {
    canvas = document.querySelector('canvas');
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    ctx = canvas.getContext("2d");
    canvas.onmousedown = canvasClick;
    canvas.onmouseup = mouseUp;
    canvas.onmousemove = mouseMove;

    setupUI();
    setupSquares();
    setupBalls();
    loop();
}

function loop() {
    requestAnimationFrame(loop);

    // Start every frame by clearing the background...
    clear();

    // --- Metaballs process ---
    // Draw/update the balls as thats what the blobs are based off of.
    // Draw/update the nodes because to form the blobs the nodes need proper weights.
    // Draw the squares if you want, as well as draw the blobs.

    // Update/Draw the balls...
    for (let i = 0; i < balls.length; i++) {
        // First determin if the ball needs to do whatever the wrapsetting is...
        switch (wrapMode) {
            case "bounce":
                if (balls[i].x <= balls[i].r) balls[i].dir.x *= -1;
                if (balls[i].y <= balls[i].r) balls[i].dir.y *= -1;
                if (balls[i].x >= canvasWidth - balls[i].r) balls[i].dir.x *= -1;
                if (balls[i].y >= canvasHeight - balls[i].r) balls[i].dir.y *= -1;
                break;
            case "wrap":
                if (balls[i].x < -balls[i].r * decayRange) balls[i].x = canvasWidth + balls[i].r;
                if (balls[i].y < -balls[i].r * decayRange) balls[i].y = canvasHeight + balls[i].r;
                if (balls[i].x > canvasWidth + balls[i].r * decayRange) balls[i].x = -balls[i].r;
                if (balls[i].y > canvasHeight + balls[i].r * decayRange) balls[i].y = -balls[i].r;
                break;
            case "delete":
                if (balls[i].x < -balls[i].r * decayRange) balls.splice(i, 1);
                else if (balls[i].y < -balls[i].r * decayRange) balls.splice(i, 1);
                else if (balls[i].x > canvasWidth + balls[i].r * decayRange) balls.splice(i, 1);
                else if (balls[i].y > canvasHeight + balls[i].r * decayRange) balls.splice(i, 1);
                break;
        }

        if (balls[i] != null) {
            balls[i].move();
            if (drawBalls) balls[i].draw(ctx);
        }
    }

    // Update/Draw the nodes...
    for (let i = 0; i < nodeRes; i++) {
        for (let j = 0; j < nodeRes; j++) {
            let n = nodes[i][j];
            n.weight = 0;
            let c = { r: 0, g: 0, b: 0, a: 1 };

            // Compute the weight of the node by looping through all the balls and doing some distance math
            for (let k = 0; k < balls.length; k++) {
                let b = balls[k];
                // Equasion: f(x,y) = (ri^2) / (x-xi)^2 + (y-yi)^2 where ri, xi, and yi come from the ball and the x and y are from the node
                let w = (b.r * b.r) / ((n.x - b.x) * (n.x - b.x) + (n.y - b.y) * (n.y - b.y));
                n.weight += w;

                if (w > 1) w = 1;
                c.r += b.color.r * w;
                c.g += b.color.g * w;
                c.b += b.color.b * w;
            }
            n.color = c;

            if (drawNodes) n.draw(ctx);
            if (drawNodeWeights) n.drawText(ctx);
        }
    }

    // Update/Draw the squares...
    for (let i = 0; i < nodeRes - 1; i++) {
        for (let j = 0; j < nodeRes - 1; j++) {
            let s = squares[i][j];
            s.computeCost();
            if (drawSquares) s.draw(ctx);
            if (drawSquareCosts) s.drawText(ctx);
            if (drawAntiNodes) s.drawAntiNodes(ctx);
            if (drawBlobs) s.drawMarching(ctx, true);
        }
    }

    // The mouse is down so increase the hold timer
    if (hold)
        holdTimer += 1 / 60;

    // Draw the selected ball if its not null
    if (selectedBall != null) {
        selectedBall.selected = true;
        selectedBall.draw(ctx);
        selectedBall.drawInfo(ctx);

        // If we held the mouse we want to draw the line thingy...
        if (holdTimer > holdTime) {
            ctx.save();
            ctx.strokeStyle = "white";
            ctx.beginPath();
            ctx.moveTo(selectedBall.x, selectedBall.y);
            ctx.lineTo(mouseX, mouseY);
            ctx.stroke();
            ctx.restore();
        }
    }

    // Just a debug to draw the current mouse pos
    ctx.fillStyle = "white";
    ctx.fillRect(mouseX - 2.5, mouseY - 2.5, 5, 5);
}

function clear() {
    ctx.save();
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    ctx.restore();
}

function canvasClick(e) {
    // Determine where on the canvas we clicked...
    let rect = e.target.getBoundingClientRect();
    mouseX = e.clientX - rect.x;
    mouseY = e.clientY - rect.y;

    // Next determine if we clicked on any of the balls...
    let clickedBall = null;
    let nearestBall = 1000;
    for (let i = 0; i < balls.length; i++) {
        let d = utils.distance(mouseX, mouseY, balls[i].x, balls[i].y);
        if (d <= nearestBall) {
            if (d <= balls[i].r) {
                clickedBall = balls[i];
            }
            nearestBall = d;
        }
        balls[i].selected = false;
    }

    if (clickedBall != null) {
        // Enable clicked ball settings and make sure it gets drawn...
        selectedBall = clickedBall;
    } else {
        // We want to create a new ball!
        selectedBall = null;

        if (createEnabled) addBall(mouseX, mouseY, ballRadius, createColor);
    }

    hold = true;
    holdTimer = 0;
}

function mouseUp() {
    if (holdTimer > holdTime && selectedBall != null) {
        // Do whatever it is that happens if you hold the mouse...
        let dir = { x: 0, y: 0 };
        dir.x = selectedBall.x - mouseX;
        dir.y = selectedBall.y - mouseY;
        let m = utils.magnitude(dir);
        dir = utils.normalize(dir);
        selectedBall.dir = dir;
        selectedBall.speed = m * launchStrength;
    }

    // Also list the current balls info at some point...

    hold = false;
    holdTimer = 0;
}

function mouseMove(e) {
    // Determine where on the canvas we clicked...
    let rect = e.target.getBoundingClientRect();
    mouseX = e.clientX - rect.x;
    mouseY = e.clientY - rect.y;
}

function addBall(x, y, r, c) {
    let dir = utils.getRandomUnitVector();
    let s = utils.getRandom(0.1, 1);
    balls.push(new classes.Ball(x, y, r, dir, s, c));
}

//#region --- SETUP STUFF ---
function setupSquares() {
    // Create the nodes array...
    // To bypass some of the hassle we can also create the squares here as well... 
    // Im going to because after doing marching squares and cubes a few times you get into a groove!
    nodes = [];
    squares = [];
    for (let i = 0; i < nodeRes; i++) {
        nodes[i] = new Array(nodeRes);
        squares[i] = new Array(nodeRes - 1);

        let x = (i / (nodeRes - 1)) * canvasWidth;
        for (let j = 0; j < nodeRes; j++) {
            let y = (j / (nodeRes - 1)) * canvasHeight;
            nodes[i][j] = new classes.Node(x, y, 0);

            // Because of how the squares are related to the nodes and we want to properly include them
            // we just skip the first and create a square back one thats why the array size is the res - 1
            if (i > 0 && j > 0) {
                // Get the 4 nodes that the square will have
                let n0 = nodes[i - 1][j];
                let n1 = nodes[i][j];
                let n2 = nodes[i][j - 1];
                let n3 = nodes[i - 1][j - 1];
                let sx = (n0.x + n1.x + n2.x + n3.x) / 4;
                let sy = (n0.y + n1.y + n2.y + n3.y) / 4;
                squares[i - 1][j - 1] = new classes.Square(sx, sy, [n0, n1, n2, n3]);
            }
        }
    }
}

function setupBalls() {
    // Create the balls!
    balls = [];
    for (let i = 0; i < ballCount; i++) {
        let r = utils.getRandom(10, 100);
        let x = utils.getRandom(r, canvasWidth - r);
        let y = utils.getRandom(r, canvasHeight - r);
        let cr = utils.getRandom(0, 255);
        let cg = utils.getRandom(0, 255);
        let cb = utils.getRandom(0, 255);
        addBall(x, y, r, { r: cr, g: cg, b: cb, a: 1 });
    }
}

function setupUI() {
    console.log("Setting up the UI!")
    document.querySelector("#cbDrawBlobs").onclick = function (e) {
        drawBlobs = e.target.checked;
    };
    document.querySelector("#cbDrawBalls").onclick = function (e) {
        drawBalls = e.target.checked;
    };
    document.querySelector("#cbDrawNodes").onclick = function (e) {
        drawNodes = e.target.checked;
    };
    document.querySelector("#cbDrawNodeWeights").onclick = function (e) {
        drawNodeWeights = e.target.checked;
    };
    document.querySelector("#cbDrawSquares").onclick = function (e) {
        drawSquares = e.target.checked;
    };
    document.querySelector("#cbDrawSquareCosts").onclick = function (e) {
        drawSquareCosts = e.target.checked;
    };
    document.querySelector("#cbDrawAntiNodes").onclick = function (e) {
        drawAntiNodes = e.target.checked;
    };

    document.querySelector("#btnRefresh").onclick = function (e) {
        setupSquares();
        setupBalls();

        selectedBall = null;
    };
    document.querySelector("#nmbResolution").onchange = function (e) {
        if (e.target.value < 4)
            e.target.value = 4;
        if (e.target.value > 128)
            e.target.value = 128;

        nodeRes = e.target.value;
        setupSquares();
    };
    document.querySelector("#nmbBalls").onchange = function (e) {

        if (e.target.value < 1)
            e.target.value = 1;
        if (e.target.value > 16)
            e.target.value = 16;

        ballCount = e.target.value;
        setupBalls();
    };
    document.querySelector("#selWrapMode").onchange = function (e) {
        wrapMode = e.target.value;
        setupBalls();
    };
    document.querySelector("#sldrLaunchStr").onchange = function (e) {
        launchStrength = e.target.value / 1000;
    };
    document.querySelector("#nmbBallRadius").onchange = function (e) {
        if (e.target.value < 10)
            e.target.value = 10;
        if (e.target.value > 100)
            e.target.value = 100;

        ballRadius = e.target.value;
    };
    document.querySelector("#clrBallColor").onchange = function (e) {
        createColor = utils.hexToRgb(e.target.value);
        console.log(createColor);
    };
}
//#endregion

export { init }