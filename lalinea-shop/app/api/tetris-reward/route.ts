import { randomBytes } from "crypto";
import { NextRequest, NextResponse } from "next/server";

type RewardRow = {
  code?: string;
  amount?: number;
  used_at?: string | null;
};

function supabaseConfig() {
  const url = String(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/\/$/, "");
  const serviceRoleKey = String(process.env.SUPABASE_SERVICE_ROLE_KEY ?? "");

  if (!url || !serviceRoleKey) {
    throw new Error("Configurazione Supabase mancante");
  }

  return { url, serviceRoleKey };
}

function headersSupabase(serviceRoleKey: string) {
  return {
    apikey: serviceRoleKey,
    Authorization: `Bearer ${serviceRoleKey}`,
    "Content-Type": "application/json",
  };
}

function normalizzaCodice(value: unknown) {
  return String(value ?? "").trim().toUpperCase();
}

function codiceValido(code: string) {
  return /^LLT(?:5|10)-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(code);
}

function playerIdValido(value: unknown) {
  const playerId = String(value ?? "").trim();
  return /^[A-Za-z0-9_-]{8,96}$/.test(playerId) ? playerId : "";
}

function livelloValido(value: unknown) {
  const level = Number(value);
  return Number.isInteger(level) && level >= 15 && level <= 999 && level % 15 === 0
    ? level
    : 0;
}

function nuovoCodice(amount: 5 | 10) {
  const a = randomBytes(2).toString("hex").toUpperCase();
  const b = randomBytes(2).toString("hex").toUpperCase();
  return `LLT${amount}-${a}-${b}`;
}

async function leggiPremioEsistente(playerId: string, level: number) {
  const { url, serviceRoleKey } = supabaseConfig();
  const endpoint =
    `${url}/rest/v1/tetris_reward_codes` +
    `?player_id=eq.${encodeURIComponent(playerId)}` +
    `&reward_level=eq.${level}` +
    `&select=code,amount,used_at&limit=1`;

  const response = await fetch(endpoint, {
    headers: headersSupabase(serviceRoleKey),
    cache: "no-store",
  });

  if (!response.ok) {
    const detail = await response.text();
    console.error("Lettura premio Tetris:", detail);
    throw new Error("Impossibile leggere il premio");
  }

  const rows = (await response.json()) as RewardRow[];
  return rows[0] ?? null;
}

async function creaPremio(playerId: string, level: number) {
  const amount: 5 | 10 = level % 30 === 0 ? 10 : 5;
  const { url, serviceRoleKey } = supabaseConfig();

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const code = nuovoCodice(amount);
    const response = await fetch(`${url}/rest/v1/tetris_reward_codes`, {
      method: "POST",
      headers: {
        ...headersSupabase(serviceRoleKey),
        Prefer: "return=representation",
      },
      body: JSON.stringify([
        {
          code,
          player_id: playerId,
          reward_level: level,
          amount,
        },
      ]),
      cache: "no-store",
    });

    if (response.ok) {
      const rows = (await response.json()) as RewardRow[];
      return rows[0] ?? { code, amount, used_at: null };
    }

    const detail = await response.text();
    let dbCode = "";
    try {
      dbCode = String(JSON.parse(detail)?.code ?? "");
    } catch {}

    if (response.status === 409 || dbCode === "23505") {
      const existing = await leggiPremioEsistente(playerId, level);
      if (existing) return existing;
      continue;
    }

    console.error("Creazione premio Tetris:", detail);
    throw new Error("Impossibile creare il premio");
  }

  throw new Error("Impossibile creare un codice premio univoco");
}


async function verificaPremio(code: string) {
  const { url, serviceRoleKey } = supabaseConfig();

  const response = await fetch(
    `${url}/rest/v1/tetris_reward_codes?code=eq.${encodeURIComponent(code)}&select=amount,used_at&limit=1`,
    {
      headers: headersSupabase(serviceRoleKey),
      cache: "no-store",
    }
  );

  if (!response.ok) {
    const detail = await response.text();
    console.error("Verifica premio Tetris:", detail);
    throw new Error("Impossibile verificare il premio");
  }

  const rows = (await response.json()) as RewardRow[];
  const reward = rows[0];

  if (!reward) {
    return { ok: false as const, status: 404, error: "Codice premio non valido" };
  }

  if (reward.used_at) {
    return { ok: false as const, status: 409, error: "Questo premio è già stato utilizzato" };
  }

  const amount = Number(reward.amount);
  if (amount !== 5 && amount !== 10) {
    return { ok: false as const, status: 400, error: "Valore premio non valido" };
  }

  return { ok: true as const, amount };
}

