class Node {
    constructor(x = 0, y = 0, weight = 0, color = { r: 0, g: 0, b: 0, a: 0 }) {
        this.x = x;
        this.y = y;
        this.weight = weight;
        this.color = color;
    }

    draw(ctx) {
        ctx.save();
        ctx.fillStyle = (this.weight < 1) ? "white" : `rgba(${this.color.r},${this.color.g},${this.color.b},${this.color.a})`;
        ctx.beginPath();
        ctx.rect(this.x, this.y, 1, 1);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }

    drawText(ctx) {
        ctx.save();
        ctx.fillStyle = `rgba(${this.color.r},${this.color.g},${this.color.b},${this.color.a})`;
        ctx.font = "5pt serif";
        ctx.fillText(Math.round(this.weight * 10) / 10, this.x - 2.5, this.y + 2.5);
        ctx.restore();
    }
}

class Square {
    constructor(x = 0, y = 0, nodes) {
        this.x = x;
        this.y = y;
        this.nodes = nodes;
        this.antiNodes = [];
        this.cost = 0;
        this.computeCost();
        this.updateAntiNodes();
        this.computeColor();
    }

    computeCost() {
        this.cost = 0;

        // For marching squares you need to know what nodes are active or not...
        // The easiest way to do this is to compute the cost of the square.
        // The cost of the square is based off which of the corner nodes are active.
        // Once computed this cost is the state that you need to draw the square.
        if (this.nodes[0].weight > 1) this.cost += 1;
        if (this.nodes[1].weight > 1) this.cost += 2;
        if (this.nodes[2].weight > 1) this.cost += 4;
        if (this.nodes[3].weight > 1) this.cost += 8;
    }

    computeColor() {
        let c = { r: 0, g: 0, b: 0, a: 1 };
        for (let i = 0; i < 4; i++) {
            let n = this.nodes[i];
            c.r += n.color.r;
            c.g += n.color.g;
            c.b += n.color.b;
        }

        c.r /= 4;
        c.g /= 4;
        c.b /= 4;

        this.color = c;
    }

    updateAntiNodes() {
        this.antiNodes[0] = this.interpolate(this.nodes[0], this.nodes[1]);
        this.antiNodes[1] = this.interpolate(this.nodes[1], this.nodes[2]);
        this.antiNodes[2] = this.interpolate(this.nodes[2], this.nodes[3]);
        this.antiNodes[3] = this.interpolate(this.nodes[3], this.nodes[0]);
    }

    draw(ctx) {
        this.updateAntiNodes();
        this.computeColor();
        ctx.save();
        ctx.strokeStyle = `rgba(${this.color.r},${this.color.g},${this.color.b},${this.color.a})`;
        ctx.beginPath();
        ctx.moveTo(this.nodes[0].x, this.nodes[0].y);
        ctx.lineTo(this.nodes[1].x, this.nodes[1].y);
        ctx.lineTo(this.nodes[2].x, this.nodes[2].y);
        ctx.lineTo(this.nodes[3].x, this.nodes[3].y);
        ctx.closePath();
        ctx.stroke();
        ctx.restore();
    }

    drawAntiNodes(ctx) {
        // Lets draw the antinodes first...
        this.updateAntiNodes();
        this.computeColor();
        for (let i = 0; i < 4; i++) {
            ctx.save();
            ctx.fillStyle = `rgba(${this.color.r},${this.color.g},${this.color.b},${this.color.a})`;
            ctx.fillRect(this.antiNodes[i].x, this.antiNodes[i].y, 1, 1);
            ctx.restore();
        }
    }

