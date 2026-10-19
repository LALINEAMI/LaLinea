import { createHash, createHmac, randomBytes, randomInt, randomUUID, timingSafeEqual } from "node:crypto";
import bcrypt from "bcryptjs";
import { ENGINE_VERSION, Game } from "./lalinea-game-core.mjs";

export const SESSION_COOKIE = "ll_game_session";
export const SESSION_SECONDS = 7 * 24 * 60 * 60;
const CODE = /^LLG-[A-F0-9]{24}$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
type Customer = { id: string | number; nome: string; telefono: string; pin_hash: string };
type Run = { id: string; customer_id: string; level: number; seed: number; engine: string; created_at: string; completed_at: string | null };
type Voucher = { code: string; amount_cents: number; used_at: string | null; cancelled_at: string | null; request_key: string | null; applied_cents: number | null };
export class GameError extends Error { constructor(message: string, public status = 400) { super(message); } }
function config() {
  const url = String(process.env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/$/, "");
  const key = String(process.env.SB_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || "");
  if (!url || !key) throw new GameError("Configurazione buoni mancante sul sito.", 503);
  return { url, key };
}
function fingerprint(hash: string) { return createHash("sha256").update(hash).digest("hex").slice(0, 32); }
function sign(value: string) { return createHmac("sha256", config().key).update("lalinea-game-session-v1:" + value).digest("base64url"); }
export function makeSession(customer: Customer, now = Date.now()) {
  const payload = Buffer.from(JSON.stringify({ id: String(customer.id), pin: fingerprint(customer.pin_hash), exp: Math.floor(now / 1000) + SESSION_SECONDS })).toString("base64url");
  return payload + "." + sign(payload);
}
export function readSession(token: string | undefined, now = Date.now()): { id: string; pin: string } | null {
  if (!token || token.length > 768) return null;
  const parts = token.split("."); if (parts.length !== 2) return null;
  const a = Buffer.from(parts[1]), b = Buffer.from(sign(parts[0]));
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const data = JSON.parse(Buffer.from(parts[0], "base64url").toString("utf8"));
    return typeof data.id === "string" && /^[A-Za-z0-9_-]{1,96}$/.test(data.id)
      && typeof data.pin === "string" && Number.isInteger(data.exp) && data.exp > now / 1000
      && data.exp <= now / 1000 + SESSION_SECONDS + 60 ? { id: data.id, pin: data.pin } : null;
  } catch { return null; }
}
const dbMessages: Record<string, string> = {
  LLG_LEVEL_LOCKED: "Completa prima il livello precedente.", LLG_RUN_NOT_FOUND: "Partita non trovata: avvia di nuovo il livello.",
  LLG_RUN_EXPIRED: "La partita è scaduta. Riprova il livello per ottenere il premio.", LLG_NO_CREDIT: "Non hai credito disponibile.",
  LLG_VOUCHER_NOT_FOUND: "Buono non valido per questo cliente.", LLG_VOUCHER_USED: "Questo buono è già stato utilizzato.",
  LLG_VOUCHER_CANCELLED: "Hai generato un nuovo buono: utilizza l’ultimo codice.", LLG_INVALID_ORDER: "Dati dell’ordine non validi.",
  LLG_CUSTOMER_NOT_FOUND: "Cliente VIP non trovato.", LLG_POINTS_INSUFFICIENT: "Punti VIP insufficienti per i premi nel carrello.",
};
export async function database<T>(endpoint: string, body?: unknown): Promise<T> {
  const { url, key } = config();
  const headers: Record<string, string> = { apikey: key, "Content-Type": "application/json" };
  if (key.startsWith("eyJ")) headers.Authorization = "Bearer " + key;
  let response: Response;
  try { response = await fetch(url + "/rest/v1/" + endpoint, { method: body === undefined ? "GET" : "POST", headers,
    body: body === undefined ? undefined : JSON.stringify(body), cache: "no-store", signal: AbortSignal.timeout(12000) }); }
  catch { throw new GameError("Collegamento ai buoni non disponibile. Riprova.", 503); }
  const result = await response.json().catch(() => null);
  if (!response.ok) {
    const code = String(result?.code || ""), message = String(result?.message || "");
    if (["PGRST202", "42P01", "42883"].includes(code)) throw new GameError("I buoni devono essere attivati nel database del sito.", 503);
    const known = Object.keys(dbMessages).find(k => message.includes(k));
    if (known) throw new GameError(dbMessages[known], 409);
    throw new GameError("Impossibile aggiornare il premio. Riprova.", 503);
  }
  return result as T;
}
export function rpc<T = Record<string, unknown>>(name: string, args: Record<string, unknown>) { return database<T>("rpc/" + name, args); }
function query(table: string, fields: string, filter: string, value: string) {
  const params = new URLSearchParams({ select: fields, [filter]: "eq." + value, limit: "1" });
  return table + "?" + params.toString();
}
async function limit(key: string, max: number, seconds: number) {
  const hash = createHmac("sha256", config().key).update("lalinea-game-limit:" + key).digest("hex");
  if (!await rpc<boolean>("llg_limit", { p_key: hash, p_max: max, p_seconds: seconds })) throw new GameError("Troppi tentativi. Attendi qualche minuto e riprova.", 429);
}
export async function login(telefono: unknown, pin: unknown, ip: string) {
  if (typeof telefono !== "string" || typeof pin !== "string" || telefono.trim().length > 32 || !/^[0-9]{4,8}$/.test(pin.trim())) throw new GameError("Inserisci telefono e PIN VIP.");
  const phone = telefono.trim(); if (!phone) throw new GameError("Inserisci telefono e PIN VIP.");
  await limit("login-ip:" + ip, 40, 600); await limit("login-phone:" + phone, 8, 600);
  const rows = await database<Customer[]>(query("vip_customers", "id,nome,telefono,pin_hash", "telefono", phone));
  const customer = rows[0];
  if (!customer || typeof customer.pin_hash !== "string" || !await bcrypt.compare(pin.trim(), customer.pin_hash)) throw new GameError("Telefono o PIN VIP errati.", 401);
  const state = await gameState(customer);
  return { customer, state, token: makeSession(customer) };
}
export async function authenticate(token: string | undefined) {
  const session = readSession(token); if (!session) throw new GameError("Accedi al gioco con telefono e PIN VIP per utilizzare i buoni.", 401);
  const rows = await database<Customer[]>(query("vip_customers", "id,nome,telefono,pin_hash", "id", session.id));
  const customer = rows[0];
  if (!customer || fingerprint(customer.pin_hash) !== session.pin) throw new GameError("Accedi di nuovo al gioco con il tuo PIN VIP.", 401);
  return customer;
}
export async function gameState(customer: Customer) {
  const state = await rpc("llg_state", { p_customer_id: String(customer.id) });
  return { ...state, authenticated: true, customer: { id: String(customer.id), name: customer.nome }, engine: ENGINE_VERSION };
}
export async function startRun(customer: Customer, level: unknown) {
  if (!Number.isInteger(level) || Number(level) < 1 || Number(level) > 50) throw new GameError("Livello non valido.");
  await limit("start:" + customer.id, 40, 300);
  return rpc("llg_start", { p_customer_id: String(customer.id), p_run_id: randomUUID(), p_level: level,
    p_seed: randomInt(1, 2147483647), p_engine: ENGINE_VERSION });
}
export function verifyReplay(run: Pick<Run, "level" | "seed" | "engine" | "created_at">, trace: unknown, now = Date.now()) {
  if (run.engine !== ENGINE_VERSION) throw new GameError("Aggiorna la pagina e ripeti il livello con la nuova versione del gioco.", 409);
  if (!Array.isArray(trace) || !trace.length || trace.length % 2 || trace.length > 50402) throw new GameError("La partita non può essere verificata. Riprova il livello.");
  const game = new Game(run.level, run.seed); game.start();
  let total = 0;
  for (let i = 0; i < trace.length; i += 2) {
    const ticks = trace[i], mask = trace[i + 1];
    if (!Number.isInteger(ticks) || ticks < 1 || !Number.isInteger(mask) || mask < 0 || mask > 7) throw new GameError("Registrazione della partita non valida.");
    total += ticks; if (total > Math.ceil(game.level.time * 120) + 1) throw new GameError("Durata della partita non valida.");
    if (game.mode !== "playing") throw new GameError("Registrazione della partita non valida.");
    const input = { left: !!(mask & 1), right: !!(mask & 2), jump: !!(mask & 4) };
    for (let tick = 0; tick < ticks; tick++) {
      if (game.mode !== "playing") throw new GameError("Registrazione della partita non valida.");
      game.step(1 / 120, input);
    }
  }
  if (game.mode !== "won" || game.coins < game.level.required || game.hearts < 1) throw new GameError("Il livello non risulta completato. Riprova.");
  const started = Date.parse(run.created_at);
  if (!Number.isFinite(started) || started > now || now - started > 20 * 60 * 1000) throw new GameError("La partita è scaduta. Riprova il livello.", 409);
  if (now - started + 250 < total / 120 * 1000) throw new GameError("La durata della partita non corrisponde. Riprova il livello.");
  return { coins: game.coins, hearts: game.hearts, ticks: total };
}
export async function completeRun(customer: Customer, runId: unknown, trace: unknown) {
  if (typeof runId !== "string" || !UUID.test(runId)) throw new GameError("Partita non valida.");
  await limit("verify:" + customer.id, 50, 300);
  const rows = await database<Run[]>(query("llg_runs", "id,customer_id,level,seed,engine,created_at,completed_at", "id", runId));
  const run = rows[0]; if (!run || run.customer_id !== String(customer.id)) throw new GameError("Partita non valida per questo cliente.", 403);
  if (run.completed_at) return { ...await gameState(customer), creditedCents: 0 };
  const proof = verifyReplay(run, trace);
  const state = await rpc("llg_complete", { p_customer_id: String(customer.id), p_run_id: run.id, p_coins: proof.coins, p_hearts: proof.hearts });
  return { ...state, authenticated: true, customer: { id: String(customer.id), name: customer.nome }, engine: ENGINE_VERSION };
}
export async function createVoucher(customer: Customer) {
  await limit("voucher:" + customer.id, 30, 300);
  await rpc("llg_voucher", { p_customer_id: String(customer.id), p_voucher_id: randomUUID(), p_code: "LLG-" + randomBytes(12).toString("hex").toUpperCase() });
  return gameState(customer);
}
export async function validateVoucher(customer: Customer, code: unknown, requestKey?: unknown) {
  if (typeof code !== "string" || !CODE.test(code)) throw new GameError("Codice buono non valido.");
  const rows = await database<(Voucher & { customer_id: string })[]>(query("llg_vouchers", "code,customer_id,amount_cents,used_at,cancelled_at,request_key,applied_cents", "code", code));
  const voucher = rows[0]; if (!voucher || voucher.customer_id !== String(customer.id)) throw new GameError("Buono non valido per questo cliente.", 403);
  if (voucher.cancelled_at) throw new GameError("Hai generato un nuovo buono: utilizza l’ultimo codice.", 409);
  if (voucher.used_at && voucher.request_key !== requestKey) throw new GameError("Questo buono è già stato utilizzato.", 409);
  return { valido: true, valore: Number(voucher.amount_cents) / 100, tipo: "fisso" };
}
// Costi dei premi nella route VIP fornita insieme a questo aggiornamento.
const POINT_COSTS: Record<string, number> = { "10001": 200, "10003": 300, "300060": 1000, "300120": 2500, "300275": 5500, "300550": 10000, "301200": 20000 };
export function calculatePoints(prizes: unknown) {
  if (prizes === undefined) return { points: 0, prizes: [] as { id: string; quantity: number }[] };
  if (!Array.isArray(prizes) || prizes.length > 30) throw new GameError("Premi VIP non validi.");
  const normalized = prizes.map(prize => {
    if (!prize || typeof prize !== "object") throw new GameError("Premio VIP non valido.");
    const id = String(prize.id), quantity = prize.quantita;
    if (!POINT_COSTS[id] || !Number.isInteger(quantity) || quantity < 1 || quantity > 10) throw new GameError("Premio o quantità non validi.");
    return { id, quantity };
  }).sort((a, b) => a.id.localeCompare(b.id));
  if (new Set(normalized.map(p => p.id)).size !== normalized.length) throw new GameError("Premi VIP duplicati.");
  return { points: normalized.reduce((sum, p) => sum + POINT_COSTS[p.id] * p.quantity, 0), prizes: normalized };
}
export async function consumeVoucher(customer: Customer, body: Record<string, unknown>) {
  const { code, requestKey, subtotalCents, deliveryCents, telefono } = body;
  if (typeof code !== "string" || !CODE.test(code) || typeof requestKey !== "string" || !UUID.test(requestKey)
    || !Number.isInteger(subtotalCents) || Number(subtotalCents) <= 0 || Number(subtotalCents) > 100000000
    || !Number.isInteger(deliveryCents) || Number(deliveryCents) < 0 || Number(deliveryCents) > 1000000
    || typeof telefono !== "string" || telefono.trim() !== customer.telefono) throw new GameError("Usa il numero VIP associato al buono e un carrello con prodotti a pagamento.");
  const { points, prizes } = calculatePoints(body.premi);
  const context = createHash("sha256").update(JSON.stringify({ code, subtotalCents, deliveryCents, telefono: customer.telefono, prizes })).digest("hex");
  const result = await rpc("llg_consume", { p_customer_id: String(customer.id), p_code: code, p_request_key: requestKey,
    p_context_hash: context, p_total_cents: subtotalCents, p_points: points, p_delivery_cents: deliveryCents });
  return { ...result, valido: true, valore: Number(result.appliedCents) / 100 };
}
