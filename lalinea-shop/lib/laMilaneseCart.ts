type Reward = { id: string; quantita: number };
type BookingId = string | number;
type Order = {
  code: string;
  telefono: string;
  subtotalCents: number;
  deliveryCents: number;
  premi: Reward[];
  messaggio: string;
  modalita: string;
  date: string;
  time: string;
};

type Receipt = { orderId: string; appliedCents: number; pointsDebited: number };
type VoucherReply = { valido: true; valore: number; used: boolean } & Partial<Receipt>;
type CheckoutPayload = {
  code: string; telefono: string; subtotalCents: number; deliveryCents: number;
  cartFingerprint: string; premi: Reward[];
};

class CheckoutError extends Error {
  constructor(message: string, readonly definitive: boolean) { super(message); }
}

const bookings = new Map<string, BookingId>();

export function isBuonoMilanese(code: string) {
  return /^LLM-[A-F0-9]{24}$/.test(code);
}

async function readCsrf() {
  const response = await fetch("/api/la-milanese?csrf=1", {
    cache: "no-store", credentials: "same-origin",
  });
  const data = await response.json().catch(() => null);
  if (!response.ok || typeof data?.csrf !== "string" || !/^[a-f0-9]{64}$/.test(data.csrf)) {
    throw new CheckoutError(data?.error || "Sessione VIP non disponibile. Ricarica la pagina.", false);
  }
  return data.csrf as string;
}

async function request(action: string, payload: { code: string } | CheckoutPayload, csrf: string): Promise<VoucherReply> {
  let response: Response;
  try {
    response = await fetch("/api/la-milanese", {
      method: "POST", credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, ...payload, csrf }),
    });
  } catch {
    throw new CheckoutError("Connessione interrotta. Riprova la conferma dello stesso ordine.", false);
  }
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const definitive = response.status >= 400 && response.status < 500
      && response.status !== 401 && data?.code !== "SESSION_PROOF_REQUIRED" && typeof data?.error === "string";
    throw new CheckoutError(
      data?.error || "Esito da verificare. Riprova la conferma dello stesso ordine.",
      definitive,
    );
  }
  if (data?.valido !== true || (data.valore !== 50 && data.valore !== 100) || typeof data.used !== "boolean") {
    throw new CheckoutError("Risposta incompleta. Riprova la conferma dello stesso ordine.", false);
  }
  return data as VoucherReply;
}

export async function validaBuonoMilanese(code: string) {
  const csrf = await readCsrf();
  return (await request("validate-voucher", { code }, csrf)).valore;
}

function readBooking(key: string) {
  if (bookings.has(key)) return bookings.get(key);
  try {
    const id: unknown = JSON.parse(sessionStorage.getItem(key) || "null");
    if (typeof id === "string" || typeof id === "number") return id;
  } catch { /* la scheda può impedire l'uso di sessionStorage */ }
}

function saveBooking(key: string, id?: BookingId) {
  if (id === undefined) bookings.delete(key);
  else bookings.set(key, id);
  try {
    if (id === undefined) sessionStorage.removeItem(key);
    else sessionStorage.setItem(key, JSON.stringify(id));
  } catch { /* l'identificativo resta disponibile in questa pagina */ }
}

async function reserveDelivery(date: string, time: string) {
  const response = await fetch("/api/delivery-slots", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ date, time }),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok || (typeof data?.id !== "string" && typeof data?.id !== "number")) {
    throw new CheckoutError(data?.error || "Impossibile prenotare l'orario di consegna.", true);
  }
  return data.id as BookingId;
}

async function releaseDelivery(id: BookingId) {
  await fetch("/api/delivery-slots", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id }),
  }).catch(() => {});
}

function readReceipt(result: VoucherReply): Receipt {
  const { orderId, appliedCents, pointsDebited } = result;
  if (!result.used || typeof orderId !== "string"
    || typeof appliedCents !== "number" || !Number.isInteger(appliedCents) || appliedCents <= 0
    || typeof pointsDebited !== "number" || !Number.isInteger(pointsDebited) || pointsDebited < 0) {
    throw new CheckoutError("Ricevuta incompleta. Riprova la conferma dello stesso ordine.", false);
  }
  return { orderId, appliedCents, pointsDebited };
}

export async function usaBuonoMilanese(order: Order) {
  if (order.modalita === "delivery" && (!order.date || !order.time)) {
    throw new CheckoutError("Seleziona data e orario di consegna.", true);
  }
  const bytes = new TextEncoder().encode(JSON.stringify([
    order.code, order.messaggio, order.modalita, order.date, order.time, order.premi,
  ]));
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  const cartFingerprint = Array.from(new Uint8Array(hash), byte => byte.toString(16).padStart(2, "0")).join("");
  const payload = {
    code: order.code, telefono: order.telefono, subtotalCents: order.subtotalCents,
    deliveryCents: order.deliveryCents, premi: order.premi, cartFingerprint,
  };
  const csrf = await readCsrf();
  const key = "lalinea-milanese-delivery:" + cartFingerprint;
  let booked = readBooking(key);

  try {
    // Recupera una conferma già completata prima di prenotare un altro orario.
    const status = await request("checkout-status", payload, csrf);
    if (status.used) {
      const receipt = readReceipt(status);
      saveBooking(key);
      return receipt;
    }
    if (order.modalita === "delivery" && booked === undefined) {
      booked = await reserveDelivery(order.date, order.time);
      saveBooking(key, booked);
    }
    const receipt = readReceipt(await request("checkout-consume", payload, csrf));
    saveBooking(key);
    return receipt;
  } catch (error) {
    if (booked !== undefined && error instanceof CheckoutError && error.definitive) {
      await releaseDelivery(booked);
      saveBooking(key);
    }
    throw error;
  }
}
