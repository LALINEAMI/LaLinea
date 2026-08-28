import type { ReactNode } from "react";

export default function VipLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <>
      <a
        href="/"
        className="fixed left-4 top-4 z-[9999] bg-yellow-400 px-4 py-3 text-xs font-black uppercase tracking-widest text-black shadow-xl"
      >
        ← Torna al negozio
      </a>

      {children}
    </>
  );
}