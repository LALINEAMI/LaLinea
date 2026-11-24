import { CalendarioConAccesso } from "../CalendarioAvvento";

export const metadata = { title: "Calendario dell’Avvento | LaLinea" };

export default function PaginaAvvento() {
  return (
    <main className="mx-auto w-full max-w-lg px-4 py-20 text-white">
      <CalendarioConAccesso />
    </main>
  );
}
