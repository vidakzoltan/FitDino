# AGENTS.md – FitDino

## Projekt célja

A FitDino egy egyszerű, adatbázis nélküli HTML/CSS/JavaScript webjáték. A játék lényege, hogy a dínó a fel nyíllal vagy mobilon érintéssel ugrik, miközben random generált akadályok érkeznek vele szemben. Ütközéskor életet veszít, összesen 3 élete van, tehát az első ütközés után még 2 alkalommal próbálkozhat.

## Éles webhely

- Szerver oldali célmappa: `/home/zenitpr1/public_html/FitDino/`
- Publikus útvonal: `public_html/FitDino`
- Adatbázis: nincs
- Backend: nincs
- Fő belépési pont: `index.html`

## Technológiai keretek

- Statikus webapp: HTML, CSS, natív JavaScript
- Külső build folyamat nincs
- Composer, npm, Node build és adatbázis-migráció nem szükséges
- A játék logikája jelenleg az `assets/js/game.js` és az `assets/js/fitdino/` fájlokban található
- A stílusok az `assets/css/style.css` fájlban találhatók
- Képi elemek: `assets/images/`

## Mappastruktúra

```text
/
├── .cpanel.yml
├── AGENTS.md
├── README.md
├── index.html
└── assets/
    ├── css/
    │   └── style.css
    ├── images/
    │   └── logo.png
    └── js/
        ├── game.js
        └── fitdino/
            ├── constants.js
            ├── renderer.js
            └── utils.js
```

## Fejlesztési szabályok

1. Az alkalmazás maradjon adatbázis nélküli, statikus webapp.
2. A publikus célmappa mindig `/public_html/FitDino`.
3. A felhasználói szövegek magyar nyelvűek legyenek.
4. A játék maradjon egyszerűen használható: fel nyíl / Space / mobil érintés.
5. A dínónak 3 élete van; ütközés után ne azonnal legyen vége a játéknak, hanem csak a harmadik ütközés után.
6. Az akadályok random generálódjanak, de a játék ne legyen igazságtalanul lehetetlen.
7. Új funkcióknál mobilos működést is ellenőrizni kell.
8. Ne kerüljön be felesleges framework vagy nagy külső függőség.
9. Patch készítéskor csak az új és módosított fájlok kerüljenek a ZIP-be, projektgyökérhez igazodó relatív útvonalakkal.
10. Patch ZIP esetén legyen `patch_liras.md` fájl is, amely röviden összefoglalja a módosításokat.

## cPanel deploy szabály

A cPanel Git deploy a `.cpanel.yml` fájlt használja. A deploy folyamat `rsync --delete` paranccsal szinkronizál a célmappába, ezért ha a repóból fájl vagy mappa törlődik, az az éles `public_html/FitDino` mappából is törlődik.

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
- A logó és CSS fájlok relatív útvonalai működnek.
- A játék elindul billentyűzettel és mobil érintéssel is.
- Ütközéskor életlevonás történik.
- Három ütközés után Game Over állapot jelenik meg.
- A rekord mentése localStorage-ban működik.
- cPanel deploy után a fájlok a `/public_html/FitDino` mappában jelennek meg.
