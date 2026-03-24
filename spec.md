# SpinLuxe Casino - Auszahlungsfunktion

## Current State
Der Header zeigt die ICP-Balance des eingeloggten Spielers an (Balance-Card mit Coins-Icon, Betrag und Refresh-Button). Es gibt keine Möglichkeit, ICP aus dem App-Konto an eine externe Wallet zu senden.

Die `transferICP`-Funktion existiert bereits in `src/frontend/src/utils/icrc2.ts` und führt ICRC-1 Transfers per Identity durch.

## Requested Changes (Diff)

### Add
- `WithdrawDialog`-Komponente: Ein Dialog mit Eingabefeld für Ziel-Principal-ID und Betrag in ICP. Validierung: Adresse muss gültig sein, Betrag muss > 0 und <= (Balance - 0.0001 ICP Fee) sein. Zeigt Transaktionsgebühr (0.0001 ICP) als Hinweis. Nach erfolgreichem Transfer: Erfolgsmeldung, Balance wird neu geladen.
- "Auszahlen"-Button im Header, neben der Balance-Card, nur wenn eingeloggt. Button öffnet WithdrawDialog.

### Modify
- `Header.tsx`: Import und Einbindung des WithdrawDialog, "Auszahlen"-Button hinzufügen.

### Remove
- Nichts

## Implementation Plan
1. Neue Datei `src/frontend/src/components/WithdrawDialog.tsx` erstellen mit Dialog-Logik.
2. `transferICP` aus `icrc2.ts` importieren und aufrufen.
3. `Header.tsx` anpassen: Button und Dialog einbinden.
4. Balance nach Transfer automatisch neu laden via `queryClient.invalidateQueries`.
