"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

// LALINEA_HALLOWEEN — cambia true in false per spegnere tutte le decorazioni.
const LALINEA_HALLOWEEN_ENABLED = true;
const START_AT = Date.parse("2026-10-26T00:00:00+01:00");
const END_AT = Date.parse("2026-11-02T00:00:00+01:00");
const ART: Record<string, string> = {"pumpkin":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\" fill=\"none\" aria-hidden=\"true\" focusable=\"false\"><path d=\"M48 24c-2-11 2-17 12-18l-2 10c-5 0-6 5-5 10\" fill=\"#74cf48\" stroke=\"#142016\" stroke-width=\"4\"/><path d=\"M51 29C23 13 3 35 7 62c3 25 25 35 44 30 23 7 45-8 44-34-1-26-22-44-44-29Z\" fill=\"#ff942e\" stroke=\"#211516\" stroke-width=\"4\"/><path d=\"M48 30c-16-8-26 9-26 29 0 18 11 32 23 32M55 30c17-7 25 11 23 31-1 16-9 29-21 31\" stroke=\"#e8641a\" stroke-width=\"4\"/><path d=\"m25 52 14-11 1 18ZM60 58l3-17 14 13Z\" fill=\"#20171b\"/><path d=\"m22 68 14 2 2 7 10-1 3-7 9 6 16-5c-7 21-42 24-54-2Z\" fill=\"#20171b\"/><path d=\"m36 71 3 8 7-1 2-7M62 74l1 6 7-4-1-5\" fill=\"#ffdf58\"/><path d=\"M17 44c2-7 7-10 11-11\" stroke=\"#ffe395\" stroke-width=\"4\" stroke-linecap=\"round\"/></svg>","ghost":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\" fill=\"none\" aria-hidden=\"true\" focusable=\"false\"><path d=\"M17 85V42C17 0 83 0 83 43v43L70 77 57 91 44 79 31 91 17 85Z\" fill=\"#f5eedc\" stroke=\"#25202f\" stroke-width=\"4\"/><path d=\"M28 40c0-14 9-22 18-23\" stroke=\"#fff\" stroke-width=\"5\" stroke-linecap=\"round\"/><ellipse cx=\"39\" cy=\"44\" rx=\"6\" ry=\"9\" fill=\"#292130\"/><ellipse cx=\"65\" cy=\"44\" rx=\"6\" ry=\"9\" fill=\"#292130\"/><path d=\"M46 63q9 9 16-2\" stroke=\"#292130\" stroke-width=\"4\" stroke-linecap=\"round\"/><ellipse cx=\"28\" cy=\"57\" rx=\"7\" ry=\"4\" fill=\"#ed967d\"/><ellipse cx=\"75\" cy=\"57\" rx=\"7\" ry=\"4\" fill=\"#ed967d\"/></svg>","candy":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\" fill=\"none\" aria-hidden=\"true\" focusable=\"false\"><path d=\"m28 31-22-7 5 24-5 23 23-5M72 31l22-7-5 24 5 23-23-5\" fill=\"#ad78ee\" stroke=\"#251b33\" stroke-width=\"4\" stroke-linejoin=\"round\"/><rect x=\"23\" y=\"25\" width=\"54\" height=\"47\" rx=\"18\" fill=\"#ffe34f\" stroke=\"#251b33\" stroke-width=\"4\"/><path d=\"m33 29 29 39M51 28l20 27\" stroke=\"#ff963b\" stroke-width=\"11\"/><rect x=\"23\" y=\"25\" width=\"54\" height=\"47\" rx=\"18\" stroke=\"#251b33\" stroke-width=\"4\"/><path d=\"m31 34 9-3\" stroke=\"#fff4b9\" stroke-width=\"4\" stroke-linecap=\"round\"/></svg>","zombie":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\" fill=\"none\" aria-hidden=\"true\" focusable=\"false\"><path d=\"m24 78-9 16h70L75 78 61 70H40Z\" fill=\"#ac7bd4\" stroke=\"#242235\" stroke-width=\"4\"/><path d=\"m40 76 10 15 11-15\" fill=\"#ffe34f\"/><path d=\"M20 29c0-20 61-22 61 0v31c0 26-61 29-61 0Z\" fill=\"#a6df6d\" stroke=\"#242235\" stroke-width=\"4\"/><path d=\"m19 34 4-19 15-7 15 4 15-3 14 15-3 13-13-10-9 6-12-9-12 10Z\" fill=\"#343342\" stroke=\"#242235\" stroke-width=\"3\"/><ellipse cx=\"36\" cy=\"49\" rx=\"10\" ry=\"12\" fill=\"#fff1d2\"/><circle cx=\"39\" cy=\"51\" r=\"4\" fill=\"#242235\"/><path d=\"m61 44 10 11m0-11-10 11M40 67l26-2m-19-4 1 11m11-12 1 10\" stroke=\"#242235\" stroke-width=\"4\" stroke-linecap=\"round\"/><path d=\"m23 61 6 2\" stroke=\"#6db24d\" stroke-width=\"5\" stroke-linecap=\"round\"/></svg>","monster":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\" fill=\"none\" aria-hidden=\"true\" focusable=\"false\"><path d=\"M23 28 15 7l23 13M64 19 85 7l-7 24\" fill=\"#ffe34f\" stroke=\"#241a35\" stroke-width=\"4\" stroke-linejoin=\"round\"/><path d=\"M14 47c0-43 73-44 73 0v30L73 92 60 80 46 93 33 81 18 91Z\" fill=\"#ad78e8\" stroke=\"#241a35\" stroke-width=\"4\"/><ellipse cx=\"51\" cy=\"43\" rx=\"22\" ry=\"21\" fill=\"#fff3d4\" stroke=\"#241a35\" stroke-width=\"3\"/><circle cx=\"53\" cy=\"44\" r=\"11\" fill=\"#8ed758\"/><circle cx=\"54\" cy=\"44\" r=\"6\" fill=\"#241a35\"/><circle cx=\"57\" cy=\"40\" r=\"3\" fill=\"#fff\"/><path d=\"M33 73q17 13 36-2\" stroke=\"#241a35\" stroke-width=\"4\" stroke-linecap=\"round\"/><path d=\"m41 76 6 8 5-7\" fill=\"#fff3d4\"/></svg>"};
const CSS = "/* LALINEA_HALLOWEEN — tutti gli stili sono limitati al livello decorativo. */\n#ll-hw26-root{position:fixed!important;inset:0!important;z-index:40!important;overflow:hidden!important;pointer-events:none!important;user-select:none!important;isolation:isolate;contain:layout style;}\n#ll-hw26-root,#ll-hw26-root *{box-sizing:border-box!important;pointer-events:none!important;}\n#ll-hw26-root .ll-hw26-item{position:absolute;display:block;margin:0;padding:0;filter:drop-shadow(0 2px 3px #0006);}\n#ll-hw26-root svg{display:block!important;width:100%!important;height:100%!important;overflow:visible;}\n#ll-hw26-root .ll-hw26-ghost svg{animation:ll-hw26-inline-float 7s ease-in-out infinite;}\n@keyframes ll-hw26-inline-float{0%,100%{transform:translateY(0);}50%{transform:translateY(-2px);}}\n@media(prefers-reduced-motion:reduce){#ll-hw26-root svg{animation:none!important;}}\n@media print{#ll-hw26-root{display:none!important;}}\n";
const KINDS = ["pumpkin", "zombie", "candy", "monster", "ghost"];
type Decoration = { key: number; x: number; y: number; size: number; kind: string };

