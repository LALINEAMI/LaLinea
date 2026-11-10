export function replaceOne(source, old, replacement, label) {
  const first = source.indexOf(old);
  if (first < 0 || source.indexOf(old, first + old.length) >= 0) {
    throw new Error(`Blocco ${label} assente o duplicato.`);
  }
  return source.slice(0, first) + replacement + source.slice(first + old.length);
}

function matchOne(source, pattern, label) {
  const matches = [...source.matchAll(pattern)];
  if (matches.length !== 1) throw new Error(`Blocco ${label} assente o duplicato.`);
  return matches[0];
}

export function patchHome(source) {
  if (!source.includes("/lalinea-slot.html")) throw new Error("Pulsante La Milanese non trovato in app/page.tsx.");
  if (source.includes("// LALINEA_MILANESE_CHECKOUT_V1")) {
    if (!source.includes("await usaBuonoMilanese(") || !source.includes("await validaBuonoMilanese(")) {
      throw new Error("Il collegamento La Milanese già presente in app/page.tsx è incompleto.");
    }
    return source;
  }


  const reactImport = matchOne(source, /^import \{[^\r\n]*\buseRef\b[^\r\n]*\} from ["']react["'];[ \t]*$/gm, "import React in app/page.tsx")[0];
  const destination = matchOne(source, /\x60(https:\/\/t\.me\/[A-Za-z0-9_]+\?text=)\$\{testo\}\x60/g, "destinazione ordine Telegram")[1];
  const rewards = matchOne(source, /const premiConPunti = carrello\.filter\(\(item\) =>\s*\[[\d,\s]+\]\.includes\(Number\(item\.id\)\)\s*\);/g, "premi VIP nel carrello")[0];
  const firstApplyLine = matchOne(source, /const applicaCodiceSconto = async \([^\r\n]*\) => \{/g, "applicazione codice sconto")[0];
  const stateLine = 'const [codiceTetrisValidato, setCodiceTetrisValidato] = useState("");';

  let changed = replaceOne(source, reactImport, reactImport +
    '\nimport { isBuonoMilanese, usaBuonoMilanese, validaBuonoMilanese } from "../lib/laMilaneseCart";', "import carrello");
  changed = replaceOne(changed, stateLine, stateLine + `
 // LALINEA_MILANESE_CHECKOUT_V1
 const [codiceLaMilaneseValidato, setCodiceLaMilaneseValidato] = useState("");
 const milaneseCheckoutBusy = useRef(false);
 const milaneseDiscountVersion = useRef(0);`, "stato codice sconto");
  changed = replaceOne(changed, "const importoSconto =", `const importoSconto = codiceLaMilaneseValidato
  ? Math.min(totaleCarrello, Math.abs(scontoPercentuale))
  :`, "calcolo sconto");
  changed = replaceOne(changed, firstApplyLine, firstApplyLine + `
  const versioneMilanese = ++milaneseDiscountVersion.current;
  setCodiceLaMilaneseValidato("");`, "applicazione codice sconto");
  changed = replaceOne(changed, "// CODICI VECCHI GIÀ ESISTENTI", `if (isBuonoMilanese(codice)) {
    setScontoPercentuale(0);
    try {
      const valore = await validaBuonoMilanese(codice);
      if (versioneMilanese !== milaneseDiscountVersion.current) return;
      setCodiceLaMilaneseValidato(codice);
      setScontoPercentuale(-valore);
      setMessaggioSconto("Buono La Milanese da " + valore + " € · monouso sui prodotti.");
    } catch (errore) {
      if (versioneMilanese !== milaneseDiscountVersion.current) return;
      setMessaggioSconto(errore instanceof Error ? errore.message : "Verifica del buono non disponibile.");
    }
    return;
  }

  // CODICI VECCHI GIÀ ESISTENTI`, "gestione buono La Milanese");
  changed = replaceOne(changed, "setCodiceSconto(e.target.value.toUpperCase());", `setCodiceSconto(e.target.value.toUpperCase());
  milaneseDiscountVersion.current += 1;
  setCodiceLaMilaneseValidato("");`, "campo codice sconto");

  changed = replaceOne(changed, rewards, "", "filtro premi VIP");
  const reservation = "let prenotazioneSlotId: string | null = null;";
  const orderStart = changed.indexOf("const inviaOrdineTelegram = async () => {");
  const orderEnd = changed.indexOf("if (caricamentoIniziale)", orderStart);
  if (orderStart < 0 || orderEnd < 0 || changed.indexOf(reservation) < orderStart
    || changed.indexOf(reservation) > orderEnd) throw new Error("Conferma ordine in app/page.tsx non riconosciuta.");
  const branch = `${rewards}

  if (codiceLaMilaneseValidato) {
    if (milaneseCheckoutBusy.current) return;
    milaneseCheckoutBusy.current = true;
    try {
      const subtotalCents = Math.round(totaleCarrello * 100);
      const deliveryCents = Math.round(costoConsegna * 100);
      const receipt = await usaBuonoMilanese({
        code: codiceLaMilaneseValidato,
        telefono: datiCliente.telefono,
        subtotalCents,
        deliveryCents,
        premi: premiConPunti.map(item => ({ id: String(item.id), quantita: item.quantita })),
        messaggio,
        modalita: modalitaOrdine || "",
        date: dataConsegna || "",
        time: orarioConsegna || "",
      });
      const netto = (subtotalCents - receipt.appliedCents + deliveryCents) / 100;
      const totale = messaggio.replace(/^TOTALE ORDINE: .*$/m, "TOTALE ORDINE: " + netto.toFixed(2) + " €");
      const testoMilanese = encodeURIComponent(totale
        + "\\nBuono La Milanese: " + codiceLaMilaneseValidato
        + "\\nSconto applicato: " + (receipt.appliedCents / 100).toFixed(2) + " €"
        + "\\nRiferimento ordine VIP: " + receipt.orderId
        + (receipt.pointsDebited ? "\\nPunti VIP riscattati per premi: " + receipt.pointsDebited : ""));
      window.location.assign(${JSON.stringify(destination)} + testoMilanese);
    } catch (errore) {
      window.alert(errore instanceof Error ? errore.message : "Conferma ordine non disponibile.");
    } finally {
      milaneseCheckoutBusy.current = false;
    }
    return;
  }
  ${reservation}`;
  return replaceOne(changed, reservation, branch, "conferma ordine");
}

export function shareRewardCosts(source) {
  if (source.includes('from "../../../../lib/costiPremiVip"')) return { route: source };
  const match = matchOne(source, /^const costiPremi(?:\s*:\s*Record<string,\s*number>)?\s*=\s*(\{\s*(?:(?:["']\d+["']|\d+)\s*:\s*\d+\s*,\s*)*(?:["']\d+["']|\d+)\s*:\s*\d+\s*,?\s*\});/gm, "costi premi in app/api/vip/redeem/route.ts");
  if (!source.includes("costiPremi[id]")) throw new Error("I costi del riscatto VIP usano una struttura diversa.");
  return {
    route: replaceOne(source, match[0], 'import { costiPremi } from "../../../../lib/costiPremiVip";', "tabella costi premi"),
    costs: "export const costiPremi: Record<string, number> = " + match[1] + ";\n",
  };
}

export function patchVipLogin(source) {
  if (source.includes("LALINEA_MILANESE_SESSION_V1") || source.includes("LALINEA_SHARED_VIP_GAME_SESSION_V1")) return source;
  if (/\.cookies\.set\(\s*(?:SESSION_COOKIE|["']ll_game_session["'])\s*,\s*makeSession\(/.test(source)) return source;
  const hashCheck = /const pinCorretto\s*=\s*await bcrypt\.compare\(\s*pinInserito,\s*cliente\.pin_hash\s*\);\s*if\s*\(!pinCorretto\)\s*\{\s*return NextResponse\.json\([\s\S]*?\{ status: 401 \}[\s\S]*?\);\s*\}/;
  const pin = hashCheck.exec(source);
  const success = matchOne(source, /return NextResponse\.json\(\{\s*success: true,\s*cliente:\s*\{\s*nome: cliente\.nome,\s*telefono: cliente\.telefono,\s*punti: cliente\.punti,?\s*\},\s*movimenti: movimenti \|\| \[\],?\s*\}\);/g, "risposta VIP dopo verifica PIN");
  if (!pin || pin.index + pin[0].length > success.index) throw new Error("Controllo PIN in app/api/vip/login/route.ts non riconosciuto.");
  const result = success[0].replace("return NextResponse.json", "const rispostaLaMilanese = NextResponse.json");
  const update = `// LALINEA_MILANESE_SESSION_V1
    ${result}
    rispostaLaMilanese.headers.set("Cache-Control", "private, no-store");
    rispostaLaMilanese.cookies.set(milaneseCookie, creaSessioneMilanese(cliente), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: durataSessioneMilanese,
    });
    return rispostaLaMilanese;`;
  return 'import { makeSession as creaSessioneMilanese, SESSION_COOKIE as milaneseCookie, SESSION_SECONDS as durataSessioneMilanese } from "../../../../lib/laMilaneseVip";\n'
    + replaceOne(source, success[0], update, "emissione sessione VIP");
}

export function patchVipLogout(source) {
  if (source.includes("LALINEA_MILANESE_LOGOUT_V1") || /action:\s*["']logout["']/.test(source)) return source;
  const handler = matchOne(source, /onClick=\{\(\) => \{\s*setCliente\(null\);/g, "uscita dalla pagina VIP")[0];
  return replaceOne(source, handler, `onClick={async () => {
              // LALINEA_MILANESE_LOGOUT_V1
              try {
                const risposta = await fetch("/api/la-milanese", {
                  method: "POST", headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ action: "logout" }),
                });
                if (!risposta.ok) throw new Error("Uscita VIP non disponibile.");
              } catch {
                window.alert("Impossibile chiudere la sessione VIP. Riprova.");
                return;
              }
              setCliente(null);`, "uscita dalla pagina VIP");
}
