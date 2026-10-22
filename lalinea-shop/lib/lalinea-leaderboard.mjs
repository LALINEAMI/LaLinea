// LALINEA_LEADERBOARD_V1
import { createHmac } from 'node:crypto';

export function publicAlias(customerId, secret) {
  if (typeof secret !== 'string' || !secret) throw new Error('Configurazione classifica mancante.');
  if (typeof customerId !== 'string' || !customerId || customerId.length > 128) throw new Error('Giocatore non valido.');
  const code = createHmac('sha256', secret).update('lalinea-public-ranking-v1:' + customerId).digest('hex').slice(0, 8).toUpperCase();
  return `Pilota ${code}`;
}

function integer(value, min, max) {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < min || value > max) throw new Error('Risultato classifica non valido.');
  return value;
}

function entry(row, secret, totalPlayers) {
  if (!row || typeof row !== 'object' || Array.isArray(row)) throw new Error('Risultato classifica non valido.');
  return {
    position: integer(row.position, 1, totalPlayers),
    alias: publicAlias(row.customerId, secret),
    highestLevel: integer(row.highestLevel, 1, 50),
    completedLevels: integer(row.completedLevels, 1, 50),
    totalCoins: integer(row.totalCoins, 0, Number.MAX_SAFE_INTEGER),
  };
}

// Allowlist esplicita: il JSON pubblico non contiene gli ID interni del VIP.
export function projectLeaderboard(data, { secret, viewerId = null, updatedAt = new Date().toISOString() }) {
  if (!data || typeof data !== 'object' || Array.isArray(data) || !Array.isArray(data.entries) || data.entries.length > 100) throw new Error('Risultato classifica non valido.');
  const totalPlayers = integer(data.totalPlayers, 0, Number.MAX_SAFE_INTEGER);
  const entries = data.entries.map(row => entry(row, secret, totalPlayers));
  const positions = new Set(entries.map(row => row.position));
  if (positions.size !== entries.length || entries.some((row, index) => row.position !== index + 1) || totalPlayers < entries.length) throw new Error('Ordine classifica non valido.');
  if (data.own != null && (!viewerId || data.own.customerId !== viewerId)) throw new Error('Posizione personale non valida.');
  return {
    totalPlayers,
    entries,
    authenticated: Boolean(viewerId),
    viewer: viewerId ? {
      alias: publicAlias(viewerId, secret),
      result: data.own == null ? null : entry(data.own, secret, totalPlayers),
    } : null,
    updatedAt,
    rules: 'level-coins-first-completion-v1',
  };
}
