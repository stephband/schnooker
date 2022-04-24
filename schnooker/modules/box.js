
import { drawLines, drawCircle } from '../../colin/modules/canvas.js';
import { isBall }    from './ball.js';

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

    this.gradient = env.ctx.createLinearGradient(x + 0.25 * w, y, x + 0.75 * w, y + h);

    // Add three color stops
    this.gradient.addColorStop(0,   '#245334');
    this.gradient.addColorStop(0.3, '#325838');
    this.gradient.addColorStop(1,   '#194236');
}

assign(Box.prototype, {
    render: function(env) {
        const { objects } = env;
        const { ctx } = this.env;
        ctx.save();
        ctx.lineWidth = 1;
        ctx.strokeStyle = '#000000';
        ctx.fillStyle   = this.gradient;

        drawLines(ctx, [
            // x                         y
            this.data[0],                this.data[1],
            this.data[0] + this.data[2], this.data[1],
            this.data[0] + this.data[2], this.data[1] + this.data[3],
            this.data[0],                this.data[1] + this.data[3],
            this.data[0],                this.data[1]
        ]);

        ctx.stroke();
        ctx.fill();
        ctx.restore();

        // Draw ball shadows
        const balls = objects.filter(isBall);
        ctx.save();
        ctx.fillStyle = '#000000';
        ctx.globalAlpha = 0.0625;
        ctx.translate(-0.002 * this.data[2], -0.005 * this.data[3]);
        ctx.scale(1.02, 1.02);

        let n = balls.length, ball;
        while (ball = balls[--n]) {
            drawCircle(ctx, ball.data);
            ctx.fill();
        }

        ctx.restore();

        ctx.save();
        ctx.fillStyle = '#000000';
        ctx.globalAlpha = 0.0625;
        ctx.translate(-0.018 * this.data[2], -0.002 * this.data[3]);
        ctx.scale(1.02, 1.02);

        n = balls.length, ball;
        while (ball = balls[--n]) {
            drawCircle(ctx, ball.data);
            ctx.fill();
        }

        ctx.restore();
    }
});
