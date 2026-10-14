export const metadata = {
  title: "LaLinea Game · Milano",
  description: "Il platform LaLinea ambientato a Milano.",
};

export default function LaLineaGamePage() {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 10001, background: "#050505" }}>
      <a
        href="/"
        style={{
          position: "absolute", top: 0, left: 0, right: 0, height: 40,
          display: "flex", alignItems: "center", padding: "0 16px",
          color: "#ffdb35", font: "700 13px system-ui, sans-serif",
          textDecoration: "none", borderBottom: "1px solid #ffdb3540",
        }}
      >
        ← TORNA AL SITO LALINEA
      </a>
      <iframe
        src="/lalinea-game/index.html"
        title="LaLinea Game"
        allow="autoplay; fullscreen"
        allowFullScreen
        style={{ position: "absolute", top: 40, left: 0, width: "100%", height: "calc(100% - 40px)", border: 0, background: "#050505" }}
      />
    </div>
  );
}
