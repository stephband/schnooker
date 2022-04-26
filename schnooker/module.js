
import get            from '../fn/modules/get.js';
import noop           from '../fn/modules/noop.js';
import overload       from '../fn/modules/overload.js';
import toPolar        from '../fn/modules/to-polar.js';
import toCartesian    from '../fn/modules/to-cartesian.js';
import denormalise    from '../fn/modules/denormalise.js';
import events         from '../dom/modules/events.js';
import gestures       from '../dom/modules/gestures.js';
import { vmin }       from '../dom/modules/parse-length.js';
import rect           from '../dom/modules/rect.js';
import { select }     from '../dom/modules/select.js';
import { detectStaticLineMovingCircle, detectCircleCircle } from '../colin/modules/detection.js';
import { mag, angle, distance } from '../colin/modules/vector.js';
import DOMRenderer    from '../colin/modules/dom-renderer.js';
import { drawLine, drawLines, drawCircle }   from '../colin/modules/canvas.js';

import createTable    from './modules/create-table.js';
//import Box            from './modules/box.js';
import Ball, { isBall } from './modules/ball.js';
import Pocket, { isPocket } from './modules/pocket.js';

const cueForceMutliplier = 3.6;
const cueForceMax        = 3.6;

const sin     = Math.sin;
const cos     = Math.cos;
const pi      = Math.PI;
const turn    = 2 * Math.PI;

const update = overload((a, b) => a.type + '-' + b.type, {
    'pocket-ball': function(pocket, ball, t1, t2) {
        const d = distance(ball.data[0] - pocket.data[0], ball.data[1] - pocket.data[1]);

        // Model motion of ball over pocket
        if (d < pocket.data[2]) {
            if (d > pocket.data[2] - ball.data[2]) {
                // Ball is on the edge of the pocket
                // Crude, can do better
                ball.data[6] = 10 * (pocket.data[0] - ball.data[0]);
                ball.data[7] = 10 * (pocket.data[1] - ball.data[1]);
            }
            else {
                // Ball is over the pocket
                ball.data[3] = ball.data[3] / 4;
                ball.data[4] = ball.data[4] / 4;
            }
        }
    },

    default: noop
});

const collisions = {};

const detect = overload((objectA, objectB) => objectA.type + '-' + objectB.type, {
    'cushion-ball': function(objectA, objectB, a1, a2, b1, b2) {
        let collision, key;

        return detectStaticLineMovingCircle(
            // Line
            a1[0], a1[1], a1[2], a1[3],
            // Circle at t1
            b1[0], b1[1], b1[2],
            // Circle at t2
            b2[0], b2[1], b2[2]
        );
    },

    'corner-ball': function(objectA, objectB, a1, a2, b1, b2) {
        return detectCircleCircle(
            // CircleA at t1 ... t2
            a1[0], a1[1], a1[2], a2[0], a2[1], a2[2],
            // CircleB at t1 ... t2
            b1[0], b1[1], b1[2], b2[0], b2[1], b2[2]
        );
    },

    'ball-ball': function(objectA, objectB, a1, a2, b1, b2) {
        return detectCircleCircle(
            // CircleA at t1 ... t2
            a1[0], a1[1], a1[2], a2[0], a2[1], a2[2],
            // CircleB at t1 ... t2
            b1[0], b1[1], b1[2], b2[0], b2[1], b2[2]
        );
    },

    default: noop
});