async function consumaPremio(code: string) {
  const { url, serviceRoleKey } = supabaseConfig();

  const lookup = await fetch(
    `${url}/rest/v1/tetris_reward_codes?code=eq.${encodeURIComponent(code)}&select=amount,used_at&limit=1`,
    {
      headers: headersSupabase(serviceRoleKey),
      cache: "no-store",
    }
  );

  if (!lookup.ok) {
    const detail = await lookup.text();
    console.error("Verifica premio Tetris:", detail);
    throw new Error("Impossibile verificare il premio");
  }

  const rows = (await lookup.json()) as RewardRow[];
  const reward = rows[0];

  if (!reward) {
    return { ok: false as const, status: 404, error: "Codice premio non valido" };
  }

  if (reward.used_at) {
    return { ok: false as const, status: 409, error: "Questo premio è già stato utilizzato" };
  }

  const amount = Number(reward.amount);
  if (amount !== 5 && amount !== 10) {
    return { ok: false as const, status: 400, error: "Valore premio non valido" };
  }

  const usedAt = new Date().toISOString();
  const response = await fetch(
    `${url}/rest/v1/tetris_reward_codes?code=eq.${encodeURIComponent(code)}&used_at=is.null`,
    {
      method: "PATCH",
      headers: {
        ...headersSupabase(serviceRoleKey),
        Prefer: "return=representation",
      },
      body: JSON.stringify({ used_at: usedAt }),
      cache: "no-store",
    }
  );

  if (!response.ok) {
    const detail = await response.text();
    console.error("Consumo premio Tetris:", detail);
    throw new Error("Impossibile utilizzare il premio");
  }

  const updated = (await response.json()) as RewardRow[];
  if (updated.length === 0) {
    return { ok: false as const, status: 409, error: "Questo premio è già stato utilizzato" };
  }

  return { ok: true as const, amount };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const action = String(body?.action ?? "");

    if (action === "issue") {
      const playerId = playerIdValido(body?.playerId);
      const level = livelloValido(body?.level);

      if (!playerId || !level) {
        return NextResponse.json(
          { error: "Dati premio non validi" },
          { status: 400 }
        );
      }

      let reward = await leggiPremioEsistente(playerId, level);
      if (!reward) reward = await creaPremio(playerId, level);

      if (reward.used_at) {
        return NextResponse.json(
          { error: "Premio di questo livello già utilizzato" },
          { status: 409 }
        );
      }

      const amount: 5 | 10 = Number(reward.amount) === 10 ? 10 : 5;
      return NextResponse.json(
        { ok: true, code: reward.code, amount, level },
        { headers: { "Cache-Control": "no-store" } }
      );
    }


    if (action === "validate") {
      const code = normalizzaCodice(body?.code);
      if (!codiceValido(code)) {
        return NextResponse.json(
          { valido: false, error: "Codice premio non valido" },
          { status: 400 }
        );
      }

      const result = await verificaPremio(code);
      if (!result.ok) {
        return NextResponse.json(
          { valido: false, error: result.error },
          { status: result.status }
        );
      }

      return NextResponse.json(
        { valido: true, tipo: "fisso", valore: result.amount },
        { headers: { "Cache-Control": "no-store" } }
      );
    }

    if (action === "consume") {
      const code = normalizzaCodice(body?.code);
      if (!codiceValido(code)) {
        return NextResponse.json(
          { valido: false, error: "Codice premio non valido" },
          { status: 400 }
        );
      }

      const result = await consumaPremio(code);
      if (!result.ok) {
        return NextResponse.json(
          { valido: false, error: result.error },
          { status: result.status }
        );
      }

      return NextResponse.json(
        { valido: true, tipo: "fisso", valore: result.amount },
        { headers: { "Cache-Control": "no-store" } }
      );
    }

    return NextResponse.json({ error: "Azione non valida" }, { status: 400 });
  } catch (error) {
    console.error("POST tetris-reward:", error);
    return NextResponse.json(
      { error: "Errore interno nella gestione del premio" },
      { status: 500 }
    );
  }
}
