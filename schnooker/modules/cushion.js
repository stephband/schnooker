
import { drawLine } from '../../colin/modules/canvas.js';


const assign = Object.assign;
let id = 0;

export function isCushion(object) {
    return object.type === 'cushion';
}

export default function Cushion(env, x1, y1, x2, y2) {
    this.id    = ++id;
    this.env   = env;
    this.type  = 'cushion';
    this.size  = 4;
    this.data  = Float64Array.of(x1,  y1,  x2, y2, 0, 0, 0, 0, 0, 0, 0, 0);
}

assign(Cushion.prototype, {
    render: function(env) {
        const { ctx } = env;

        ctx.save();
        ctx.lineWidth = 6;
        ctx.strokeStyle = '#000000';
        drawLine(ctx, this.data);
        ctx.stroke();
        ctx.restore();
    }
});

