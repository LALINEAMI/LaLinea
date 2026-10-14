"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export default function LaLineaGameButton() {
  const [open, setOpen] = useState(false);
  const launcher = useRef<HTMLButtonElement>(null);
  const closer = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    const frame = requestAnimationFrame(() => closer.current?.focus());
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
      launcher.current?.focus();
    };
  }, [open]);

  return (
    <>
      <button
        ref={launcher}
        type="button"
        aria-label="Gioca a LaLinea Game"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={(event) => { event.stopPropagation(); setOpen(true); }}
        style={{
          position: "fixed", right: 12, bottom: "calc(110px + env(safe-area-inset-bottom))",
          zIndex: 90, display: "flex", alignItems: "center", gap: 8,
          padding: "8px 12px", background: "#050505", color: "#ffdb35",
          border: "2px solid #ffdb35", borderRadius: 12,
          boxShadow: "0 3px 15px #0009", cursor: "pointer",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <img
          src="/lalinea-game/assets/lalinea-logo.png"
          alt="LaLinea"
          width={58}
          height={29}
          data-no-preview="true"
          style={{ display: "block", width: 58, height: 29, flexShrink: 0, objectFit: "contain" }}
        />
        <span style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <strong style={{ fontSize: 13 }}>GIOCA 🎮</strong>
          <span style={{ fontSize: 9, color: "#43df80", fontWeight: 700 }}>LaLinea Game</span>
        </span>
      </button>
      {open && createPortal(
        <div
          role="dialog"
          aria-modal="true"
          aria-label="LaLinea Game"
          onClick={(event) => event.stopPropagation()}
          style={{ position: "fixed", inset: 0, zIndex: 10002, background: "#050505" }}
        >
          <button
            ref={closer}
            type="button"
            onClick={() => setOpen(false)}
            style={{
              position: "absolute", top: 0, left: 0, right: 0, width: "100%", height: 40,
              display: "flex", alignItems: "center", padding: "0 16px",
              background: "#050505", color: "#ffdb35", cursor: "pointer",
              font: "700 13px system-ui, sans-serif", border: 0,
              borderBottom: "1px solid #ffdb3540",
            }}
          >
            ← CHIUDI E TORNA AL SITO LALINEA
          </button>
          <iframe
            src="/lalinea-game/index.html"
            title="LaLinea Game"
            allow="autoplay; fullscreen"
            allowFullScreen
            style={{ position: "absolute", top: 40, left: 0, width: "100%", height: "calc(100% - 40px)", border: 0, background: "#050505" }}
          />
        </div>,
        document.body
      )}
    </>
  );
}
