import { createHash, randomUUID } from "node:crypto";
import { existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, renameSync, unlinkSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { patchHome, patchVipLogin, patchVipLogout, shareRewardCosts } from "./supporto/patch.mjs";

const release = dirname(fileURLToPath(import.meta.url));
const baseline = JSON.parse(readFileSync(join(release, "supporto/origini-demo.json"), "utf8"));
const page = "app/page.tsx";
const redeem = "app/api/vip/redeem/route.ts";
const login = "app/api/vip/login/route.ts";
const vip = "app/vip/page.tsx";
const costs = "lib/costiPremiVip.ts";
const vipModule = "lib/laMilaneseVip.ts";
const publicDemo = "public/lalinea-slot.html";
const slotRoute = "app/lalinea-slot.html/route.ts";

const payload = [
  "app/api/la-milanese/route.ts",
  slotRoute,
  "app/lalinea-slot.html/gioco.ts",
  "lib/laMilaneseCart.ts",
  "lib/laMilaneseEngine.mjs",
  "lib/laMilaneseEngine.d.mts",
];

function same(a, b) {
  return a === null || b === null ? a === b : a.equals(b);
}
function read(root, file) {
  const location = join(root, file);
  if (!existsSync(location)) return null;
  if (!lstatSync(location).isFile()) throw new Error(`${file} non è un file normale.`);
  return readFileSync(location);
}
function required(root, file) {
  const data = read(root, file);
  if (data === null) throw new Error(`File richiesto mancante: ${file}.`);
  return data.toString("utf8");
}
function checksum(file) {
  return createHash("sha256").update(file).digest("hex");
}

export function plan(root) {
  const info = JSON.parse(required(root, "package.json"));
  if (!info.dependencies?.next || !info.scripts?.build) throw new Error("Apri la cartella lalinea-shop del sito Next.js.");
  const edits = new Map();
  function change(file, after, replaceExisting = false) {
    const before = read(root, file);
    const bytes = typeof after === "string" ? Buffer.from(after) : after;
    if (same(before, bytes)) return;
    const knownDemo = before && baseline[file] === checksum(before);
    if (before && !replaceExisting && !knownDemo) {
      throw new Error(`File già presente e diverso dalla versione prevista: ${file}.`);
    }
    edits.set(file, { before, after: bytes });
  }

  const home = required(root, page);
  const originalDemo = read(root, publicDemo);
  if (!originalDemo && !read(root, slotRoute)) throw new Error("Installazione della demo La Milanese non trovata.");
  change(page, patchHome(home), true);

  const pricePlan = shareRewardCosts(required(root, redeem));
  change(redeem, pricePlan.route, true);
  if (pricePlan.costs) change(costs, pricePlan.costs);
  else required(root, costs);

  const game = read(root, "lib/lalineaGameServer.ts")?.toString("utf8");
  if (game) {
    const contract = [
      "export async function authenticate(", "export function makeSession(",
      "export const SESSION_COOKIE", "export const SESSION_SECONDS", "export class GameError", "export function rpc",
    ];
    if (!contract.every(signature => game.includes(signature))) {
      throw new Error("La sessione in lib/lalineaGameServer.ts usa una struttura diversa.");
    }
    change(vipModule, readFileSync(join(release, "pacchetto", vipModule + ".txt")));
  } else {
    required(root, "lib/supabaseAdmin.ts");
    change(vipModule, readFileSync(join(release, "supporto/laMilaneseVip.ts.txt")));
  }

  change(login, patchVipLogin(required(root, login)), true);
  change(vip, patchVipLogout(required(root, vip)), true);

  for (const file of payload) change(file, readFileSync(join(release, "pacchetto", file + ".txt")));
  if (originalDemo) change(publicDemo, null);
  return edits;
}

function verifySyntax(root, edits) {
  const require = createRequire(join(root, "package.json"));
  let ts;
  try { ts = require("typescript"); }
  catch { throw new Error("TypeScript non disponibile. Installa prima le dipendenze di lalinea-shop."); }

  for (const [name, edit] of edits) {
    if (edit.after === null) continue;
    const source = ts.createSourceFile(name, edit.after.toString("utf8"), ts.ScriptTarget.Latest, true);
    if (source.parseDiagnostics.length) {
      const error = source.parseDiagnostics[0];
      const line = source.getLineAndCharacterOfPosition(error.start ?? 0).line + 1;
      throw new Error(`Sintassi non valida in ${name}, riga ${line}: ${ts.flattenDiagnosticMessageText(error.messageText, " ")}`);
    }
    if (name === login && source.text.includes("LALINEA_MILANESE_SESSION_V1")) {
      verifyVipGuard(ts, source);
    }
  }
}

function verifyVipGuard(ts, source) {
  const issuers = [];
  function visit(node) {
    if (ts.isVariableDeclaration(node) && node.name.getText(source) === "rispostaLaMilanese") issuers.push(node);
    ts.forEachChild(node, visit);
  }
  visit(source);
  if (issuers.length !== 1) throw new Error("Punto di emissione della sessione VIP non univoco.");
  const statement = issuers[0].parent.parent;
  const block = statement.parent;
  if (!ts.isBlock(block)) throw new Error("Emissione VIP fuori dal blocco del login.");
  const preceding = block.statements.slice(0, block.statements.indexOf(statement));
  const comparison = preceding.findIndex(node => ts.isVariableStatement(node)
    && node.declarationList.declarations.some(declaration =>
      declaration.name.getText(source) === "pinCorretto"
      && /await bcrypt\.compare\(\s*pinInserito,\s*cliente\.pin_hash\s*\)/.test(declaration.initializer?.getText(source) || "")));
  const guard = preceding.findIndex(node => ts.isIfStatement(node)
    && node.expression.getText(source) === "!pinCorretto"
    && ts.isBlock(node.thenStatement)
    && node.thenStatement.statements.some(child => ts.isReturnStatement(child) && /status:\s*401/.test(child.getText(source))));
  if (comparison < 0 || guard <= comparison) throw new Error("Verifica PIN precedente all'emissione non riconosciuta.");
}

function replaceFile(root, file, contents) {
  const location = join(root, file);
  if (contents === null) {
    if (existsSync(location)) unlinkSync(location);
    return;
  }
  mkdirSync(dirname(location), { recursive: true });
  const temporary = join(dirname(location), ".milanese-" + randomUUID() + ".tmp");
  try {
    writeFileSync(temporary, contents, { flag: "wx" });
    renameSync(temporary, location);
  } finally {
    if (existsSync(temporary)) unlinkSync(temporary);
  }
}

export function install(root, edits) {
  for (const [name, edit] of edits) {
    if (!same(read(root, name), edit.before)) throw new Error(`File cambiato durante il controllo: ${name}.`);
  }

  const backup = mkdtempSync(join(tmpdir(), "lalinea-milanese-backup-"));
  for (const [name, edit] of edits) {
    if (edit.before !== null) replaceFile(backup, name, edit.before);
  }

  const changed = [];
  try {
    for (const [name, edit] of edits) {
      replaceFile(root, name, edit.after);
      changed.push(name);
    }
  } catch (error) {
    for (const name of changed.reverse()) replaceFile(root, name, edits.get(name).before);
    throw error;
  }
  return backup;
}

function main() {
  const args = process.argv.slice(2);
  if (args.length > 1 || (args.length === 1 && args[0] !== "--check")) {
    throw new Error("Usa installa.mjs oppure installa.mjs --check.");
  }
  const root = resolve(process.cwd());
  const edits = plan(root);
  verifySyntax(root, edits);
  if (args[0] === "--check") {
    console.log("Controllo OK. Nessun file è stato modificato.");
    for (const name of edits.keys()) console.log("  " + name);
    return;
  }
  if (!edits.size) {
    console.log("La Milanese con punti e buoni risulta già installata.");
    return;
  }
  const backup = install(root, edits);
  console.log("La Milanese installata nel Codespace. Anteprima e Git restano separati.");
  console.log("Copia dei file originali: " + backup);
  console.log("Dopo il collaudo, dal terminale di lalinea-shop:");
  console.log("git add " + [...edits.keys()].join(" "));
  console.log('git commit -m "Collega punti e buoni di La Milanese"');
  console.log("git push origin main");
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try { main(); }
  catch (error) {
    console.error("Installazione interrotta: " + (error instanceof Error ? error.message : error));
    process.exitCode = 1;
  }
}
