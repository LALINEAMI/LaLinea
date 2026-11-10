import { createHash } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const packageDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectDirectory = process.cwd();
const globalsPath = path.join(projectDirectory, "app/globals.css");
const pagePath = path.join(projectDirectory, "app/page.tsx");
const fontPath = path.join(projectDirectory, "public/fonts/lalinea-desktop-oro.woff2");
const startMarker = "/* LALINEA_DESKTOP_ORO_START */";
const endMarker = "/* LALINEA_DESKTOP_ORO_END */";
const fontHash = "f390221fbe0952f46f77e97920345b8e71f17a8d5e9f663252f7725959dafe6a";
const checkOnly = process.argv.includes("--check");

async function readOptional(filename) {
  try {
    return await readFile(filename);
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw error;
  }
}

async function install() {
  const [originalCss, page, skin, font, installedFont] = await Promise.all([
    readFile(globalsPath, "utf8"),
    readFile(pagePath, "utf8"),
    readFile(path.join(packageDirectory, "desktop-oro.css"), "utf8"),
    readFile(path.join(packageDirectory, "lalinea-liquid.woff2")),
    readOptional(fontPath),
  ]);

  for (const fragment of ['id="lalinea-pagina"', 'className="ll-vertical-tools"', 'className="ll-tool-card"']) {
    if (!page.includes(fragment)) {
      throw new Error(`Contenitori non riconosciuti in app/page.tsx. Elemento richiesto: ${fragment}`);
    }
  }
  if (createHash("sha256").update(font).digest("hex") !== fontHash) {
    throw new Error("Il font del pacchetto risulta incompleto o diverso da quello verificato.");
  }
  if (installedFont && !installedFont.equals(font)) {
    throw new Error("Esiste già un font differente in public/fonts/lalinea-desktop-oro.woff2.");
  }

  const start = originalCss.indexOf(startMarker);
  const end = originalCss.indexOf(endMarker);
  const markersAbsent = start === -1 && end === -1;
  if (!markersAbsent && (start < 0 || end < start || originalCss.indexOf(startMarker, start + 1) !== -1 || originalCss.indexOf(endMarker, end + 1) !== -1)) {
    throw new Error("Il blocco desktop oro esistente è incompleto o duplicato. Controlla i marcatori nel CSS.");
  }

  const newline = originalCss.includes("\r\n") ? "\r\n" : "\n";
  const normalizedSkin = skin.replace(/\r?\n/g, newline).trim();
  const block = [startMarker, normalizedSkin, endMarker].join(newline);
  const updatedCss = markersAbsent
    ? originalCss + (originalCss.endsWith(newline) ? newline : newline + newline) + block + newline
    : originalCss.slice(0, start) + block + originalCss.slice(end + endMarker.length);

  if (checkOnly) {
    console.log("Controllo riuscito. Contenitori e font riconosciuti.");
    console.log("La versione desktop oro può essere installata.");
    return;
  }

  // Install the independent font before activating its CSS. Retrying is safe.
  await mkdir(path.dirname(fontPath), { recursive: true });
  if (!installedFont) {
    try {
      await writeFile(fontPath, font, { flag: "wx" });
    } catch (error) {
      if (error.code !== "EEXIST" || !(await readFile(fontPath)).equals(font)) throw error;
    }
  }
  if (updatedCss === originalCss) {
    console.log("Versione desktop oro già installata e aggiornata.");
    return;
  }

  const backupDirectory = path.join(packageDirectory, "backup");
  await mkdir(backupDirectory, { recursive: true });
  const stamp = new Date().toISOString().replaceAll(":", "-");
  const backupPath = path.join(backupDirectory, `globals-${stamp}-${process.pid}.css`);
  await writeFile(backupPath, originalCss, { flag: "wx" });

  const temporaryPath = `${globalsPath}.desktop-oro-${process.pid}.tmp`;
  if (await readFile(globalsPath, "utf8") !== originalCss) {
    throw new Error("app/globals.css è cambiato durante il controllo. Salva il file e rilancia il comando.");
  }
  await writeFile(temporaryPath, updatedCss, { flag: "wx" });
  await rename(temporaryPath, globalsPath);

  console.log("Contenitori desktop oro installati con il font LaLinea Liquid.");
  console.log(`Copia del CSS precedente in ${path.relative(projectDirectory, backupPath)}`);
  console.log("Ora ricarica il sito da desktop per controllare il risultato.");
}

install().catch((error) => {
  console.error(`Installazione interrotta. ${error.message}`);
  process.exitCode = 1;
});
