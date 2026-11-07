"use client";

import { useEffect } from "react";

// Monta una sola volta nel layout, dentro il body.
export default function LaLineaTapEffects() {
  useEffect(() => {
    if (!window.PointerEvent || typeof Element.prototype.animate !== "function") return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const layer = document.createElement("div");
    layer.setAttribute("aria-hidden", "true");
    layer.style.cssText = "position:fixed;inset:0;pointer-events:none;overflow:hidden;z-index:2147483647;contain:strict;";
    document.body.appendChild(layer);

    const running = new Set<Animation>();
    const presses = new WeakMap<Element, Animation>();
    let tap: { id: number; x: number; y: number; time: number; target: Element } | null = null;

    const animate = (element: Element, frames: Keyframe[], options: KeyframeAnimationOptions, remove = false) => {
      const animation = element.animate(frames, options);
      running.add(animation);
      const finish = () => {
        running.delete(animation);
        if (remove) element.remove();
      };
      void animation.finished.then(finish, finish);
      return animation;
    };

    const burst = (x: number, y: number) => {
      if (layer.childElementCount > 28) return;

      const ring = document.createElement("span");
      ring.style.cssText = `position:absolute;left:${x}px;top:${y}px;width:24px;height:24px;border:2px solid #7bffb2;border-radius:50%;box-shadow:0 0 14px #7bffb260;pointer-events:none;`;
      layer.appendChild(ring);
      animate(ring, [
        { transform: "translate(-50%, -50%) scale(.35)", opacity: .85 },
        { transform: "translate(-50%, -50%) scale(3)", opacity: 0 },
      ], { duration: 380, easing: "cubic-bezier(.16,1,.3,1)" }, true);

      for (let i = 0; i < 6; i++) {
        const angle = i * Math.PI / 3;
        const dx = Math.cos(angle) * 32;
        const dy = Math.sin(angle) * 32;
        const color = i % 2 ? "#eaf17a" : "#7bffb2";
        const spark = document.createElement("span");
        spark.style.cssText = `position:absolute;left:${x}px;top:${y}px;width:4px;height:4px;border-radius:50%;background:${color};box-shadow:0 0 6px ${color};pointer-events:none;`;
        layer.appendChild(spark);
        animate(spark, [
          { transform: "translate(-50%, -50%) scale(1)", opacity: .9 },
          { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(.25)`, opacity: 0 },
        ], { duration: 360, easing: "ease-out" }, true);
      }
    };

    const cancel = () => { tap = null; };

    const down = (event: PointerEvent) => {
      tap = null;
      if (event.pointerType !== "touch" || !event.isPrimary || reducedMotion.matches) return;
      if (!(event.target instanceof Element)) return;
      if (event.target.closest("input, textarea, select, audio, video, [data-ll-tap='off'], [inert], [aria-disabled='true']")) return;
      const target = event.target.closest("button, a[href], [role='button'], [data-ll-tap]");
      if (!target || target.matches(":disabled")) return;
      tap = { id: event.pointerId, x: event.clientX, y: event.clientY, time: performance.now(), target };
    };

    const move = (event: PointerEvent) => {
      if (tap && event.pointerId === tap.id && Math.hypot(event.clientX - tap.x, event.clientY - tap.y) > 10) cancel();
    };

    const up = (event: PointerEvent) => {
      const current = tap;
      if (!current || event.pointerId !== current.id) return;
      cancel();
      if (reducedMotion.matches || !current.target.isConnected || performance.now() - current.time > 500) return;
      if (Math.hypot(event.clientX - current.x, event.clientY - current.y) > 10) return;
      const hit = document.elementFromPoint(event.clientX, event.clientY);
      if (!hit || !current.target.contains(hit) || current.target.matches(":disabled, [aria-disabled='true']")) return;

      burst(event.clientX, event.clientY);
      if (!(current.target instanceof HTMLElement)) return;
      presses.get(current.target)?.cancel();
      const press = animate(current.target, [
        { transform: "scale(1)" },
        { transform: "scale(.975)" },
        { transform: "scale(1)" },
      ], { duration: 180, easing: "ease-out", composite: "add" });
      presses.set(current.target, press);
    };

    const options = { capture: true, passive: true };
    document.addEventListener("pointerdown", down, options);
    document.addEventListener("pointermove", move, options);
    document.addEventListener("pointerup", up, options);
    document.addEventListener("pointercancel", cancel, options);
    document.addEventListener("scroll", cancel, options);
    window.addEventListener("blur", cancel);

    const motionChange = () => {
      cancel();
      if (reducedMotion.matches) running.forEach(animation => animation.cancel());
    };
    reducedMotion.addEventListener("change", motionChange);

    return () => {
      document.removeEventListener("pointerdown", down, true);
      document.removeEventListener("pointermove", move, true);
      document.removeEventListener("pointerup", up, true);
      document.removeEventListener("pointercancel", cancel, true);
      document.removeEventListener("scroll", cancel, true);
      window.removeEventListener("blur", cancel);
      reducedMotion.removeEventListener("change", motionChange);
      running.forEach(animation => animation.cancel());
      layer.remove();
    };
  }, []);

  return null;
}
