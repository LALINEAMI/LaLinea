import { randomInt } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { authenticate, GameError, rpc, SESSION_COOKIE } from "../../../../lib/lalineaGameServer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function reply(data: unknown, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: { "Cache-Control": "private, no-store", Vary: "Cookie" },
  });
}

async function calendar(request: NextRequest, day: string | null) {
  try {
    const customer = await authenticate(request.cookies.get(SESSION_COOKIE)?.value);
    return reply(await rpc("ll_avv26_calendario", {
      p_cliente: String(customer.id),
      p_giorno: day,
      p_biglietto: day ? randomInt(10000) : null,
      p_base: day ? randomInt(10000) : null,
    }));
  } catch (error) {
    return error instanceof GameError && error.status === 401
      ? reply({ error: "Accedi di nuovo all’area VIP per aprire il calendario." }, 401)
      : reply({ error: "Calendario temporaneamente indisponibile. Riprova tra poco." }, 503);
  }
}

export async function GET(request: NextRequest) {
  return calendar(request, null);
}

export async function POST(request: NextRequest) {
  if (request.headers.get("origin") !== request.nextUrl.origin) {
    return reply({ error: "Richiesta non consentita." }, 403);
  }
  const body = await request.json().catch(() => null);
  if (typeof body?.day !== "string" || !/^2026-12-(0[1-9]|1[0-9]|2[0-5])$/.test(body.day)) {
    return reply({ error: "Seleziona la casella del giorno." }, 400);
  }
  return calendar(request, body.day);
}
