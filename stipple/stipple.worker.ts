// Computes stipple dots off the main thread for StippleCanvas.
import {stipple, type StipplePattern} from './stipple.ts';

export type StippleRequest = {
  pattern: StipplePattern;
  bounds: {left: number; top: number; right: number; bottom: number};
};

/** Dot centres per ink, as x, y pairs in pattern units. */
export type StippleResponse = Record<string, Float32Array>;

self.onmessage = ({data}: MessageEvent<StippleRequest>) => {
  const dots: Record<string, number[]> = {};
  stipple(data.pattern, data.bounds, (dot) => (dots[dot.ink] ??= []).push(dot.x, dot.y));
  const response: StippleResponse = Object.fromEntries(
    Object.entries(dots).map(([ink, xy]) => [ink, Float32Array.from(xy)]),
  );
  (self as unknown as Worker).postMessage(
    response,
    Object.values(response).map((xy) => xy.buffer),
  );
};