export default function LaLineaHalloween2026() {
  const [active, setActive] = useState(false);
  const [decorations, setDecorations] = useState<Decoration[]>([]);

  useEffect(() => {
    if (!LALINEA_HALLOWEEN_ENABLED) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const sync = () => {
      if (timer !== undefined) clearTimeout(timer);
      const now = Date.now();
      setActive(now >= START_AT && now < END_AT);
      const next = now < START_AT ? START_AT : END_AT;
      if (next > now) timer = setTimeout(sync, Math.min(next - now, 2147483647));
    };
    sync();
    document.addEventListener("visibilitychange", sync);
    window.addEventListener("pageshow", sync);
    return () => {
      if (timer !== undefined) clearTimeout(timer);
      document.removeEventListener("visibilitychange", sync);
      window.removeEventListener("pageshow", sync);
    };
  }, []);

  useEffect(() => {
    if (!active || !LALINEA_HALLOWEEN_ENABLED) return;
    let pending = 0;
    let stopped = false;
    let headings: HTMLElement[] = [];
    const root = document.getElementById("ll-hw26-root");
    const collect = () => {
      headings = Array.from(document.querySelectorAll<HTMLElement>("h1,h2,h3"));
    };
    const measure = () => {
      pending = 0;
      if (stopped) return;
      const compact = window.innerWidth <= 640;
      const size = compact ? 25 : 36;
      const result: Decoration[] = [];
      headings.forEach((heading, index) => {
        if (result.length >= (compact ? 6 : 10) || !heading.isConnected) return;
        if (heading.closest('header,nav,form,button,a,dialog,[role="dialog"],[aria-modal="true"],[inert],[aria-hidden="true"],#ll-carrello')) return;
        if (/carrell|checkout|accedi|login|password|pagament|riepilog|totale|conferma ordine/i.test(heading.textContent || "")) return;
        const box = heading.getBoundingClientRect();
        if (box.width <= 0 || box.height <= 0 || box.bottom < 0 || box.top > window.innerHeight) return;
        const style = window.getComputedStyle(heading);
        if (style.visibility !== "visible" || Number(style.opacity) === 0) return;
        const range = document.createRange();
        range.selectNodeContents(heading);
        const text = range.getBoundingClientRect();
        if (text.width <= 0 || text.height <= 0) return;
        // Si usa soltanto lo spazio vuoto a destra del testo, dentro il titolo.
        const x = Math.round(text.right + 11);
        const y = Math.round(text.top + (text.height - size) / 2);
        if (x + size > Math.min(box.right - 4, window.innerWidth - 12) || y < 2 || y + size > window.innerHeight - 2) return;
        if (result.some(item => x < item.x + item.size + 8 && x + size + 8 > item.x && y < item.y + item.size + 8 && y + size + 8 > item.y)) return;
        // Non collocare disegni su controlli che occupano quello spazio.
        const points = [[x + 3, y + 3], [x + size - 3, y + 3], [x + size / 2, y + size / 2], [x + 3, y + size - 3], [x + size - 3, y + size - 3]];
        if (points.some(([px,py]) => document.elementFromPoint(px,py)?.closest('button,a,input,select,textarea,video,iframe,nav,form,[role="button"],[role="dialog"]'))) return;
        result.push({ key: index, x, y, size, kind: KINDS[index % KINDS.length] });
      });
      setDecorations(previous => JSON.stringify(previous) === JSON.stringify(result) ? previous : result);
    };
    const schedule = () => {
      if (!stopped && !pending) pending = window.requestAnimationFrame(measure);
    };
    const observer = new MutationObserver(records => {
      const outside = records.some(record => {
        if (root && (record.target === root || root.contains(record.target))) return false;
        if (record.type === "childList") {
          const nodes = [...Array.from(record.addedNodes), ...Array.from(record.removedNodes)];
          if (nodes.length && nodes.every(node => node === root || root?.contains(node))) return false;
        }
        return true;
      });
      if (outside) { collect(); schedule(); }
    });
    collect();
    schedule();
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["class", "style", "hidden", "aria-hidden"] });
    const resize = typeof ResizeObserver !== "undefined" ? new ResizeObserver(schedule) : null;
    resize?.observe(document.body);
    window.addEventListener("scroll", schedule, { capture: true, passive: true });
    window.addEventListener("resize", schedule);
    window.addEventListener("pageshow", schedule);
    document.fonts?.addEventListener("loadingdone", schedule);
    return () => {
      stopped = true;
      if (pending) cancelAnimationFrame(pending);
      observer.disconnect();
      resize?.disconnect();
      window.removeEventListener("scroll", schedule, true);
      window.removeEventListener("resize", schedule);
      window.removeEventListener("pageshow", schedule);
      document.fonts?.removeEventListener("loadingdone", schedule);
    };
  }, [active]);

  if (!active || !LALINEA_HALLOWEEN_ENABLED) return null;
  return createPortal(
    <div id="ll-hw26-root" aria-hidden="true" style={{ pointerEvents: "none" }}>
      <style>{CSS}</style>
      {decorations.map(item => (
        <span
          key={item.key}
          className={`ll-hw26-item ll-hw26-${item.kind}`}
          data-lalinea-halloween="decorazione"
          style={{ left: item.x, top: item.y, width: item.size, height: item.size }}
          dangerouslySetInnerHTML={{ __html: ART[item.kind] }}
        />
      ))}
    </div>, document.body
  );
}
