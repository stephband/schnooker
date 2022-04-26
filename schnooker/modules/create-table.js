
import toPolar     from '../../fn/modules/to-polar.js';
import toCartesian from '../../fn/modules/to-cartesian.js';
import { angle }   from '../../colin/modules/vector.js';

import Cushion, { isCushion } from './cushion.js';
import Corner,  { isCorner }  from './corner.js';
import Pocket,  { isPocket }  from './pocket.js';

const assign = Object.assign;
const turn   = 2 * Math.PI;

export default function createTable(env, points, pocketRadius, cushionRadius) {
    // Work out the relationship between corner angle and distance the pocket
    // centre is from the corner point, given the distances at angles of 180
    // and 275. Table must be specced in clockwise direction!
    // distance = angle * g + c
    const dAt180 = pocketRadius;
    const dAt275 = 0.39 * pocketRadius;
    const g = (dAt180 - dAt275) / (0.5 * turn - 0.75 * turn);
    const c = dAt180 - 0.5 * turn * g;

    function pocketDistance(angle) {
        return angle * g + c;
    }

    // Work out the relationship between corner angle and additional width
    // given to the cushion mouth in front of the pocket, given the distances
    // at angles of 180 and 275. Table must be specced in clockwise direction!
    // extramouth = angle * m + k, limited to not less than 0
    const eAt180 = 0.228070 * pocketRadius;
    const eAt275 = 0;
    const m = (eAt180 - eAt275) / (0.5 * turn - 0.75 * turn);
    const k = eAt180 - 0.5 * turn * m;

    function mouthDistance(angle) {
        const e = angle * m + k;
        return e < 0 ? 0 : e ;
    }

    const coords = [];
    let n = 0;
    while (n < points.length) {
        coords.push([points[n], points[n + 1]]);
        n = n + 2;
    }

    const objects = [];

    // Create pockets
    let p = -1;
    let cushions = [];
    while (++p < coords.length) {
        const p1    = coords[p - 1] || coords[coords.length - 1];
        const p2    = coords[p];
        const p3    = coords[p + 1] || coords[0];
        const a21   = Math.atan2(p1[1] - p2[1], p1[0] - p2[0]);
        const a23   = Math.atan2(p3[1] - p2[1], p3[0] - p2[0]);

        const angle = (a23 < a21 ? turn + a23 : a23) - a21;
        const a     = a21 + 0.5 * angle;
        const d     = pocketDistance(angle);
        const y     = Math.sin(a) * d;
        const x     = Math.cos(a) * d;

        objects.push(new Pocket(env, p2[0] + x, p2[1] + y, pocketRadius));

        const extra = mouthDistance(angle);
        // TODO: this is currently wrong: it should not simply be pocketRadius - look at the
        // result at 275 angles to see this is the case
        const l21x  = p2[0] + Math.cos(a21) * (pocketRadius + cushionRadius + extra);
        const l21y  = p2[1] + Math.sin(a21) * (pocketRadius + cushionRadius + extra);
        const l23x  = p2[0] + Math.cos(a23) * (pocketRadius + cushionRadius + extra);
        const l23y  = p2[1] + Math.sin(a23) * (pocketRadius + cushionRadius + extra);

        const c21x  = l21x - Math.cos(a21 - 0.25 * turn) * cushionRadius;
        const c21y  = l21y - Math.sin(a21 - 0.25 * turn) * cushionRadius;
        const c23x  = l23x + Math.cos(a23 - 0.25 * turn) * cushionRadius;
        const c23y  = l23y + Math.sin(a23 - 0.25 * turn) * cushionRadius;

        cushions.push([l21x, l21y, l23x, l23y, c21x, c21y, c23x, c23y]);
    }

    p = -1;
    while (++p < cushions.length) {
        const [,,l1x,l1y,,,c1x,c1y] = cushions[p];
        const [l2x,l2y,,,c2x,c2y,,] = cushions[p + 1] || cushions[0];

        objects.push(new Cushion(env, l1x, l1y, l2x, l2y));
        objects.push(new Corner(env, c1x, c1y, cushionRadius));
        objects.push(new Corner(env, c2x, c2y, cushionRadius));
    }

    return objects;
}
