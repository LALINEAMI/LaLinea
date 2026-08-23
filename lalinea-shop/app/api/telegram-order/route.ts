import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID;

    if (!token || !chatId) {
      return NextResponse.json(
        { errore: "Configurazione Telegram mancante" },
        { status: 500 }
      );
    }

    const body = await request.json();
    const messaggio = body?.messaggio;

    if (typeof messaggio !== "string" || !messaggio.trim()) {
      return NextResponse.json(
        { errore: "Ordine non valido" },
        { status: 400 }
      );
    }

    const risposta = await fetch(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chat_id: chatId,
          text: messaggio,
        }),
      }
    );

    const risultato = await risposta.json();

    if (!risposta.ok || !risultato.ok) {
      return NextResponse.json(
        { errore: "Invio Telegram fallito" },
        { status: 502 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { errore: "Errore durante l’invio" },
      { status: 500 }
    );
  }
}