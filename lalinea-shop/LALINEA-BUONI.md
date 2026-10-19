# LaLinea Game: buoni personali

Il gioco assegna credito in euro al cliente VIP. L’accesso usa lo stesso telefono
e PIN dell’area VIP. Le partite vengono registrate dal browser e ricalcolate sul
server con la medesima fisica, i nemici, la raccolta degli oggetti e il seme della
partita. Il solo salvataggio del telefono non assegna credito reale.

Il credito totale raggiunge 2 € al primo livello, 5 € al secondo, 10 € al terzo e
200 € al cinquantesimo. Si accredita l’incremento rispetto al livello precedente:
2 €, poi 3 €, poi 5 €. Rigiocare non duplica il credito. Lo storico e il saldo
restano sul cliente VIP anche cambiando dispositivo.

## Installazione

1. Caricare `attiva-buoni-lalinea.mjs` nella radice `lalinea-shop`.
2. Nel secondo terminale, dalla radice, eseguire `node attiva-buoni-lalinea.mjs`.
3. Aprire il file creato `ATTIVA-BUONI-LALINEA.sql`, selezionare e copiare tutto.
4. Nel progetto Supabase collegato al sito: SQL Editor → New query → incollare → Run.
5. Pubblicare con i comandi Git stampati dal terminale.
6. Attendere Ready in Vercel e ricaricare il sito dal telefono.

La configurazione server riutilizza `NEXT_PUBLIC_SUPABASE_URL` e `SB_SECRET`
del VIP; è compatibile anche con la chiave server precedente. Il PIN viene
verificato con bcrypt; la sessione del gioco è firmata e conservata in un cookie
HttpOnly. Un cambio PIN invalida la sessione precedente. Sono limitati i tentativi
di accesso e le richieste di partite e buoni.

## Uso

Premere VIP nel gioco, accedere, chiudere la finestra e giocare. Dopo la vittoria
si attende la conferma dell’accredito. In Buoni, Genera il tuo buono crea un codice
personale monouso. Usa nel carrello apre il carrello e applica il codice.
Il numero del cliente dell’ordine deve corrispondere al numero VIP del buono.
Il buono si applica ai prodotti a pagamento; la consegna resta separata. Se
l’importo dei prodotti è inferiore al buono, viene utilizzato solo quell’importo
e il resto resta disponibile per un nuovo codice.

Buono, eventuali premi riscattati con i punti VIP e registrazione dell’ordine
vengono confermati nella stessa transazione. Una ricevuta stabile impedisce di
addebitare due volte o creare due ordini riprovando la medesima richiesta.
Il riferimento ordine viene aggiunto al messaggio Telegram già usato dal sito.
I buoni Tetris già emessi mantengono la loro gestione precedente.

Si può giocare in allenamento senza accesso, con l’indicazione che non si
accreditano buoni. Le partite premio devono essere completate entro 20 minuti
dall’avvio, comprese le pause. Il server verifica percorso e durata; non promette
di riconoscere qualsiasi forma di automazione del giocatore.

## Verifiche

Le verifiche si eseguono su un database PostgreSQL locale e clienti di prova,
senza usare credenziali o saldi dei clienti reali. Comprendono ordine dei livelli,
limite di 200 €, replay, monouso, addebiti parziali, rollback, autorizzazioni,
cookie, cambio PIN, verifica della partita e integrazione del carrello.
La migrazione e la pubblicazione nel progetto reale sono i passaggi di
installazione indicati sopra; non sono eseguiti dal pacchetto.

Il pacchetto include una copia delle sorgenti aggiornate per verifica e recupero.
L’installer legge la home presente al momento dell’esecuzione e modifica soltanto
i punti necessari al collegamento. I file sostituiti vengono salvati in
`.lalinea-game-backup/`; in caso di un errore di scrittura viene ripristinata la
copia precedente. Il pacchetto non esegue automaticamente Git o modifiche del
database.
