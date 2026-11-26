'use client';
import { jsx as _jsx } from "react/jsx-runtime";
import { useEffect, useRef } from 'react';
import { resolveInk, stipple } from "./stipple.js";
let worker;
let busy = false;
let current;
let waiting;
/**
 * Computes dots in a shared worker, one job at a time. A job that is still
 * waiting when a newer one arrives is dropped (resolves to undefined), so
 * dragging a slider never queues up stale work.
 */
function computeDots(pattern, bounds) {
    if (typeof Worker === 'undefined')
        return Promise.resolve(collectDots(pattern, bounds));
    return new Promise((done) => {
        waiting?.done(undefined);
        waiting = { pattern, bounds, done };
        runNext();
    });
}
function runNext() {
    if (busy || !waiting)
        return;
    if (!worker) {
        worker = new Worker(new URL('./stipple.worker.js', import.meta.url), { type: 'module' });
        worker.onmessage = ({ data }) => {
            busy = false;
            current?.done(data);
            runNext();
        };
    }
    current = waiting;
    waiting = undefined;
    busy = true;
    const request = { pattern: current.pattern, bounds: current.bounds };
    worker.postMessage(request);
}
function collectDots(pattern, bounds) {
    const dots = {};
    stipple(pattern, bounds, (dot) => (dots[dot.ink] ??= []).push(dot.x, dot.y));
    return Object.fromEntries(Object.entries(dots).map(([ink, xy]) => [ink, Float32Array.from(xy)]));
}
/** The pattern area a canvas shows: one unit is half its height, centre in the middle. */
function boundsOf(width, height) {
    const halfWidth = width / height;
    return { left: -halfWidth, right: halfWidth, top: -1, bottom: 1 };
}
/**
 * Draws a stipple pattern into a canvas that fills its box. The pattern's
 * centre sits at the box centre and one pattern unit is half the box height,
 * so the composition scales with the box. Dots are worked out in a worker and
 * kept while only the box's size changes; the canvas gets `data-drawn` once it
 * shows the pattern.
 *
 * Three optional CSS custom properties (read from the canvas, so they can be
 * set on any ancestor) pin details to screen pixels instead, so a bigger box
 * shows more of them rather than bigger ones: `--pattern-dot-radius` and
 * `--pattern-dot-spacing` (px) replace the pattern's `radius` and `spacing`,
 * and `--pattern-rib-unit` (px) is the size of one pattern unit for fluting
 * widths, so each rib is `period × rib unit` pixels wide.
 */
export function StippleCanvas({ pattern, className, style, }) {
    const ref = useRef(null);
    useEffect(() => {
        const canvas = ref.current;
        if (!canvas)
            return;
        let cancelled = false;
        let frame = 0;
        let cached;
        const draw = async () => {
            const dpr = window.devicePixelRatio || 1;
            const width = Math.round(canvas.clientWidth * dpr);
            const height = Math.round(canvas.clientHeight * dpr);
            if (!width || !height)
                return;
            const bounds = boundsOf(width, height);
            const sized = sizePattern(pattern, canvas);
            // Dots depend on the aspect ratio and pixel-pinned details, not the size.
            const key = JSON.stringify([
                (width / height).toFixed(3),
                sized.spacing,
                sized.radius,
                sized.layers,
                // Ink settings matter, colours don't.
                Object.entries(sized.inks).map(([ink, style]) => [ink, typeof style === 'string' ? {} : { ...style, color: 0 }]),
            ]);
            if (cached?.key !== key) {
                const dots = await computeDots(sized, bounds);
                if (cancelled || !dots)
                    return;
                cached = { key, dots };
            }
            canvas.width = width;
            canvas.height = height;
            paint(canvas, sized, cached.dots);
            canvas.dataset.drawn = '';
        };
        const observer = new ResizeObserver(() => {
            cancelAnimationFrame(frame);
            frame = requestAnimationFrame(() => void draw());
        });
        observer.observe(canvas);
        return () => {
            cancelled = true;
            cancelAnimationFrame(frame);
            observer.disconnect();
        };
    }, [pattern]);
    return _jsx("canvas", { ref: ref, "aria-hidden": true, className: className, style: style });
}
/** Applies the pixel-pinned details a canvas's CSS asks for, if any. */
function sizePattern(pattern, canvas) {
    const style = getComputedStyle(canvas);
    const px = (name) => {
        const value = Number.parseFloat(style.getPropertyValue(name));
        return Number.isFinite(value) && value > 0 ? value : undefined;
    };
    // Pixels per pattern unit, rounded so sub-pixel resizes keep the dots.
    const unit = Math.round(canvas.clientHeight / 2);
    const round = (v) => Number(v.toPrecision(4));
    const radius = px('--pattern-dot-radius');
    const spacing = px('--pattern-dot-spacing');
    const ribUnit = px('--pattern-rib-unit');
    // Per-ink sizes keep their proportion to the pattern's.
    const radiusScale = radius ? radius / unit / pattern.radius : 1;
    const spacingScale = spacing ? spacing / unit / pattern.spacing : 1;
    const inks = radius || spacing
        ? Object.fromEntries(Object.entries(pattern.inks).map(([ink, style]) => [
            ink,
            typeof style === 'string'
                ? style
                : {
                    ...style,
                    ...(style.radius != null && { radius: round(style.radius * radiusScale) }),
                    ...(style.spacing != null && { spacing: round(style.spacing * spacingScale) }),
                },
        ]))
        : pattern.inks;
    return {
        ...pattern,
        inks,
        radius: radius ? round(radius / unit) : pattern.radius,
        spacing: spacing ? round(spacing / unit) : pattern.spacing,
        layers: ribUnit
            ? pattern.layers.map((layer) => ({
                ...layer,
                warps: layer.warps?.map((warp) => warp.type === 'flute' ? { ...warp, period: round((warp.period * ribUnit) / unit) } : warp),
            }))
            : pattern.layers,
    };
}
function paint(canvas, pattern, dots) {
    const ctx = canvas.getContext('2d');
    if (!ctx)
        return;
    const { width, height } = canvas;
    const scale = height / 2;
    ctx.clearRect(0, 0, width, height);
    for (const ink of Object.keys(pattern.inks)) {
        const xy = dots[ink];
        if (!xy)
            continue;
        const style = resolveInk(pattern, ink);
        const radius = Math.max(style.radius * scale, 0.5);
        const path = new Path2D();
        for (let i = 0; i < xy.length; i += 2) {
            const x = width / 2 + xy[i] * scale;
            const y = height / 2 + xy[i + 1] * scale;
            path.moveTo(x + radius, y);
            path.arc(x, y, radius, 0, Math.PI * 2);
        }
        ctx.fillStyle = style.color;
        ctx.fill(path);
    }
}
/** Renders `pattern` over the whole canvas at its current pixel size, in place. */
export function drawStipple(canvas, pattern) {
    paint(canvas, pattern, collectDots(pattern, boundsOf(canvas.width, canvas.height)));
}
