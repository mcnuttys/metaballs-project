// #4 - UTILITY CODE
// Here's more code that should probably be in a separate file
// Maybe in abcLIB.js (if you are working on Project 1) or utils.js (if you are working on Project 2)
// Also check out `createLinearGradient()`, it's new and handy

function preloadImage(url, callback) {
    let img = new Image();
    img.src = url;
    img.onload = _ => {
        callback(img)
    };
    img.onerror = _ => {
        console.log(`Image at url "${url}" wouldn't load! Check your URL!`);
    };
}

function getRandomUnitVector() {
    let x = getRandom(-1, 1);
    let y = getRandom(-1, 1);
    let length = Math.sqrt(x * x + y * y);
    if (length == 0) { // very unlikely
        x = 1; // point right
        y = 0;
        length = 1;
    } else {
        x /= length;
        y /= length;
    }
    return { x: x, y: y };
}

function getRandom(min, max) {
    return Math.random() * (max - min) + min;
}

function getRandomColor() {
    const getByte = _ => 35 + Math.round(Math.random() * 220);
    return `rgba(${getByte()},${getByte()},${getByte()},1)`;
}

function createLinearGradient(ctx, startX, startY, endX, endY, colorStops) {
    let lg = ctx.createLinearGradient(startX, startY, endX, endY);
    for (let stop of colorStops) {
        lg.addColorStop(stop.percent, stop.color);
    }
    return lg;
}

function distance(x0, y0, x1, y1) {
    return Math.sqrt((x1 - x0) * (x1 - x0) + (y1 - y0) * (y1 - y0));
}

function magnitude(v) {
    return Math.sqrt((v.x * v.x) + (v.y * v.y));
}

function normalize(v) {
    let m = magnitude(v);
    return { x: v.x / m, y: v.y / m };
}

// YOINKED off internet: https://stackoverflow.com/questions/5623838/rgb-to-hex-and-hex-to-rgb
function hexToRgb(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

export { preloadImage, getRandom, getRandomUnitVector, getRandomColor, createLinearGradient, distance, magnitude, normalize, hexToRgb }