import { type StipplePattern } from './stipple.js';
export type StippleRequest = {
    pattern: StipplePattern;
    bounds: {
        left: number;
        top: number;
        right: number;
        bottom: number;
    };
};
/** Dot centres per ink, as x, y pairs in pattern units. */
export type StippleResponse = Record<string, Float32Array>;