const collide = overload((collision) => collision.objectA.type + '-' + collision.objectB.type, {
    'cushion-ball': function(collision) {
        const point    = collision.point;
        const ball     = collision.objectB;
        const polarCol = toPolar([point[0] - ball.data[0], point[1] - ball.data[1]]);
        const polarVel = toPolar([ball.data[3], ball.data[4]]);

        // Plane of reflection
        polarCol[1] += 0.25 * turn;
        polarVel[1] = polarCol[1] + (polarCol[1] - polarVel[1]);

        const cartVel  = toCartesian(polarVel);

        ball.data[3] = cartVel[0];
        ball.data[4] = cartVel[1];
    },

    'corner-ball': function collideBallBall(collision) {
        const point    = collision.point;
        const ball     = collision.objectB;
        const polarCol = toPolar([point[0] - ball.data[0], point[1] - ball.data[1]]);
        const polarVel = toPolar([ball.data[3], ball.data[4]]);

        // Plane of reflection
        polarCol[1] += 0.25 * turn;
        polarVel[1] = polarCol[1] + (polarCol[1] - polarVel[1]);

        const cartVel  = toCartesian(polarVel);

        ball.data[3] = cartVel[0];
        ball.data[4] = cartVel[1];
    },

    'ball-ball': function collideBallBall(collision) {
        const a  = collision.objectA;
        const b  = collision.objectB;

        const pa = a.data.slice(0, 3);
        const va = a.data.slice(3, 6);
        const pb = b.data.slice(0, 3);
        const vb = b.data.slice(3, 6);
        const ma = a.mass;
        const mb = b.mass;

        const angleA  = angle(va[0], va[1]);
        const angleB  = angle(vb[0], vb[1]);
        const angleAB = Math.atan2(pb[1] - pa[1], pb[0] - pa[0]);
        const sa      = mag(va[0], va[1]);
        const sb      = mag(vb[0], vb[1]);

        a.data[3] = (sa * cos(angleA - angleAB) * (ma - mb) + 2 * mb * sb * cos(angleB - angleAB)) / (ma + mb) * cos(angleAB) + sa * sin(angleA - angleAB) * cos(angleAB + pi / 2);
        a.data[4] = (sa * cos(angleA - angleAB) * (ma - mb) + 2 * mb * sb * cos(angleB - angleAB)) / (ma + mb) * sin(angleAB) + sa * sin(angleA - angleAB) * sin(angleAB + pi / 2);
        b.data[3] = (sb * cos(angleB - angleAB) * (mb - ma) + 2 * ma * sa * cos(angleA - angleAB)) / (ma + mb) * cos(angleAB) + sb * sin(angleB - angleAB) * cos(angleAB + pi / 2);
        b.data[4] = (sb * cos(angleB - angleAB) * (mb - ma) + 2 * ma * sa * cos(angleA - angleAB)) / (ma + mb) * sin(angleAB) + sb * sin(angleB - angleAB) * sin(angleAB + pi / 2);
    },

    default: function(collision) {
        const type = collision.objectA.type + '-' + collision.objectB.type;
        console.log('No collide() for "' + type + '" collision');
    }
});



/* viewbox */

function updateViewbox(canvas, viewbox) {
    const width  = canvas.width;
    const height = canvas.height;

    viewbox[0] = -0.5 * width;
    viewbox[1] = -0.5 * height;
    viewbox[2] = width;
    viewbox[3] = height;
}


/* canvas */

function updateCanvas(canvas) {
    canvas.width  = window.innerWidth  * 2;
    canvas.height = window.innerHeight * 2;
}

/* renderer */