    drawMarching(ctx, fill = false) {
        this.updateAntiNodes();
        this.computeColor();

        // Because we are probably going to need them store the antinodes, and for filling the nodes too
        let a0 = this.antiNodes[0];
        let a1 = this.antiNodes[1];
        let a2 = this.antiNodes[2];
        let a3 = this.antiNodes[3];
        let n0 = this.nodes[0];
        let n1 = this.nodes[1];
        let n2 = this.nodes[2];
        let n3 = this.nodes[3];

        ctx.save();
        ctx.strokeStyle = `rgba(${this.color.r},${this.color.g},${this.color.b},${this.color.a})`;
        ctx.fillStyle = `rgba(${this.color.r},${this.color.g},${this.color.b},${this.color.a})`;
        ctx.beginPath();
        switch (this.cost) {
            case 0:
                // There is nothing drawn if none of the nodes are active
                break;

            // One point cases
            case 1:
                ctx.moveTo(a0.x, a0.y);
                ctx.lineTo(a3.x, a3.y);
                if (fill) ctx.lineTo(n0.x, n0.y);
                break;

            case 2:
                ctx.moveTo(a0.x, a0.y);
                ctx.lineTo(a1.x, a1.y);
                if (fill) ctx.lineTo(n1.x, n1.y);
                break;
            case 4:
                ctx.moveTo(a1.x, a1.y);
                ctx.lineTo(a2.x, a2.y);
                if (fill) ctx.lineTo(n2.x, n2.y);
                break;
            case 8:
                ctx.moveTo(a2.x, a2.y);
                ctx.lineTo(a3.x, a3.y);
                if (fill) ctx.lineTo(n3.x, n3.y);
                break;

            // Two point cases
            case 3:
                ctx.moveTo(a1.x, a1.y);
                ctx.lineTo(a3.x, a3.y);
                if (fill) {
                    ctx.lineTo(n0.x, n0.y);
                    ctx.lineTo(n1.x, n1.y);
                }
                break;
            case 5:
                if (!fill) {
                    ctx.moveTo(a3.x, a3.y);
                    ctx.lineTo(a2.x, a2.y);
                    ctx.moveTo(a1.x, a1.y);
                    ctx.lineTo(a0.x, a0.y);
                } else {
                    ctx.moveTo(a3.x, a3.y);
                    ctx.lineTo(a2.x, a2.y);
                    ctx.lineTo(n2.x, n2.y);
                    ctx.lineTo(a1.x, a1.y);
                    ctx.lineTo(a0.x, a0.y);
                    ctx.lineTo(n0.x, n0.y);
                }
                break;
            case 6:
                ctx.moveTo(a0.x, a0.y);
                if (fill) {
                    ctx.lineTo(n1.x, n1.y);
                    ctx.lineTo(n2.x, n2.y);
                }
                ctx.lineTo(a2.x, a2.y);
                break;
            case 9:
                ctx.moveTo(a0.x, a0.y);
                if (fill) {
                    ctx.lineTo(n0.x, n0.y);
                    ctx.lineTo(n3.x, n3.y);
                }
                ctx.lineTo(a2.x, a2.y);
                break;
            case 10:
                if (!fill) {
                    ctx.moveTo(a2.x, a2.y);
                    ctx.lineTo(a1.x, a1.y);
                    ctx.moveTo(a3.x, a3.y);
                    ctx.lineTo(a0.x, a0.y);
                } else {
                    ctx.moveTo(a2.x, a2.y);
                    ctx.lineTo(a1.x, a1.y);
                    ctx.lineTo(n1.x, n1.y);
                    ctx.lineTo(a0.x, a0.y);
                    ctx.lineTo(a3.x, a3.y);
                    ctx.lineTo(n3.x, n3.y);
                }
                break;
            case 12:
                ctx.moveTo(a1.x, a1.y);
                ctx.lineTo(a3.x, a3.y);
                if (fill) {
                    ctx.lineTo(n3.x, n3.y);
                    ctx.lineTo(n2.x, n2.y);
                }
                break;

            // Three point cases (these are identical to the one point cases, but still include for filling)
            case 7:
                ctx.moveTo(a2.x, a2.y);
                ctx.lineTo(a3.x, a3.y);
                if (fill) {
                    ctx.lineTo(n0.x, n0.y);
                    ctx.lineTo(n1.x, n1.y);
                    ctx.lineTo(n2.x, n2.y);
                }
                break;
            case 11:
                ctx.moveTo(a2.x, a2.y);
                ctx.lineTo(a1.x, a1.y);
                if (fill) {
                    ctx.lineTo(n1.x, n1.y);
                    ctx.lineTo(n0.x, n0.y);
                    ctx.lineTo(n3.x, n3.y);
                }
                break;
            case 13:
                ctx.moveTo(a0.x, a0.y);
                ctx.lineTo(a1.x, a1.y);

                if (fill) {
                    ctx.lineTo(n2.x, n2.y);
                    ctx.lineTo(n3.x, n3.y);
                    ctx.lineTo(n0.x, n0.y);
                }
                break;
            case 14:
                ctx.moveTo(a0.x, a0.y);
                ctx.lineTo(a3.x, a3.y);
                if (fill) {
                    ctx.lineTo(n3.x, n3.y);
                    ctx.lineTo(n2.x, n2.y);
                    ctx.lineTo(n1.x, n1.y);
                }
                break;

            // four point case (this one will only draw anything if fill is active!)
            case 15:
                if (fill) {
                    ctx.moveTo(n0.x, n0.y);
                    ctx.lineTo(n1.x, n1.y);
                    ctx.lineTo(n2.x, n2.y);
                    ctx.lineTo(n3.x, n3.y);
                }
                break;
        }
        if (fill) {
            ctx.closePath();
            ctx.fill();
        } else {
            ctx.stroke();
        }
        ctx.restore();
    }

