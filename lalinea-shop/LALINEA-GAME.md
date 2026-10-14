# LaLinea Game nel sito

L'installer copia il gioco approvato nel progetto Next.js LaLinea, aggiunge la pagina `/lalinea-game` e un pulsante nella home, immediatamente prima del blocco Tetris nel codice della pagina. Il gioco è servito direttamente dal sito LaLinea. Il pulsante apre il gioco a schermo intero sopra la home; la chiusura riporta alla pagina e conserva il carrello già aperto. La pagina `/lalinea-game` è disponibile anche per un collegamento diretto.

## Installazione

Caricare `installa-lalinea-game.mjs` nella cartella principale del progetto `lalinea-shop`, accanto a `package.json`. Dal terminale del progetto:

```sh
node installa-lalinea-game.mjs
```

Il file non richiede pacchetti aggiuntivi. Individua `app/page.tsx` o `src/app/page.tsx`, verifica il punto di inserimento e crea una copia di sicurezza dei file modificati. Un secondo avvio non duplica il pulsante. Se il punto di inserimento non è identificabile, interrompe l'operazione prima di scrivere: inviare il file `page.tsx` attuale per completare l'integrazione.

## Pubblicazione

Eseguire i comandi mostrati dall'installer dal ramo configurato come produzione nel progetto Vercel. Per il progetto con cartella `app`:

```sh
git add -- app/page.tsx app/components/LaLineaGameButton.tsx app/lalinea-game public/lalinea-game .gitignore LALINEA-GAME.md
git commit -m "Aggiunge LaLinea Game"
git push
```

Se il repository è collegato a Vercel con distribuzione automatica, il push avvia la pubblicazione. Attendere che la distribuzione risulti pronta. Aprire `/lalinea-game` sul dominio LaLinea e verificare movimento, salto, audio, ritorno al sito e progressi.

## Contenuti

- 50 livelli a Milano con ragazzo in moto, nemici poliziotti e oggetti LaLinea.
- Grafica più definita e inquadratura ravvicinata sul telefono.
- Valore raccolta: 0,05 euro per oggetto.
- Bonus livelli: 2 euro, 5 euro, 10 euro e progressione fino a 200 euro.
- Il gioco conserva i progressi nel browser del cliente sul dominio del sito.
- Traccia arcade di prova e caricamento audio. La musica di Super Mario attende il file audio dell'utente.

## Premi

I bonus sono dimostrativi. L'installer non emette codici spendibili e non modifica checkout o area VIP. Per i premi effettivi serve l'integrazione con il backend LaLinea, con verifica della sessione e registrazione univoca del buono. Prima dell'attivazione confermare le regole della progressione e dell'utilizzo.

## Verifica effettuata

Logica del gioco: 13 verifiche superate. Grafica controllata con rendering nativo, anche a dimensione mobile. Installazione e idempotenza controllate su una copia del file LaLinea disponibile e su fixture Next.js. La compilazione completa e la pubblicazione del sito di destinazione non sono state eseguite, perché l'accesso al repository e al progetto Vercel non è disponibile in questa sessione.
