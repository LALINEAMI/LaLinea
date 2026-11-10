import { randomUUID } from "node:crypto";
import { lstatSync, mkdirSync, mkdtempSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

const gamePath = "app/lalinea-slot.html/gioco.ts";
const apiPath = "app/api/la-milanese/route.ts";
const marker = "// LALINEA_MILANESE_REWARD_RULES_V1";
const oldError = 'REDEEM_LOCKED: [409, "Servono 1.000 LL e 200 punti già spesi e non conteggiati in altri riscatti."]';
const newError = 'REDEEM_LOCKED: [409, "Buono ancora bloccato. Controlla i due progressi in Premi e Bonus."]';

function replaceOne(source, before, after, label) {
  const start = source.indexOf(before);
  if (start < 0 || source.indexOf(before, start + before.length) >= 0) {
    throw new Error("Versione non riconosciuta per " + label + ".");
  }
  return source.slice(0, start) + after + source.slice(start + before.length);
}

function patchGame(source) {
  const declaration = "export const slotHtml = ";
  const start = source.indexOf(declaration);
  const literal = start >= 0 ? source.slice(start + declaration.length).trimEnd() : "";
  if (!literal.endsWith(";")) throw new Error("Formato della pagina La Milanese non riconosciuto.");
  const html = JSON.parse(literal.slice(0, -1));
  const scripts = [...html.matchAll(/<script type="module">([\s\S]*?)<\/script>/g)];
  if (scripts.length !== 1 || !scripts[0][1].includes("...action, account, csrf")) {
    throw new Error("Serve la versione funzionante di La Milanese con accesso VIP.");
  }
  const oldScript = scripts[0][1];
  if (oldScript.includes(marker)) return source;

  const htmlEdits = [
    ['<span class="balance-foot">1.000 LL = buono da 100 €</span>', '<span class="balance-foot">Verso il buono da 100 €</span>'],
    ['1.000 LL <b>→</b> BUONO 100 €', 'BUONO DA 100 €'],
    ['id="exchange-ll">0 / 1.000 LL', 'id="exchange-ll">—'],
    ['id="exchange-points">0 / 200 PT', 'id="exchange-points">—'],
    ['Punti spesi per questo riscatto', 'Punti puntati per il prossimo buono'],
    [
      '<p class="card-note">Servono entrambe le soglie. I giri gratis non contano nei 200 punti.</p>',
      '<p class="card-note" id="exchange-note">Caricamento delle soglie del buono…</p>',
    ],
    [
      'Il riscatto da 100 € richiede 1.000 LL e una quota di 200 punti spesi. Le puntate vengono scalate dal saldo VIP.',
      'Il buono da 100 € si sblocca quando raggiungi entrambe le soglie qui sopra.',
    ],
    [
      'Ogni 1.000 LL puoi richiedere un buono sconto da 100 €, purché tu abbia speso almeno altri 200 punti rispetto al precedente riscatto. Al riscatto vengono consumati 1.000 LL e la quota di 200 punti. Il saldo LL rimasto viene conservato.',
      'Per il buono da 100 € servono <span data-exchange-ll>—</span> LL e <span data-exchange-points>—</span> punti VIP già puntati e disponibili per il riscatto. Al riscatto si usano i LL e la quota di punti richiesta. Gli eventuali LL e punti puntati in più contano per il prossimo buono.',
    ],
    [
      'non aumentano la quota di 200 punti spesi',
      'non fanno salire la quota di punti puntati',
    ],
    ['I 200 punti non garantiscono 1.000 LL. ', ''],
    [
      '<h3>05 / I buoni della demo</h3><p>I codici iniziano con DEMO, sono personali nella simulazione, monouso e riportano una scadenza di 30 giorni. Non funzionano nel carrello reale. Spesa minima e cumulabilità dovranno essere definite prima dell’attivazione reale.</p>',
      '<h3>05 / I buoni La Milanese</h3><p>I codici iniziano con LLM. Ogni buono è legato al profilo VIP, si usa una volta e scade dopo 30 giorni. Nel carrello il buono riduce il totale dei prodotti fino al suo valore.</p>',
    ],
  ];
  let updated = html;
  for (const [before, after] of htmlEdits) {
    updated = replaceOne(updated, before, after, "testo dei premi");
  }

  const oldMeanNote = oldScript.split("\n").find(line => line.startsWith("$('mean-note').textContent = "));
  if (!oldMeanNote) throw new Error("Nota sulle probabilità non trovata.");
  const scriptEdits = [
    ["const EXCHANGE_LL = 1000;\nconst EXCHANGE_POINTS = 200;", marker],
    [
      "function availableSpend(state) { return Math.max(0, state.spent - state.redemptions * EXCHANGE_POINTS); }\n"
        + "function canRedeem(state) { return state.ll >= EXCHANGE_LL && availableSpend(state) >= EXCHANGE_POINTS; }",
      `function canRedeem(state) {
  const rules = state.redemption;
  return Boolean(rules && state.ll >= rules.ll && rules.available >= rules.points);
}`,
    ],
    ["let state = { points: 0,", "let state = { redemption: null, points: 0,"],
    [
      "  state = { ...next, coupons: next.coupons.filter(c => codePattern.test(c.code)",
      `  const redemption = next.redemption ?? null;
  if (redemption !== null && (
    ![redemption.ll, redemption.points].every(value => Number.isSafeInteger(value) && value > 0)
    || !Number.isSafeInteger(redemption.available) || redemption.available < 0
    || redemption.available > next.spent
  )) {
    throw new Error('Impossibile leggere le soglie del buono. Riprova.');
  }
  state = { ...next, redemption, coupons: next.coupons.filter(c => codePattern.test(c.code)`,
    ],
    [
      [
        "  $('exchange-ll').textContent = \x60\x24{number(state.ll)} / 1.000 LL\x60;",
        "  $('exchange-points').textContent = \x60\x24{number(availableSpend(state))} / 200 PT\x60;",
        "  $('ll-progress').style.width = \x60\x24{Math.min(state.ll / EXCHANGE_LL, 1) * 100}%\x60;",
        "  $('spent-progress').style.width = \x60\x24{Math.min(availableSpend(state) / EXCHANGE_POINTS, 1) * 100}%\x60;",
      ].join("\n"),
      `  const rules = state.redemption;
  $('exchange-ll').textContent = rules ? number(state.ll) + ' / ' + number(rules.ll) + ' LL' : '—';
  $('exchange-points').textContent = rules ? number(rules.available) + ' / ' + number(rules.points) + ' PT' : '—';
  $('ll-progress').style.width = rules ? Math.min(state.ll / rules.ll, 1) * 100 + '%' : '0%';
  $('spent-progress').style.width = rules ? Math.min(rules.available / rules.points, 1) * 100 + '%' : '0%';
  $('exchange-note').textContent = rules
    ? 'Servono entrambe le soglie. Solo le puntate pagate aumentano la quota punti.'
    : 'Soglie del buono in aggiornamento.';
  for (const label of document.querySelectorAll('[data-exchange-ll]')) label.textContent = rules ? number(rules.ll) : '—';
  for (const label of document.querySelectorAll('[data-exchange-points]')) label.textContent = rules ? number(rules.points) : '—';`,
    ],
    [
      oldMeanNote,
      "$('mean-note').textContent = 'Il gioco base assegna in media ' + mean.toLocaleString('it-IT', { maximumFractionDigits: 3 })"
        + " + ' LL per punto puntato. Bonus e giri extra sono esclusi dalla media.';",
    ],
    [
      "Quando raggiungi 1.000 LL e 200 punti spesi puoi richiedere il buono da 100 €.",
      "Controlla entrambe le soglie in Premi e Bonus per richiedere il buono da 100 €.",
    ],
  ];
  let script = oldScript;
  for (const [before, after] of scriptEdits) {
    script = replaceOne(script, before, after, "calcolo dei premi");
  }
  new Function(script);
  updated = replaceOne(updated, oldScript, script, "script della slot");
  return source.slice(0, start + declaration.length) + JSON.stringify(updated) + ";\n";
}

function readFile(path) {
  if (!lstatSync(path).isFile()) throw new Error("File non riconosciuto " + path + ".");
  return readFileSync(path, "utf8");
}

function writeAtomic(path, text, mode) {
  const temporary = join(dirname(path), ".milanese-premi-" + randomUUID() + ".tmp");
  try {
    writeFileSync(temporary, text, { flag: "wx", mode });
    renameSync(temporary, path);
  } finally {
    rmSync(temporary, { force: true });
  }
}

function main() {
  const args = process.argv.slice(2);
  if (args.length && (args.length !== 1 || args[0] !== "--check")) {
    throw new Error("Usa node ribilancia-la-milanese.mjs oppure aggiungi --check.");
  }
  const pkg = JSON.parse(readFile("package.json"));
  if (!pkg.dependencies?.next) throw new Error("Apri il terminale nella cartella lalinea-shop.");
  const game = readFile(gamePath);
  const api = readFile(apiPath);
  if (!api.includes("LALINEA_MILANESE_SESSION_PROOF_V2")) {
    throw new Error("Serve la versione funzionante dell’API La Milanese con accesso VIP.");
  }
  const edits = [
    { path: gamePath, before: game, after: patchGame(game) },
    { path: apiPath, before: api, after: api.includes(newError) ? api : replaceOne(api, oldError, newError, "messaggio del buono") },
  ].filter(edit => edit.before !== edit.after);
  if (!edits.length) {
    console.log("Aggiornamento premi già presente.");
    return;
  }
  if (args[0] === "--check") {
    console.log("File compatibili. Puoi applicare l’aggiornamento premi.");
    return;
  }

  const backup = mkdtempSync(join(tmpdir(), "milanese-premi-backup-"));
  for (const edit of edits) {
    if (readFile(edit.path) !== edit.before) throw new Error("File cambiato durante il controllo " + edit.path + ".");
    edit.mode = lstatSync(edit.path).mode;
    const copy = join(backup, edit.path);
    mkdirSync(dirname(copy), { recursive: true });
    writeFileSync(copy, edit.before, { flag: "wx", mode: edit.mode });
  }
  const written = [];
  try {
    for (const edit of edits) {
      writeAtomic(edit.path, edit.after, edit.mode);
      written.push(edit);
    }
  } catch (error) {
    for (const edit of written.reverse()) writeAtomic(edit.path, edit.before, edit.mode);
    throw error;
  }
  console.log("Interfaccia premi aggiornata.");
  console.log("Originali salvati in " + backup);
  console.log("Esegui 02-ribilancia-la-milanese.sql in Supabase e ricarica l’anteprima.");
}

try {
  main();
} catch (error) {
  console.error("Aggiornamento premi interrotto. " + error.message);
  process.exitCode = 1;
}