    drawText(ctx) {
        this.updateAntiNodes();
        this.computeColor();
        ctx.save();
        ctx.fillStyle = `rgba(${this.color.r},${this.color.g},${this.color.b},${this.color.a})`;
        ctx.font = "5pt serif";
        ctx.fillText(Math.round(this.cost * 100) / 100, this.x - 2.5, this.y + 2.5);
        ctx.restore();
    }

    interpolate(n0, n1) {
        let t = ((1 - n0.weight) / (n1.weight - n0.weight));
        //if (t > 1) t = 1;
        //if (t < 0) t = 0;
        let x = n0.x + (n1.x - n0.x) * t;
        let y = n0.y + (n1.y - n0.y) * t;

        return { x: x, y: y };
    }
}

class Ball {
    constructor(x = 0, y = 0, r = 0, dir, speed = 3, color = { r: 0, g: 0, b: 0, a: 0 }) {
        this.x = x;
        this.y = y;
        this.r = r;
        this.dir = dir;
        this.speed = speed;
        this.color = color;
        this.selected = false;
    }

    draw(ctx) {
        ctx.save();
        ctx.strokeStyle = (!this.selected) ? `rgba(${this.color.r},${this.color.g},${this.color.b},${this.color.a})` : "white";
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
        ctx.closePath();
        ctx.stroke();
        ctx.restore();
    }

    drawInfo(ctx) {
        ctx.save();
        ctx.fillStyle = "white";
        ctx.font = "10pt sans-serif";
        ctx.fillText(`x: ${Math.round(this.x)} y: ${Math.round(this.y)}`, this.x + this.r + 15, this.y - 30);
        ctx.fillText(`r: ${Math.round(this.r)}`, this.x + this.r + 15, this.y + 15 - 30);
        ctx.fillText(`Direction: ${Math.round(this.dir.x * 100) / 100}, ${Math.round(this.dir.y * 100) / 100}`, this.x + this.r + 15, this.y + 30 - 30);
        ctx.fillText(`Speed: ${Math.round(this.speed * 100) / 100}`, this.x + this.r + 15, this.y + 45 - 30);
        ctx.fillText(`Color: (${Math.round(this.color.r)}, ${Math.round(this.color.g)}, ${Math.round(this.color.b)})`, this.x + this.r + 15, this.y + 60 - 30);
        
        ctx.restore();
    }

    move() {
        this.x += this.dir.x * this.speed;
        this.y += this.dir.y * this.speed;
    }
}

export { Node, Square, Ball }