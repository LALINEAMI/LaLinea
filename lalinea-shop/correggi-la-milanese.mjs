import { randomUUID } from "node:crypto";
import { existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, renameSync, unlinkSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const api = "app/api/la-milanese/route.ts";
const game = "app/lalinea-slot.html/gioco.ts";
const cart = "lib/laMilaneseCart.ts";
const vip = "app/vip/page.tsx";
const marker = "LALINEA_MILANESE_SESSION_PROOF_V2";

function replaceOne(source, old, replacement, label) {
  const start = source.indexOf(old);
  if (start < 0 || source.indexOf(old, start + old.length) >= 0) {
    throw new Error(`Blocco ${label} non riconosciuto.`);
  }
  return source.slice(0, start) + replacement + source.slice(start + old.length);
}

const originalGuard = `  if (request.headers.get("origin") !== new URL(request.url).origin) {
    return reply({ error: "Richiesta non consentita." }, 403);
  }
`;
const proxyGuard = `  const origin = request.headers.get("origin");
  const fetchSite = request.headers.get("sec-fetch-site");
  const target = new URL(request.url);
  const codespace = process.env.CODESPACE_NAME;
  const domain = process.env.GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN || "app.github.dev";
  const previewOrigin = process.env.CODESPACES === "true" && codespace
    ? \`https://\${codespace}-\${target.port || "3000"}.\${domain}\`
    : null;
  const sameOrigin = fetchSite === "same-origin"
    || (fetchSite === null && (origin === target.origin || origin === previewOrigin));
  if (!origin || origin === "null" || !sameOrigin) {
    return reply({ error: "Richiesta non consentita." }, 403);
  }
`;

function fixApi(source) {
  const postLine = "export async function POST(request: NextRequest) {\n";
  const bodyLine = "  let body: Data;";
  const start = source.indexOf(postLine);
  const end = source.indexOf(bodyLine, start + postLine.length);
  const compact = value => value.replace(/\s+/g, "");
  if (start < 0 || end < 0
    || ![originalGuard, proxyGuard].map(compact).includes(compact(source.slice(start + postLine.length, end)))) {
    throw new Error("Controllo iniziale di app/api/la-milanese/route.ts non riconosciuto.");
  }
  let next = source.slice(0, start + postLine.length) + `  const session = request.cookies.get(SESSION_COOKIE)?.value;
  if (!session) return result({ error: "VIP_REQUIRED" });
  if (request.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !== "application/json") {
    return result({ error: "BAD_REQUEST" });
  }
` + source.slice(end);

  next = replaceOne(next, 'import { createHash, randomBytes, randomInt } from "node:crypto";',
    'import { createHash, createHmac, randomBytes, randomInt, timingSafeEqual } from "node:crypto";', "import crittografia");
  next = replaceOne(next, 'const headers = { "Cache-Control": "private, no-store", Vary: "Cookie" };',
    `const headers = {
  "Cache-Control": "private, no-store",
  Vary: "Cookie",
  "X-Content-Type-Options": "nosniff",
  "Cross-Origin-Resource-Policy": "same-origin",
};`, "intestazioni API privata");
  next = replaceOne(next, `export async function GET(request: NextRequest) {
  try {
    const customer = await authenticate(request.cookies.get(SESSION_COOKIE)?.value);
`, `// ${marker}
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
`, "lettura della sessione VIP");
  next = replaceOne(next, "reply({ state, account: accountKey(id) });",
    "reply({ state, account: accountKey(id), csrf });", "risposta del saldo");

  const originalLogout = `  if (body.action === "logout") {
    const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
    return Response.json({ success: true }, {
      headers: { ...headers, "Set-Cookie": \`\${SESSION_COOKIE}=; Path=/; Max-Age=0; HttpOnly; SameSite=Strict\${secure}\` },
    });
  }
`;
  const beforeAuth = `${originalLogout}
  try {
    const customer = await authenticate(request.cookies.get(SESSION_COOKIE)?.value);
`;
  return replaceOne(next, beforeAuth, `  const proof = body.csrf;
  if (session.length > 768 || typeof proof !== "string" || !digest.test(proof)
    || !timingSafeEqual(Buffer.from(proof, "hex"), Buffer.from(sessionProof(session), "hex"))) {
    return reply({
      error: "Sessione di gioco da aggiornare. Ricarica il saldo VIP.",
      code: "SESSION_PROOF_REQUIRED",
    }, 403);
  }

  try {
    const customer = await authenticate(session);
${originalLogout.trimEnd().split("\n").map(line => "  " + line).join("\n")}
`, "autorizzazione di gioco, buoni e uscita");
}

function fixGame(source) {
  const declaration = "export const slotHtml = ";
  const start = source.indexOf(declaration);
  const encoded = source.slice(start + declaration.length).trimEnd();
  if (start < 0 || !encoded.endsWith(";")) throw new Error("Pagina incorporata della slot non riconosciuta.");
  const html = JSON.parse(encoded.slice(0, -1));
  if (typeof html !== "string") throw new Error("Pagina incorporata non valida.");
  const scripts = [...html.matchAll(/<script type="module">([\s\S]*?)<\/script>/g)];
  if (scripts.length !== 1) throw new Error("Script dei rulli non univoco.");
  const old = scripts[0][1];
  let script = replaceOne(old, "let account = '';", "let account = '';\nlet csrf = '';", "sessione della slot");
  script = replaceOne(script, "!response.ok || !data || !accountPattern.test(data.account)",
    "!response.ok || !data || !accountPattern.test(data.account) || !/^[a-f0-9]{64}$/.test(data.csrf)", "lettura saldo VIP");
  script = replaceOne(script, "    loaded = true;\n    paintBoard", "    csrf = data.csrf;\n    loaded = true;\n    paintBoard", "memoria sessione della pagina");
  script = replaceOne(script, "body: JSON.stringify({ ...action, account }),",
    "body: JSON.stringify({ ...action, account, csrf }),", "richiesta del giro");
  script = replaceOne(script, `  if (!response.ok) {
    if (data?.state) adoptState(data.state);`, `  if (!response.ok) {
    if (response.status === 403 && data?.code === 'SESSION_PROOF_REQUIRED') {
      loaded = false;
      csrf = '';
      throw new Error(data.error);
    }
    if (data?.state) adoptState(data.state);`, "recupero di una sessione cambiata");

  // Controllo sintattico, senza eseguire il JavaScript della pagina.
  new Function(script);
  const corrected = replaceOne(html, old, script, "script dei rulli");
  return source.slice(0, start + declaration.length) + JSON.stringify(corrected) + ";\n";
}

function fixCart(source) {
  const request = 'async function request(action: string, payload: { code: string } | CheckoutPayload): Promise<VoucherReply> {';
  let next = replaceOne(source, request, `async function readCsrf() {
  const response = await fetch("/api/la-milanese?csrf=1", {
    cache: "no-store", credentials: "same-origin",
  });
  const data = await response.json().catch(() => null);
  if (!response.ok || typeof data?.csrf !== "string" || !/^[a-f0-9]{64}$/.test(data.csrf)) {
    throw new CheckoutError(data?.error || "Sessione VIP non disponibile. Ricarica la pagina.", false);
  }
  return data.csrf as string;
}

async function request(action: string, payload: { code: string } | CheckoutPayload, csrf: string): Promise<VoucherReply> {`, "richieste del carrello");
  next = replaceOne(next, "body: JSON.stringify({ action, ...payload }),",
    "body: JSON.stringify({ action, ...payload, csrf }),", "autorizzazione buono");
  next = replaceOne(next, 'const definitive = response.status >= 400 && response.status < 500 && typeof data?.error === "string";',
    `const definitive = response.status >= 400 && response.status < 500
      && response.status !== 401 && data?.code !== "SESSION_PROOF_REQUIRED" && typeof data?.error === "string";`, "recupero conferma ordine");
  next = replaceOne(next, 'return (await request("validate-voucher", { code })).valore;',
    'const csrf = await readCsrf();\n  return (await request("validate-voucher", { code }, csrf)).valore;', "validazione buono");
  next = replaceOne(next, '  const key = "lalinea-milanese-delivery:" + cartFingerprint;',
    '  const csrf = await readCsrf();\n  const key = "lalinea-milanese-delivery:" + cartFingerprint;', "sessione prima di prenotare");
  next = replaceOne(next, 'request("checkout-status", payload)', 'request("checkout-status", payload, csrf)', "lettura ricevuta");
  return replaceOne(next, 'request("checkout-consume", payload)', 'request("checkout-consume", payload, csrf)', "conferma buono");
}

function fixVip(source) {
  if (!source.includes("LALINEA_MILANESE_LOGOUT_V1")) return source;
  return replaceOne(source, `                const risposta = await fetch("/api/la-milanese", {
                  method: "POST", headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ action: "logout" }),
                });
                if (!risposta.ok) throw new Error("Uscita VIP non disponibile.");`, `                const verifica = await fetch("/api/la-milanese?csrf=1", { cache: "no-store" });
                if (verifica.status !== 401) {
                  const sessione = await verifica.json();
                  if (!verifica.ok || typeof sessione?.csrf !== "string") throw new Error("Uscita VIP non disponibile.");
                  const risposta = await fetch("/api/la-milanese", {
                    method: "POST", headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ action: "logout", csrf: sessione.csrf }),
                  });
                  if (!risposta.ok && risposta.status !== 401) throw new Error("Uscita VIP non disponibile.");
                }`, "uscita VIP collegata a La Milanese");
}

function fileText(root, name) {
  const path = join(root, name);
  if (!existsSync(path) || !lstatSync(path).isFile()) throw new Error(`File non trovato: ${name}.`);
  return readFileSync(path, "utf8");
}

export function plan(root) {
  const info = JSON.parse(fileText(root, "package.json"));
  if (!info.dependencies?.next) throw new Error("Apri il terminale nella cartella lalinea-shop.");
  const originals = [api, game, cart, vip].map(name => [name, fileText(root, name)]);
  if (originals[0][1].includes(marker)) {
    if (!originals[1][1].includes("...action, account, csrf") || !originals[2][1].includes("async function readCsrf()")) {
      throw new Error("Correzione precedente incompleta.");
    }
    return new Map();
  }
  const transformations = [fixApi, fixGame, fixCart, fixVip];
  const edits = new Map();
  originals.forEach(([name, before], index) => {
    const after = transformations[index](before.replace(/\r\n/g, "\n"));
    if (after !== before.replace(/\r\n/g, "\n")) edits.set(name, { before, after });
  });
  return edits;
}

function verifySyntax(root, edits) {
  const require = createRequire(join(root, "package.json"));
  const ts = require("typescript");
  for (const [name, edit] of edits) {
    const parsed = ts.createSourceFile(name, edit.after, ts.ScriptTarget.Latest, true);
    if (parsed.parseDiagnostics.length) {
      const detail = ts.flattenDiagnosticMessageText(parsed.parseDiagnostics[0].messageText, " ");
      throw new Error(`Sintassi non valida in ${name}: ${detail}`);
    }
  }
}

function writeAtomic(path, contents) {
  const tmp = join(dirname(path), ".milanese-session-" + randomUUID() + ".tmp");
  try {
    writeFileSync(tmp, contents, { flag: "wx" });
    renameSync(tmp, path);
  } finally {
    if (existsSync(tmp)) unlinkSync(tmp);
  }
}

export function apply(root, edits) {
  for (const [name, edit] of edits) {
    if (fileText(root, name) !== edit.before) throw new Error(`File cambiato durante il controllo: ${name}.`);
  }
  const backup = mkdtempSync(join(tmpdir(), "milanese-session-backup-"));
  for (const [name, edit] of edits) {
    const saved = join(backup, name);
    mkdirSync(dirname(saved), { recursive: true });
    writeFileSync(saved, edit.before);
  }
  const changed = [];
  try {
    for (const [name, edit] of edits) {
      writeAtomic(join(root, name), edit.after);
      changed.push(name);
    }
  } catch (error) {
    for (const name of changed.reverse()) writeAtomic(join(root, name), edits.get(name).before);
    throw error;
  }
  return backup;
}

function main() {
  const root = resolve(process.cwd());
  const edits = plan(root);
  if (!edits.size) {
    console.log("La correzione di La Milanese è già presente.");
    return;
  }
  verifySyntax(root, edits);
  const backup = apply(root, edits);
  console.log("Correzione La Milanese applicata nel Codespace.");
  console.log("File aggiornati:");
  for (const name of edits.keys()) console.log("  " + name);
  console.log("Copia degli originali: " + backup);
  console.log("Ricarica l'anteprima della porta 3000.");
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try { main(); }
  catch (error) {
    console.error("Correzione interrotta: " + (error instanceof Error ? error.message : error));
    process.exitCode = 1;
  }
}
