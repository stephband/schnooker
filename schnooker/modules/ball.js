
//import gaussian    from '../../fn/modules/gaussian.js';
import toCartesian from '../../fn/modules/to-cartesian.js';
import { px } from '../../dom/modules/parse-length.js';

import { drawCircle } from '../../colin/modules/canvas.js';

const assign = Object.assign;
const pi     = Math.PI;
const turn   = Math.PI * 2;

let id = 0;

export function isBall(object) {
    return object.type === 'ball';
}

export default function Ball(env, x, y, r, vx, vy, vr, mass, color) {
    this.id    = ++id;
    this.env   = env;
    this.type  = 'ball';
    this.size  = 3;
    this.data  = Float64Array.of(x,  y,  r, vx, vy, vr, 0, 0, 0);
    this.mass  = mass;
    this.color = color || 'black';

    // Mass of a solid sphere
    //this.mass = (4 / 3) * pi * r * r * r;
    // Mass of a hollow sphere
    //this.mass   = 4 * pi * r * r;
    // Mass of a solid disc
    //this.mass = pi * r * r;
    // Mass of a empty ring
    //this.mass = 2 * pi * r;

    // Volume of sphere
    this.volume = (4 / 3) * pi * r * r * r;

    // Pulse timings
    this.pulses = [];
}

assign(Ball.prototype, {
    update: function(t1, t2) {
        const duration = t2 - t1;

        this.data[6] = 0;
        this.data[7] = 0;

        // Crude, temporary stopping force. We can model felt better than this.
        const feltDrag = 0.36;
        this.data[3] = this.data[3] - this.data[3] * feltDrag * duration;
        this.data[4] = this.data[4] - this.data[4] * feltDrag * duration;
        if (Math.abs(this.data[3]) < 1) { this.data[3] = 0; }
        if (Math.abs(this.data[4]) < 1) { this.data[4] = 0; }
    },

    render: function() {
        const { ctx } = this.env;

        // x, y, r
        ctx.save();
        ctx.lineWidth = 1.2;
        ctx.fillStyle = this.color;
        ctx.strokeStyle = '#000000';
        drawCircle(ctx, this.data);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
    }
});