export default {
    // element, viewbox, update, detect, collide, render, camera, objects
    createRenderer: function(canvas) {
        const viewbox = [0, 0, 100, 100];

        Stream.merge([{}], events('resize', window)).each(() => {
            updateCanvas(canvas);
            updateViewbox(canvas, viewbox);
        });

        const env = {
            canvas: canvas,
            ctx:    canvas.getContext('2d'),
            viewbox
        };

        const objects = env.objects = [];
        // Scale to px
        const scale        = 720;

        //const tableLength  = 2.54;            // metres for a 9' table (100")
        const tableLength   = 2.2352;            // metres for a 8' table (88")
        const tableWidth    = 0.5 * tableLength; // metres
        const ballRadius    = 0.028575;          // metres
        const ballMass      = 0.18;              // kg
        const spacing       = Math.sin(Math.PI / 3) * 2.01 * ballRadius; // x or y distance between balls layed out in a triangle
        const pocketRadius  = 2 * ballRadius;    // metres
        const cushionRadius = 0.012;    // metres

        // Angle of pocket wall when pocket is on a 180˚ straight edge
        // https://www.dimensions.com/element/billiards-pool-table-pockets
        const pocketWallAngle  = 0.11398243261379608;
        const pocketWallLength = pocketRadius / Math.cos(pocketWallAngle);
        const pocketOffset180  = pocketRadius;
        //const pocketOffset90   = Math.pow(0.5 * Math.pow(pocketWallLength - pocketRadius, 2), 0.5);
        const pocketOffset90   = 0.39 * pocketRadius;

        // Table
        // env, x, y, w, h
        //objects.push(new Box(env, scale * -0.5 * tableWidth, scale * -0.5 * tableLength, tableWidth * scale, tableLength * scale));

        const tableShape = [
            scale * -0.5 * tableWidth, scale * -0.5 * tableLength,
            scale *  0.5 * tableWidth, scale * -0.5 * tableLength,
            scale *  0.5 * tableWidth, scale *  0   * tableLength,
            scale *  0.5 * tableWidth, scale *  0.5 * tableLength,
            scale * -0.5 * tableWidth, scale *  0.5 * tableLength,
            scale * -0.5 * tableWidth, scale *  0   * tableLength
        ];

        objects.push.apply(objects, createTable(env, tableShape, scale * pocketRadius, scale * cushionRadius));

        // Pockets
        // env, x, y, r, vx, vy, vr, mass
        /*objects.push(new Pocket(env, scale * (-0.5 * tableWidth - pocketOffset180), scale * 0, pocketRadius * scale, 0, 0, 0));
        objects.push(new Pocket(env, scale * (0.5  * tableWidth + pocketOffset180), scale * 0, pocketRadius * scale, 0, 0, 0));
        objects.push(new Pocket(env, scale * (-0.5 * tableWidth - pocketOffset90),  scale * (-0.5 * tableLength - pocketOffset90), pocketRadius * scale, 0, 0, 0));
        objects.push(new Pocket(env, scale * (0.5  * tableWidth + pocketOffset90),  scale * (-0.5 * tableLength - pocketOffset90), pocketRadius * scale, 0, 0, 0));
        objects.push(new Pocket(env, scale * (-0.5 * tableWidth - pocketOffset90),  scale * ( 0.5 * tableLength + pocketOffset90), pocketRadius * scale, 0, 0, 0));
        objects.push(new Pocket(env, scale * (0.5  * tableWidth + pocketOffset90),  scale * ( 0.5 * tableLength + pocketOffset90), pocketRadius * scale, 0, 0, 0));
        */
        // Balls
        // env, x, y, r, vx, vy, vr, mass
        objects.push(new Ball(env, scale * -4.01 * ballRadius, scale * -0.25 * tableLength - scale * 2 * spacing, scale * ballRadius, 0, 0, 0, ballMass, '#df2b0a'));
        objects.push(new Ball(env, scale * -2.01 * ballRadius, scale * -0.25 * tableLength - scale * 2 * spacing, scale * ballRadius, 0, 0, 0, ballMass, '#d2b417'));
        objects.push(new Ball(env, scale * 0,                  scale * -0.25 * tableLength - scale * 2 * spacing, scale * ballRadius, 0, 0, 0, ballMass, '#df2b0a'));
        objects.push(new Ball(env, scale * 2.01  * ballRadius, scale * -0.25 * tableLength - scale * 2 * spacing, scale * ballRadius, 0, 0, 0, ballMass, '#df2b0a'));
        objects.push(new Ball(env, scale * 4.01  * ballRadius, scale * -0.25 * tableLength - scale * 2 * spacing, scale * ballRadius, 0, 0, 0, ballMass, '#d2b417'));

        objects.push(new Ball(env, scale * -3.01 * ballRadius, scale * -0.25 * tableLength - scale * 1 * spacing, scale * ballRadius, 0, 0, 0, ballMass, '#d2b417'));
        objects.push(new Ball(env, scale * -1.01 * ballRadius, scale * -0.25 * tableLength - scale * 1 * spacing, scale * ballRadius, 0, 0, 0, ballMass, '#df2b0a'));
        objects.push(new Ball(env, scale * 1.01  * ballRadius, scale * -0.25 * tableLength - scale * 1 * spacing, scale * ballRadius, 0, 0, 0, ballMass, '#d2b417'));
        objects.push(new Ball(env, scale * 3.01  * ballRadius, scale * -0.25 * tableLength - scale * 1 * spacing, scale * ballRadius, 0, 0, 0, ballMass, '#df2b0a'));

        objects.push(new Ball(env, scale * -2.01 * ballRadius, scale * -0.25 * tableLength,                       scale * ballRadius, 0, 0, 0, ballMass, '#df2b0a'));
        objects.push(new Ball(env, scale * 0,                  scale * -0.25 * tableLength,                       scale * ballRadius, 0, 0, 0, ballMass, '#111111'));
        objects.push(new Ball(env, scale * 2.01  * ballRadius, scale * -0.25 * tableLength,                       scale * ballRadius, 0, 0, 0, ballMass, '#d2b417'));

        objects.push(new Ball(env, scale * -1.01 * ballRadius, scale * -0.25 * tableLength + scale * 1 * spacing, scale * ballRadius, 0, 0, 0, ballMass, '#d2b417'));
        objects.push(new Ball(env, scale * 1.01  * ballRadius, scale * -0.25 * tableLength + scale * 1 * spacing, scale * ballRadius, 0, 0, 0, ballMass, '#df2b0a'));

        objects.push(new Ball(env, scale * 0,                  scale * -0.25 * tableLength + scale * 2 * spacing, scale * ballRadius, 0, 0, 0, ballMass, '#d2b417'));

        // Cue ball
        // env, x, y, r, vx, vy, vr, mass
        objects.push(new Ball(env, scale * 0,                  scale *  0.25 * tableLength,                       scale * ballRadius, 0, 0, 0, ballMass, '#eeeeee'));


        // Table
        const gradient = env.ctx.createLinearGradient(tableShape[0], tableShape[1], tableShape[6], tableShape[7]);

        // Add three color stops
        gradient.addColorStop(0,   '#245334');
        gradient.addColorStop(0.3, '#325838');
        gradient.addColorStop(1,   '#194236');

        function renderTable(ctx) {
            ctx.save();
            ctx.lineWidth = 1;
            ctx.strokeStyle = '#000000';
            ctx.fillStyle   = gradient;

            drawLines(ctx, tableShape);

            ctx.stroke();
            ctx.fill();
            ctx.restore();

            // Draw ball shadows
            const balls = objects.filter(isBall);
            ctx.save();
            ctx.fillStyle = '#000000';
            ctx.globalAlpha = 0.0625;
            ctx.translate(scale * -0.002, scale * -0.005);
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
            ctx.translate(scale * -0.018, scale * -0.002);
            ctx.scale(1.02, 1.02);

            n = balls.length, ball;
            while (ball = balls[--n]) {
                drawCircle(ctx, ball.data);
                ctx.fill();
            }

            ctx.restore();
        }

        // TEMP s for state
        let s;
        const state = Stream.of('idle').broadcast({ memory: true, hot: true }).each((value) => {
            s = value;
            console.log('Snooker state', value);
        });

        const renderer = new DOMRenderer(env, update, detect, collide, objects, (env) => {
            const { ctx, viewbox } = env;
            ctx.clearRect(0, 0, viewbox[2] - viewbox[0], viewbox[3] - viewbox[1]);
            ctx.save();
            ctx.translate(-1 * viewbox[0], -1 * viewbox[1]);

            renderTable(ctx);
        }, (env) => {
            const { ctx, viewbox } = env;

            if (s === 'idle' && cueData.points.length) {
                ctx.save();
                ctx.lineWidth = 3;
                ctx.strokeStyle = '#000000';
                drawLine(ctx, cueData.points);
                ctx.stroke();
                ctx.restore();
            }

            if (s !== 'idle' && objects.filter(isBall).reduce((n, ball) => n + Math.abs(ball.data[3]) + Math.abs(ball.data[4]), 0) < 40) {
                state.push('idle');
            }

            ctx.restore()
        });

        renderer.start();
        //return renderer;

        const cueData = {
            points: [],
            ball:   undefined
        };

        gestures({ threshold: '1px',  }, canvas)
        .filter(() => s === 'idle')
        .each((gesture) => gesture.reduce(overload((data, e) => e.type, {
            pointerdown: function(data, e) {
                // Convert window coords to canvas coords
                const x = denormalise(viewbox[0], viewbox[0] + viewbox[2], e.clientX / window.innerWidth);
                const y = denormalise(viewbox[1], viewbox[1] + viewbox[3], e.clientY / window.innerHeight);

                const ball = objects
                    .filter(isBall)
                    .find((ball) => Math.pow(Math.pow(x - ball.data[0], 2) + Math.pow(y - ball.data[1], 2), 0.5) < ball.data[2]);

                if (!ball) {
                    gesture.stop();
                    return;
                }

                data.ball      = ball;
                data.points[0] = x;
                data.points[1] = y;
                return data;
            },

            pointermove: function(data, e) {
                // Convert window coords to canvas coords
                data.points[2] = denormalise(viewbox[0], viewbox[0] + viewbox[2], e.clientX / window.innerWidth);
                data.points[3] = denormalise(viewbox[1], viewbox[1] + viewbox[3], e.clientY / window.innerHeight);
                return data;
            },

            default: function(data, e) {
                // Release cue, give ball velocity
                data.ball.data[3] = cueForceMutliplier * (data.points[0] - data.points[2]);
                data.ball.data[4] = cueForceMutliplier * (data.points[1] - data.points[3]);

                state.push('playing');

                // Reset data
                data.points.length = 0;
                data.ball = undefined;
                return data;
            }
        }), cueData));
    }
}
