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

## Telepíthető app (PWA)

Az oldal telefonra telepíthető: saját ikon, teljes képernyő, gyors indulás.

- A tagi oldalon és a kiképzői szkenneren megjelenik egy „Tedd ki a kezdőképernyőre” útmutató (Androidon Telepítés gomb, iPhone-on a Safari Megosztás → Főképernyőhöz adás lépései).
- A tag bérlete és QR-kódja net nélkül is megjelenik a legutóbb betöltött állapotban, jelölve, hogy mikori. Kijelentkezéskor törlődik a telefonról.
- Alkalmat levonni csak internettel lehet. Offline a gomb le van tiltva.
- Új verzió kirakása után a megnyitott app jelzi: „Elkészült az oldal új változata”, és a Frissítés gombbal betölti.
- Az ikonok: `client/public/icons/`, a beállítások: `client/vite.config.ts`.

## Élesítés

Bármilyen Node.js-t futtató tárhelyen működik (pl. Render, Railway, VPS).

1. `npm install && npm run build`, indítás: `npm start`.
2. Környezeti változók proxy mögött: `TRUST_PROXY=1`, `FORCE_HTTPS=1` (és ha kell, `PORT`).
3. Adattárolás: vagy Supabase (lent), vagy a `backend/data/` és a `public/uploads/` mappa **tartós lemezen** legyen.
4. Csak HTTPS-en üzemeltesd (a kamerás szkenner is csak így működik).
5. Állíts be erős admin jelszót, hozd létre a kiképzői fiókokat, cseréld a MINTA véleményeket.
6. Frissítsd az adatkezelési tájékoztatót (a tagok neve, e-mail címe, telefonszáma, kutyája és részvételi naplója is tárolva van).

## Supabase (adatbázis ingyenes tárhelyhez)

Ha be van állítva a `SUPABASE_URL` és a `SUPABASE_SERVICE_ROLE_KEY`, a szerver a tartalmat, a tagokat, a kiképzőket, a munkameneteket és a naplót a Supabase-ben tárolja, a feltöltött képeket pedig a Supabase Storage `uploads` tárolójában. Így az ingyenes Renderen sem vesznek el az adatok. Ha nincsenek beállítva, minden a helyi fájlokba kerül.

1. supabase.com: új projekt (régió: Central EU, Frankfurt).
2. SQL Editor: futtasd le a `supabase/schema.sql` tartalmát.
3. Project Settings → API: a **Project URL** a `SUPABASE_URL`, a **service_role / secret** kulcs a `SUPABASE_SERVICE_ROLE_KEY`. Ez titok: csak a Render Environment beállításaiba kerülhet, a kódba és a GitHubra soha.
4. A helyi adatok áttöltése (egyszer, a saját gépeden, zsh-ban). A kulcsot rejtve kéri, így nem marad a parancselőzményekben:

```bash
read -s "K?Supabase secret kulcs: " && echo && SUPABASE_URL=https://PROJEKT.supabase.co SUPABASE_SERVICE_ROLE_KEY="$K" npm run feltoltes; unset K
```

5. Renderen: Environment → a két változó felvétele → Save. Az újraindulás után a napló első sorai között ez áll: `Adattárolás: Supabase`.

Minden mentés előtti állapot a `kv_history` táblába is bekerül (60 napig). Az ingyenes Supabase-projekt egy hét teljes tétlenség után szünetel, ilyenkor a Supabase felületén egy kattintással újraindítható.
