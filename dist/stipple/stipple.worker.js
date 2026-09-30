// Computes stipple dots off the main thread for StippleCanvas.
import { stipple } from "./stipple.js";
self.onmessage = ({ data }) => {
    const dots = { a: [], b: [] };
    stipple(data.pattern, data.bounds, (dot) => dots[dot.ink].push(dot.x, dot.y));
    const a = Float32Array.from(dots.a);
    const b = Float32Array.from(dots.b);
    const response = { a, b };
    self.postMessage(response, [a.buffer, b.buffer]);
};
