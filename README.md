# Az Én Kutyaiskolám weboldal

React + TypeScript kliens (Vite, Zustand az admin állapotához), Node.js + TypeScript (Express) backend, saját szerkesztőfelülettel, tagi és kiképzői résszel.

## Mappák

```
backend/          Node.js + TypeScript szerver (Express)
  src/
    server.ts       belépési pont, biztonsági fejlécek, statikus fájlok
    config.ts       útvonalak és környezeti változók
    store.ts        adatok (tartalom, tagok, kiképzők, napló)
    sessions.ts     bejelentkezések (újraindítás után is megmaradnak)
    security.ts     jelszavak, belépési korlát
    routes/         auth, member, trainer, admin API
    shared/types.ts közös típusok (a kliens is ezeket használja)
  data/           content.json és a többi adatfájl, mentések
client/           React + TypeScript kliens (Vite)
  src/
    pages/          nyilvános oldalak, tagi oldal, kiképzői szkenner
    admin/          szerkesztőfelület (/admin), állapota Zustand store-ban (admin/store.ts)
    components/     fejléc, lábléc, közös blokkok, ikonok
    styles/         site.css, admin.css
public/           statikus fájlok
  uploads/          képek (feltöltöttek, régi oldalról, Facebookról)
  fonts/            Poppins betűtípus
_archiv/          a korábbi (sima JavaScript) változat
```

## Indítás

Node.js 20 vagy újabb kell.

```bash
npm install          # első alkalommal
npm run jelszo       # admin jelszó (min. 12 karakter)
npm run dev          # fejlesztés: http://localhost:5173 (a backend a 3000-es porton fut)
```

Éles futtatás:

```bash
npm run build        # React kliens + backend fordítása
npm start            # http://localhost:3000 (a backend szolgálja ki a klienst is)
```

## Oldalak

`/` főoldal, `/kepzesek`, `/oktatok`, `/hirek` és `/hirek/<azonosító>`, `/rendezvenyek`, `/galeria`, `/gyik`, `/kapcsolat`,
`/tagoknak` (tagi belépés, bérletek), `/kikepzo` (kiképzői szkenner), `/admin` (szerkesztő).

## Szerkesztő (/admin)

Minden szöveg, kép, hír, rendezvény, galériakép, oktató, vélemény, GYIK, elérhetőség szerkeszthető, a mentés azonnal látszik.

- **Szöveg formázása** (hírek, GYIK): üres sor = új bekezdés, `- ` = felsorolás, `## ` = alcím, `**félkövér**`, `[link szövege](https://...)`.
- **Képek**: a feltöltöttek a `public/uploads/` mappába kerülnek, a túl nagyokat a szerkesztő 1800 px-re kicsinyíti.

## Tagok, bérletek, kiképzők

- Tag felvétele, bérletek, kézi alkalom-rögzítés: Admin → **Tagok és bérletek**. Telefon nélküli tagnak a bérlet melletti **QR** gombbal kártya nyomtatható.
- A tag a **„Már tag vagyok”** oldalon e-mail címmel és jelszóval lép be (1 évig bejelentkezve marad), és ott látja a bérletei QR-kódját.
- Minden kiképzőnek saját fiókja van: Admin → **Bérlet-szkennelés**. A kiképző a `/kikepzo` oldalon beolvassa a QR-kódot, és egy gombbal levon egy alkalmat (visszavonható).
- Minden levonás, visszavonás és kézi módosítás a naplóba kerül (ki, mikor, kinek a kutyájáról).

## Biztonság és mentés

- Jelszavak csak titkosított lenyomatként (scrypt). Belépési korlát IP-címenként és fiókonként.
- Szigorú böngészőszabályok (CSP), minden fájl a saját szerverről töltődik.
- Mentés minden módosítás előtt (`backend/data/backups/`), napi teljes pillanatkép 30 napig, és az adminból letölthető teljes mentés. Havonta töltsd le, és tárold máshol is.

## Élesítés

Bármilyen Node.js-t futtató tárhelyen működik (pl. Render, Railway, VPS).

1. `npm install && npm run build`, indítás: `npm start`.
2. Környezeti változók proxy mögött: `TRUST_PROXY=1`, `FORCE_HTTPS=1` (és ha kell, `PORT`).
3. A `backend/data/` és a `public/uploads/` mappa **tartós lemezen** legyen.
4. Csak HTTPS-en üzemeltesd (a kamerás szkenner is csak így működik).
5. Állíts be erős admin jelszót, hozd létre a kiképzői fiókokat, cseréld a MINTA véleményeket.
6. Frissítsd az adatkezelési tájékoztatót (a tagok neve, e-mail címe, telefonszáma, kutyája és részvételi naplója is tárolva van).
