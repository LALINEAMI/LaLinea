// LALINEA_LEADERBOARD_V1
const $ = id => document.getElementById(id);
const number = new Intl.NumberFormat('it-IT');
let data = null, visible = 20, active = null, lastAttempt = 0, toastTimer;
const objects = count => `${number.format(count)} ${count === 1 ? 'oggetto' : 'oggetti'}`;

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = String(text);
  return node;
}
function mine(entry) { return data?.viewer?.result?.position === entry.position; }
function code(alias) { return alias.replace(/^Pilota /, ''); }
function time(stamp) {
  return new Date(stamp).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Rome' });
}
function validEntry(row) {
  return row && Number.isSafeInteger(row.position) && row.position > 0
    && /^Pilota [A-F0-9]{8}$/.test(row.alias)
    && Number.isInteger(row.highestLevel) && row.highestLevel >= 1 && row.highestLevel <= 50
    && Number.isSafeInteger(row.totalCoins) && row.totalCoins >= 0;
}
function validResponse(value) {
  return value && Number.isSafeInteger(value.totalPlayers) && value.totalPlayers >= 0
    && Array.isArray(value.entries) && value.entries.length <= 100
    && value.entries.every((row, index) => validEntry(row) && row.position === index + 1 && row.position <= value.totalPlayers)
    && !Number.isNaN(Date.parse(value.updatedAt))
    && typeof value.authenticated === 'boolean'
    && (value.viewer === null || value.authenticated && /^Pilota [A-F0-9]{8}$/.test(value.viewer?.alias) && (value.viewer.result === null || validEntry(value.viewer.result)));
}
function setLive(state) {
  const node = $('live-state');
  node.className = 'live-state' + (state === 'live' ? ' is-live' : state === 'stale' ? ' is-stale' : '');
  node.replaceChildren(element('i'), document.createTextNode(state === 'live' ? 'RISULTATI AGGIORNATI' : state === 'stale' ? 'AGGIORNAMENTO IN PAUSA' : 'COLLEGAMENTO'));
}
function podium() {
  const fragment = document.createDocumentFragment();
  for (const row of data.entries.slice(0, 3)) {
    const card = element('article', 'podium-card');
    card.dataset.place = String(row.position);
    card.setAttribute('aria-label', `${row.position}° posto, ${row.alias}, livello ${row.highestLevel}, ${objects(row.totalCoins)}`);
    card.append(element('div', 'podium-place', String(row.position).padStart(2, '0')));
    const name = element('h3', 'podium-player');
    name.append(element('span', '', 'PILOTA'), document.createTextNode(code(row.alias)));
    card.append(name);
    const score = element('p', 'podium-score');
    score.append(document.createTextNode('Livello '), element('strong', '', row.highestLevel), element('span', '', '·'), document.createTextNode(objects(row.totalCoins)));
    card.append(score);
    if (mine(row)) card.append(element('span', 'podium-you', 'SEI TU'));
    fragment.append(card);
  }
  $('podium').replaceChildren(fragment);
}
function table() {
  if (!data) return;
  const search = $('search').value.trim().toLocaleLowerCase('it-IT');
  const rows = data.entries.filter(row => row.alias.toLocaleLowerCase('it-IT').includes(search));
  const fragment = document.createDocumentFragment();
  for (const row of rows.slice(0, visible)) {
    const tr = element('tr', mine(row) ? 'own-row' : '');
    tr.append(element('td', 'row-position', String(row.position).padStart(2, '0')));
    const player = element('td', 'row-player');
    player.append(element('small', '', 'Pilota'), document.createTextNode(code(row.alias)));
    if (mine(row)) player.append(element('span', 'you-tag', 'TU'));
    tr.append(player, element('td', 'numeric row-level', row.highestLevel), element('td', 'numeric row-coins', number.format(row.totalCoins)));
    fragment.append(tr);
  }
  $('ranking-body').replaceChildren(fragment);
  $('no-results').hidden = rows.length !== 0;
  $('more').hidden = visible >= rows.length;
  $('visible-count').textContent = `${Math.min(rows.length, visible)} di ${number.format(rows.length)} ${rows.length === 1 ? 'pilota' : 'piloti'}${search ? rows.length === 1 ? ' trovato' : ' trovati' : ''}`;
  $('board-count').textContent = data.totalPlayers > 100 ? 'I MIGLIORI 100 DEL CLUB' : `${number.format(data.totalPlayers)} ${data.totalPlayers === 1 ? 'PILOTA IN CLASSIFICA' : 'PILOTI IN CLASSIFICA'}`;
}
function personal() {
  const viewer = data.viewer;
  if (!viewer) {
    $('personal-heading').textContent = 'Il prossimo posto è tuo.';
    $('personal-copy').textContent = 'Entra nel gioco con il tuo profilo VIP e completa il primo livello.';
    $('personal-link').replaceChildren(document.createTextNode('ACCEDI E GIOCA '), element('span', '', '→'));
    return;
  }
  $('personal-link').replaceChildren(document.createTextNode('TORNA AL GIOCO '), element('span', '', '→'));
  if (viewer.result) {
    $('personal-heading').textContent = `Sei al ${number.format(viewer.result.position)}° posto.`;
    $('personal-copy').textContent = `${viewer.alias} · Livello ${viewer.result.highestLevel} di 50 · ${objects(viewer.result.totalCoins)}`;
  } else {
    $('personal-heading').textContent = `${viewer.alias}, tocca a te.`;
    $('personal-copy').textContent = 'Completa il primo livello con il VIP per entrare in classifica.';
  }
}
function render() {
  $('total-players').textContent = number.format(data.totalPlayers);
  $('best-level').textContent = data.entries[0]?.highestLevel ?? '—';
  $('updated').textContent = `Aggiornata alle ${time(data.updatedAt)}`;
  $('empty').hidden = data.totalPlayers !== 0;
  $('podium-section').hidden = data.entries.length === 0;
  $('classifica').hidden = data.entries.length === 0;
  personal(); podium(); table();
}
async function refresh() {
  if (active || document.hidden) return;
  const controller = new AbortController(); active = controller;
  const timeout = setTimeout(() => controller.abort(), 16000);
  lastAttempt = Date.now();
  $('refresh').disabled = true; $('retry').disabled = true;
  $('classifica').setAttribute('aria-busy', 'true');
  try {
    const response = await fetch('/api/lalinea-game/leaderboard', { credentials: 'same-origin', cache: 'no-store', signal: controller.signal, headers: { Accept: 'application/json' } });
    const result = await response.json();
    if (!response.ok || !validResponse(result)) throw new Error('Risultati non disponibili.');
    data = result;
    $('failure').hidden = true; $('notice').hidden = true;
    render(); setLive('live');
  } catch {
    if (document.hidden) return;
    setLive('stale');
    if (data) {
      $('notice').textContent = 'Aggiornamento non riuscito. Sono mostrati gli ultimi risultati ricevuti. Riprova con il pulsante Aggiorna.';
      $('notice').hidden = false;
    } else {
      $('failure').hidden = false;
      $('updated').textContent = 'Risultati non disponibili';
    }
  } finally {
    clearTimeout(timeout); active = null;
    $('loading').hidden = true;
    $('refresh').disabled = false; $('retry').disabled = false;
    $('classifica').removeAttribute('aria-busy');
  }
}
function toast(text) {
  clearTimeout(toastTimer); $('toast').textContent = text; $('toast').hidden = false;
  toastTimer = setTimeout(() => { $('toast').hidden = true; }, 3200);
}
$('search').addEventListener('input', () => { visible = 20; table(); });
$('more').addEventListener('click', () => { visible += 20; table(); });
$('refresh').addEventListener('click', refresh);
$('retry').addEventListener('click', refresh);
$('share').addEventListener('click', async () => {
  const url = new URL('/classifica', location.origin).href;
  try {
    if (navigator.share) await navigator.share({ title: 'Classifica LaLinea Games', text: 'La classifica del club. Ci vediamo in gara!', url });
    else { await navigator.clipboard.writeText(url); toast('Link della classifica copiato.'); }
  } catch (error) { if (error.name !== 'AbortError') toast('Puoi condividere il link di questa pagina.'); }
});
document.addEventListener('visibilitychange', () => {
  if (document.hidden) active?.abort();
  else if (Date.now() - lastAttempt > 15000) refresh();
});
window.addEventListener('pageshow', event => { if (event.persisted) refresh(); });
setInterval(() => { if (Date.now() - lastAttempt >= 55000) refresh(); }, 60000);
refresh();
