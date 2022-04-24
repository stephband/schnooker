
import { drawLines } from '../../colin/modules/canvas.js';
const assign = Object.assign;

export default function Box(env, x, y, w, h) {
    this.id   = 0;
    this.env  = env;
    this.type = 'box';

    this.data = Float64Array.of(
        x, y, w, h,
        0, 0, 0, 0,
        0, 0, 0, 0
    );

    this.size = 4;
}

assign(Box.prototype, {
    render: function() {
        const { ctx } = this.env;
        ctx.save();
        drawLines(ctx, [
            // x                         y
            this.data[0],                this.data[1],
            this.data[0] + this.data[2], this.data[1],
            this.data[0] + this.data[2], this.data[1] + this.data[3],
            this.data[0],                this.data[1] + this.data[3],
            this.data[0],                this.data[1]
        ]);
        ctx.lineWidth = 1;
        ctx.strokeStyle = '#000000';
        ctx.fillStyle   = '#245334';
        ctx.stroke();
        ctx.fill();
        ctx.restore();
    }
});
