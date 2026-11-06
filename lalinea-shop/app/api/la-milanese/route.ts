import { createHash, createHmac, randomBytes, randomInt, timingSafeEqual } from "node:crypto";
import type { NextRequest } from "next/server";
import { BETS, drawSpin } from "../../../lib/laMilaneseEngine.mjs";
import { costiPremi } from "../../../lib/costiPremiVip";
import { authenticate, GameError, rpc, SESSION_COOKIE } from "../../../lib/laMilaneseVip";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Data = Record<string, unknown>;

const headers = {
  "Cache-Control": "private, no-store",
  Vary: "Cookie",
  "X-Content-Type-Options": "nosniff",
  "Cross-Origin-Resource-Policy": "same-origin",
};
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const voucher = /^LLM-[A-F0-9]{24}$/;
const digest = /^[a-f0-9]{64}$/;

const messages: Record<string, [number, string]> = {
  BAD_REQUEST: [400, "Richiesta non valida."],
  BAD_ORDER: [400, "Controlla telefono VIP e totale dei prodotti."],
  VIP_REQUIRED: [401, "Accedi con il tuo profilo VIP."],
  SESSION_CHANGED: [409, "Il profilo VIP è cambiato. Ricarica il saldo."],
  LOW_POINTS_ORDER: [409, "Punti VIP insufficienti per i premi nel carrello."],
  BAD_REWARDS: [400, "Premi VIP o quantità non validi."],
  REQUEST_CONFLICT: [409, "La richiesta appartiene a un'altra operazione."],
  TOO_FAST: [429, "Attendi un secondo prima del prossimo giro."],
  LOW_POINTS: [409, "Punti VIP insufficienti per questa puntata."],
  BONUS_LOCKED: [409, "Il bonus richiede 30 minuti di gioco ed è disponibile una volta al giorno."],
  REDEEM_LOCKED: [409, "Buono ancora bloccato. Controlla i due progressi in Premi e Bonus."],
  VOUCHER_NOT_FOUND: [404, "Buono non valido per questo profilo VIP."],
  VOUCHER_USED: [409, "Questo buono è già stato usato."],
  VOUCHER_EXPIRED: [409, "Questo buono è scaduto."],
};

function reply(data: unknown, status = 200) {
  return Response.json(data, { status, headers });
}

function result(data: Data, extra: Data = {}) {
  if (typeof data.error === "string" && Object.hasOwn(messages, data.error)) {
    const [status, error] = messages[data.error];
    return reply({ ...extra, error, state: data.state }, status);
  }
  if (data.error !== undefined) return reply({ error: "La Milanese è temporaneamente non disponibile." }, 503);
  return reply({ ...data, ...extra });
}

function failure(error: unknown) {
  return error instanceof GameError && error.status === 401
    ? reply({ error: "Accedi con il tuo profilo VIP." }, 401)
    : reply({ error: "La Milanese è temporaneamente non disponibile. Riprova tra poco." }, 503);
}

function accountKey(id: string) {
  return createHash("sha256").update("la-milanese-account:" + id).digest("hex").slice(0, 24);
}

function euroCents(value: unknown, min: number, max: number): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= min && value <= max;
}

function orderRewards(value: unknown) {
  if (!Array.isArray(value) || value.length > 30) return null;
  const ids = new Set<string>();
  const rewards: { id: string; quantita: number }[] = [];
  let points = 0;
  for (const item of value) {
    if (!item || typeof item !== "object" || Array.isArray(item)) return null;
    const { id: itemId, quantita } = item;
    if (typeof itemId !== "string" || !/^\d{1,12}$/.test(itemId)
      || !Object.hasOwn(costiPremi, itemId) || !euroCents(quantita, 1, 10) || ids.has(itemId)) return null;
    const unit = costiPremi[itemId];
    if (!euroCents(unit, 1, 1000000)) return null;
    ids.add(itemId);
    points += unit * quantita;
    rewards.push({ id: itemId, quantita });
  }
  if (points > 1000000) return null;
  return { points, rewards: rewards.sort((a, b) => a.id.localeCompare(b.id)) };
}

