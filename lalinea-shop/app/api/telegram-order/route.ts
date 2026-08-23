import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
    const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID?.trim();

    if (!token || !chatId) {
      return NextResponse.json(
        { error: "Configurazione Telegram mancante su Vercel" },
        { status: 500 }
      );
    }

    const { messaggio } = await request.json();

    if (!messaggio || typeof messaggio !== "string") {
      return NextResponse.json(
        { error: "Messaggio dell'ordine mancante" },
        { status: 400 }
      );
    }

    const rispostaTelegram = await fetch(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: messaggio,
        }),
        cache: "no-store",
      }
    );

    const risultato = await rispostaTelegram.json();

    if (!rispostaTelegram.ok || !risultato.ok) {
      return NextResponse.json(
        { error: risultato.description || "Telegram ha rifiutato l'ordine" },
        { status: 502 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (errore) {
    return NextResponse.json(
      { error: errore instanceof Error ? errore.message : "Errore server" },
      { status: 500 }
    );
  }
}