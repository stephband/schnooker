
//import gaussian    from '../../fn/modules/gaussian.js';
import toCartesian from '../../fn/modules/to-cartesian.js';
import { px }      from '../../dom/modules/parse-length.js';

import { drawCircle } from '../../colin/modules/canvas.js';

const assign = Object.assign;
const pi     = Math.PI;
const turn   = Math.PI * 2;

let id = 0;

export function isPocket(object) {
    return object.type === 'pocket';
}

export default function Pocket(env, x, y, r) {
    this.id    = ++id;
    this.env   = env;
    this.type  = 'pocket';
    this.size  = 3;
    this.data  = Float64Array.of(x,  y,  r, 0, 0, 0, 0, 0, 0);

    this.color = '#000000';
}

assign(Pocket.prototype, {
    render: function() {
        const { ctx } = this.env;

        // x, y, r
        ctx.save();
        ctx.lineWidth = 0;
        ctx.fillStyle = this.color;
        ctx.strokeStyle = '#000000';
        drawCircle(ctx, this.data);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
    }
});