async function checkout(body: Data, id: string, phone: string) {
  const { action, code, telefono, subtotalCents, deliveryCents, cartFingerprint } = body;
  if (typeof code !== "string" || !voucher.test(code)) return result({ error: "VOUCHER_NOT_FOUND" });

  if (action === "validate-voucher") {
    return result(await rpc<Data>("llm_checkout", {
      p_customer_id: id, p_code: code, p_mode: "validate", p_hash: null,
      p_subtotal_cents: null, p_delivery_cents: null, p_points: null,
    }));
  }
  if (typeof telefono !== "string" || telefono.trim() !== phone
    || !euroCents(subtotalCents, 1, 100000000) || !euroCents(deliveryCents, 0, 1000000)
    || typeof cartFingerprint !== "string" || !digest.test(cartFingerprint)) {
    return result({ error: "BAD_ORDER" });
  }
  const rewards = orderRewards(body.premi);
  if (!rewards) return result({ error: "BAD_REWARDS" });
  const hash = createHash("sha256")
    .update(JSON.stringify([code, id, subtotalCents, deliveryCents, cartFingerprint, rewards.rewards]))
    .digest("hex");
  return result(await rpc<Data>("llm_checkout", {
    p_customer_id: id, p_code: code,
    p_mode: action === "checkout-status" ? "status" : "consume", p_hash: hash,
    p_subtotal_cents: subtotalCents, p_delivery_cents: deliveryCents, p_points: rewards.points,
  }));
}

// LALINEA_MILANESE_SESSION_PROOF_V2
function sessionProof(session: string) {
  // Prova distinta dal cookie, valida soltanto con quella sessione.
  return createHmac("sha256", session).update("lalinea:milanese:csrf:v2").digest("hex");
}

export async function GET(request: NextRequest) {
  const session = request.cookies.get(SESSION_COOKIE)?.value;
  if (!session) return result({ error: "VIP_REQUIRED" });

  try {
    const customer = await authenticate(session);
    const csrf = sessionProof(session);
    if (new URL(request.url).searchParams.get("csrf") === "1") return reply({ csrf });
    const id = String(customer.id);
    const state = await rpc<Data>("llm_state", { p_customer_id: id });
    return typeof state.error === "string"
      ? result(state)
      : reply({ state, account: accountKey(id), csrf });
  } catch (error) {
    return failure(error);
  }
}

export async function POST(request: NextRequest) {
  const session = request.cookies.get(SESSION_COOKIE)?.value;
  if (!session) return result({ error: "VIP_REQUIRED" });
  if (request.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !== "application/json") {
    return result({ error: "BAD_REQUEST" });
  }
  let body: Data;
  try {
    if (Number(request.headers.get("content-length")) > 4096) return result({ error: "BAD_REQUEST" });
    const text = await request.text();
    if (Buffer.byteLength(text, "utf8") > 4096) return result({ error: "BAD_REQUEST" });
    const parsed: unknown = JSON.parse(text);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return result({ error: "BAD_REQUEST" });
    body = parsed as Data;
  } catch {
    return result({ error: "BAD_REQUEST" });
  }

  const proof = body.csrf;
  if (session.length > 768 || typeof proof !== "string" || !digest.test(proof)
    || !timingSafeEqual(Buffer.from(proof, "hex"), Buffer.from(sessionProof(session), "hex"))) {
    return reply({
      error: "Sessione di gioco da aggiornare. Ricarica il saldo VIP.",
      code: "SESSION_PROOF_REQUIRED",
    }, 403);
  }

  try {
    const customer = await authenticate(session);
    if (body.action === "logout") {
      const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
      return Response.json({ success: true }, {
        headers: { ...headers, "Set-Cookie": `${SESSION_COOKIE}=; Path=/; Max-Age=0; HttpOnly; SameSite=Strict${secure}` },
      });
    }
    const id = String(customer.id);
    const { action, requestId, bet, key } = body;
    if (action === "validate-voucher" || action === "checkout-status" || action === "checkout-consume") {
      return await checkout(body, id, customer.telefono);
    }
    if ((action !== "spin" && action !== "bonus" && action !== "redeem")
      || typeof requestId !== "string" || !uuid.test(requestId)) {
      return result({ error: "BAD_REQUEST" });
    }

    const account = accountKey(id);
    if (body.account !== account) return result({ error: "SESSION_CHANGED" }, { account });

    let choice: number | null = null;
    if (action === "spin") {
      if (typeof bet !== "number" || !BETS.includes(bet)) return result({ error: "BAD_REQUEST" });
      choice = bet;
    } else if (action === "bonus") {
      if (!euroCents(key, 0, 2)) return result({ error: "BAD_REQUEST" });
      choice = key;
    }
    const spin = action === "spin" ? drawSpin() : null;
    const data = await rpc<Data>("llm_play", {
      p_customer_id: id, p_request_id: requestId, p_action: action, p_choice: choice,
      p_board: spin?.board ?? null, p_base_ll: spin?.baseLl ?? null,
      p_bonus_roll: action === "bonus" ? randomInt(100) : null,
      p_code: action === "spin" ? null : "LLM-" + randomBytes(12).toString("hex").toUpperCase(),
    });
    return result(data, { account });
  } catch (error) {
    return failure(error);
  }
}
