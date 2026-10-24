import type { Point, ShapeAnnotation } from '../model/types';
import { shapeCenter, shapePoint } from './shapes';

const gap = (a: Point, b: Point) => Math.hypot(a.x-b.x, a.y-b.y);
const clamp = (n: number, a: number, b: number) => Math.max(a, Math.min(b, n));

/** Normalized local coordinates survive movement, resizing and rotation. */
export function shapeAnchorPoint(shape: ShapeAnnotation, anchor: Point): Point {
  return shapePoint(shape, { x: shape.x + anchor.x*shape.width, y: shape.y + anchor.y*shape.height });
}

export function nearestShapeAnchor(shape: ShapeAnnotation, point: Point, tolerance: number) {
  if (shape.kind === 'rectangle' && shape.frame) return null;
  const local = shapePoint(shape, point, true), center = shapeCenter(shape);
  const candidates: Point[] = [center];
  if (shape.kind === 'circle') {
    const theta = Math.atan2(local.y-center.y, local.x-center.x), radius = shape.width/2;
    candidates.push({ x: center.x+radius*Math.cos(theta), y: center.y+radius*Math.sin(theta) });
    for (let i=0; i<4; i++) candidates.push({ x: center.x+radius*Math.cos(i*Math.PI/2), y: center.y+radius*Math.sin(i*Math.PI/2) });
  } else {
    const { x, y, width: w, height: h } = shape;
    const raw = shape.cornerRadii ?? [0,0,0,0], [a,b,c,d] = raw;
    const ratio = Math.min(1,w/Math.max(.001,a+b),w/Math.max(.001,c+d),h/Math.max(.001,a+d),h/Math.max(.001,b+c));
    const [tl,tr,br,bl] = raw.map(r=>r*ratio);
    candidates.push({x:clamp(local.x,x+tl,x+w-tr),y}, {x:x+w,y:clamp(local.y,y+tr,y+h-br)},
      {x:clamp(local.x,x+bl,x+w-br),y:y+h}, {x,y:clamp(local.y,y+tl,y+h-bl)});
    for (const [cx,cy,r,start] of [[x+tl,y+tl,tl,Math.PI],[x+w-tr,y+tr,tr,Math.PI*1.5],
      [x+w-br,y+h-br,br,0],[x+bl,y+h-bl,bl,Math.PI*.5]]) {
      let theta = (Math.atan2(local.y-cy,local.x-cx)+Math.PI*2)%(Math.PI*2);
      if (start===Math.PI*1.5 && theta===0) theta=Math.PI*2;
      theta=clamp(theta,start,start+Math.PI/2);
      candidates.push({x:cx+r*Math.cos(theta),y:cy+r*Math.sin(theta)});
    }
  }
  candidates.sort((a,b)=>gap(a,local)-gap(b,local));
  const hit=candidates[0];
  if (gap(hit,local)>tolerance) return null;
  return { point:shapePoint(shape,hit), anchor:{x:clamp((hit.x-shape.x)/shape.width,0,1),y:clamp((hit.y-shape.y)/shape.height,0,1)} };
}
