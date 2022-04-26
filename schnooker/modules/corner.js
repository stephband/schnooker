
import { drawCircle } from '../../colin/modules/canvas.js';

const assign = Object.assign;
let id = 0;

export function isCorner(object) {
    return object.type === 'corner';
}

export default function Corner(env, x, y, r) {
    this.id    = ++id;
    this.env   = env;
    this.type  = 'corner';
    this.size  = 3;
    this.data  = Float64Array.of(x, y, r, 0, 0, 0, 0, 0, 0);
}

assign(Corner.prototype, {
    render: function(env) {
        const { ctx } = env;

        ctx.save();
        ctx.lineWidth = 6;
        ctx.strokeStyle = '#000000';
        drawCircle(ctx, this.data);
        ctx.stroke();
        ctx.restore();
    }
});
