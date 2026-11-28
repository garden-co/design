// Computes stipple dots off the main thread for StippleCanvas.
import { stipple } from "./stipple.js";
self.onmessage = ({ data }) => {
    const dots = {};
    stipple(data.pattern, data.bounds, (dot) => (dots[dot.ink] ??= []).push(dot.x, dot.y));
    const response = Object.fromEntries(Object.entries(dots).map(([ink, xy]) => [ink, Float32Array.from(xy)]));
    self.postMessage(response, Object.values(response).map((xy) => xy.buffer));
};
