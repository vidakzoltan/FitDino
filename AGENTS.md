# AGENTS.md – FitDino

## Projekt célja

A FitDino egy egyszerű, adatbázis nélküli HTML/CSS/JavaScript webjáték. A játék lényege, hogy a dínó a fel nyíllal vagy mobilon érintéssel ugrik, miközben random generált akadályok érkeznek vele szemben. Ütközéskor életet veszít, összesen 3 élete van, tehát az első ütközés után még 2 alkalommal próbálkozhat.

Az alkalmazáson belül külön mini-játék a Tatami harc, ahol FitDino a Kung-Fu Teknőssel mérheti össze magát. A Tatami harc külön `tatami.html` oldal, oldalnézetes canvas-játékkal és működő billentyűzetes, illetve mobilos vezérléssel.

## Éles webhely

- Szerver oldali célmappa: `/home/zenitpr1/public_html/webapps/fitdino/`
- Publikus célútvonal: `public_html/webapps/fitdino`
- Publikus aldomain: `https://fitdino.zenitprograms.hu`
- Az aldomain dokumentumgyökér-hozzárendelése külön WePanel-beállítás; repository deploy nem módosíthatja automatikusan.
- Adatbázis: nincs
- Backend: nincs
- Fő belépési pont: `index.html`
- Tatami mini-játék belépési pontja: `tatami.html`

## Technológiai keretek

- Statikus webapp: HTML, CSS, natív JavaScript
- Külső build folyamat nincs
- Composer, npm, Node build és adatbázis-migráció nem szükséges
- A fő játék logikája az `assets/js/game.js` és az `assets/js/fitdino/` fájlokban található
- A Tatami harc logikája az `assets/js/tatami.js` fájlban található
- Az adatvédelmi tájékoztató logikája az `assets/js/privacy-notice.js` fájlban található
- Az alap stílusok az `assets/css/style.css`, a Tatami harc kiegészítő stílusai az `assets/css/tatami.css` fájlban találhatók
- Képi elemek: `assets/images/`

## Mappastruktúra

```text
/
├── .cpanel.yml
├── AGENTS.md
├── README.md
├── index.html
├── tatami.html
└── assets/
    ├── css/
    │   ├── style.css
    │   └── tatami.css
    ├── images/
    │   └── logo.png
    └── js/
        ├── game.js
        ├── privacy-notice.js
        ├── tatami.js
        └── fitdino/
            ├── constants.js
            ├── renderer.js
            └── utils.js
```

## Fejlesztési szabályok

1. Az alkalmazás maradjon adatbázis nélküli, statikus webapp.
2. A deploy célmappa mindig `/home/zenitpr1/public_html/webapps/fitdino/`.
3. Az aldomain dokumentumgyökerét a felhasználó állítja át a WePanelen; ezt a repository vagy deploy-script nem módosíthatja.
4. A régi `/home/zenitpr1/public_html/fitdino/` mappa csak sikeres aldomain-cutover és production smoke után vezethető ki.
5. A felhasználói szövegek magyar nyelvűek legyenek.
6. A játék maradjon egyszerűen használható: fel nyíl / Space / mobil érintés.
7. A dínónak 3 élete van; ütközés után ne azonnal legyen vége a játéknak, hanem csak a harmadik ütközés után.
8. Az akadályok random generálódjanak, de a játék ne legyen igazságtalanul lehetetlen.
9. Új funkcióknál mobilos működést is ellenőrizni kell.
10. Ne kerüljön be felesleges framework vagy nagy külső függőség.
11. Patch készítéskor csak az új és módosított fájlok kerüljenek a ZIP-be, projektgyökérhez igazodó relatív útvonalakkal.
12. Patch ZIP esetén legyen `patch_liras.md` fájl is, amely röviden összefoglalja a módosításokat.
13. Az adatvédelmi irányelvek footer linkje maradjon a ZenitPrograms publikus adatvédelmi oldalára mutató egyszerű hivatkozás.
14. A felső adatvédelmi tájékoztató sáv a `.topbar` fölött jelenjen meg.
15. A Tatami harc külön oldalra mutasson: `tatami.html`.
16. A Tatami harcban a karakterek ne egyszerű korongként jelenjenek meg, hanem oldalnézetes, rajzolt FitDino és teknős figuraként.
17. A Tatami harc legyen ténylegesen irányítható: mozgás, blokk, mozdulat, szünet és új mérkőzés.
18. A játékmódválasztó gombok legyenek jól láthatók, kontrasztosak és mobilon is könnyen megnyomhatók.

## WePanel deploy szabály

A WePanelen használt repository a kompatibilitási célból megtartott gyökérszintű `.cpanel.yml` fájlt használja. A fájlt nem szabad `.wepanel.yml` vagy `.wepanel.yaml` névre átnevezni. A branchkezelés külön Git/WePanel funkció, nem a deployfájl neve vezérli.

A deploy folyamat `rsync --delete` paranccsal szinkronizál kizárólag a `/home/zenitpr1/public_html/webapps/fitdino/` célmappába. A régi `/home/zenitpr1/public_html/fitdino/` mappát a deploy nem módosíthatja és nem törölheti.

A deploy nem másolja ki az alábbi repo/dokumentációs fájlokat az éles webmappába:

- `.git`
- `.github`
- `.cpanel.yml`
- `.cPanel.yaml`
- `AGENTS.md`
- `README.md`
- `patch_liras.md`

## Ellenőrzési lista módosítás után

- `index.html` betöltődik közvetlenül böngészőből.
- `tatami.html` betöltődik közvetlenül böngészőből.
- A logó és CSS fájlok relatív útvonalai működnek.
- A fő játék elindul billentyűzettel és mobil érintéssel is.
- Ütközéskor életlevonás történik.
- Három ütközés után Game Over állapot jelenik meg.
- A rekord mentése localStorage-ban működik.
- Az adatvédelmi tájékoztató sáv megjelenik a topbar fölött.
- A footerben megjelenik az Adatvédelmi irányelvek link.
- A Tatami harc linkje a külön `tatami.html` oldalra mutat.
- A Tatami harcban működik a mozgás, blokk, mozdulat, szünet és új mérkőzés.
- Deploy után a fájlok a `/home/zenitpr1/public_html/webapps/fitdino/` mappában jelennek meg.
- Az aldomain átállítása előtt a régi `/home/zenitpr1/public_html/fitdino/` mappa érintetlen marad.
- Az aldomain átállítása után `https://fitdino.zenitprograms.hu` production smoke szükséges a régi mappa kivezetése előtt.
