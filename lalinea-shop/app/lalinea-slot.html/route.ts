import type { NextRequest } from "next/server";
import { authenticate, GameError, SESSION_COOKIE } from "../../lib/laMilaneseVip";
import { slotHtml } from "./gioco";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const privateHeaders = {
  "Cache-Control": "private, no-store",
  Vary: "Cookie",
};

function loginRequired() {
  return new Response(null, {
    status: 307,
    headers: { ...privateHeaders, Location: "/vip?gioco=milanese" },
  });
}

export async function GET(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return loginRequired();

  try {
    await authenticate(token);
  } catch (error) {
    if (error instanceof GameError && error.status === 401) {
      return loginRequired();
    }
    return new Response("Accesso VIP temporaneamente non disponibile. Riprova tra poco.", {
      status: 503,
      headers: { ...privateHeaders, "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  return new Response(slotHtml, {
    headers: { ...privateHeaders, "Content-Type": "text/html; charset=utf-8" },
  });
}
