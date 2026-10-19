import { NextRequest, NextResponse } from "next/server";
import { authenticate, completeRun, consumeVoucher, createVoucher, GameError, gameState, login,
  SESSION_COOKIE, SESSION_SECONDS, startRun, validateVoucher } from "../../../lib/lalineaGameServer";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: { "Cache-Control": "no-store, private", "Vary": "Cookie" } });
}
function failure(error: unknown) {
  return error instanceof GameError ? json({ error: error.message }, error.status)
    : json({ error: "Collegamento ai buoni non disponibile. Riprova." }, 503);
}
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get(SESSION_COOKIE)?.value;
    if (!token) return json({ authenticated: false });
    try { return json(await gameState(await authenticate(token))); }
    catch (error) { if (error instanceof GameError && error.status === 401) return json({ authenticated: false }); throw error; }
  } catch (error) { return failure(error); }
}
export async function POST(request: NextRequest) {
  try {
    if (request.headers.get("origin") !== new URL(request.url).origin) throw new GameError("Richiesta non consentita.", 403);
    const text = await request.text();
    if (Buffer.byteLength(text, "utf8") > 384000) throw new GameError("Partita troppo grande.", 413);
    let body: Record<string, unknown>;
    try { body = JSON.parse(text); } catch { throw new GameError("Dati non validi."); }
    if (!body || Array.isArray(body) || typeof body !== "object") throw new GameError("Dati non validi.");
    if (body.action === "logout") {
      const response = json({ authenticated: false });
      response.cookies.set(SESSION_COOKIE, "", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/", maxAge: 0 });
      return response;
    }
    if (body.action === "login") {
      const ip = request.headers.get("x-vercel-forwarded-for") || request.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";
      const result = await login(body.telefono, body.pin, ip);
      const response = json(result.state);
      response.cookies.set(SESSION_COOKIE, result.token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/", maxAge: SESSION_SECONDS });
      return response;
    }
    const customer = await authenticate(request.cookies.get(SESSION_COOKIE)?.value);
    if (body.action === "start") return json(await startRun(customer, body.level));
    if (body.action === "complete") return json(await completeRun(customer, body.runId, body.trace));
    if (body.action === "voucher") return json(await createVoucher(customer));
    if (body.action === "validate") return json(await validateVoucher(customer, body.code, body.requestKey));
    if (body.action === "consume") return json(await consumeVoucher(customer, body));
    throw new GameError("Azione non valida.");
  } catch (error) { return failure(error); }
}
