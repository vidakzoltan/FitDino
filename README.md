# FitDino

A **FitDino** egy egyszerű, magyar nyelvű, dínós ugrálós webjáték. A játékos a dínót irányítja, amelynek random generált akadályokat kell átugrania. Ütközéskor életet veszít, összesen 3 élete van.

## Fő funkciók

- Dínós ugrálós játék böngészőben
- Fel nyíl vagy Space billentyűvel ugrás
- Mobilon érintéses vezérlés
- Random generált akadályok
- 3 élet: az első ütközés után még 2 próbálkozás marad
- Pontszám, szintek és rekord mentése localStorage-ban
- Tatami próba belépő: külön mini-játék előkészítése FitDino és Kung-Fu Teknős mérkőzéséhez
- Adatvédelmi irányelvek footer link
- Felső adatvédelmi és cookie/helyi tárolási tájékoztató sáv
- Adatbázis nélküli működés

## Telepítési hely

A webapp éles helye:

```text
/public_html/fitdino
```

cPanel szerverútvonallal:

```text
/home/zenitpr1/public_html/fitdino/
```

## Projektstruktúra

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
        ├── privacy-notice.js
        └── fitdino/
            ├── constants.js
            ├── renderer.js
            └── utils.js
```

## Tatami próba

A Tatami próba az appon belüli külön mini-játék iránya. A jelenlegi változat az `index.html` oldalon működő, jól látható belépőt és előnézeti panelt ad. A panel célja, hogy FitDino külön játékmódban mérhesse össze magát a Kung-Fu Teknőssel.

A link nem külön hiányzó HTML fájlra mutat, hanem az oldalon belüli `#tatamiMini` szekcióra, ezért statikus cPanel deploy mellett is működik.

## Adatvédelem és helyi tárolás

A FitDino statikus játék, adatbázist és saját backendet nem használ. A játék a működéshez szükséges böngészőoldali tárolást használ:

- `localStorage`: rekord mentése, valamint az adatvédelmi/helyi tárolási tájékoztató tudomásulvételének megőrzése.
- Technikai cookie: az adatvédelmi/helyi tárolási tájékoztató tudomásulvételének megőrzése.

A tájékoztató sáv nem marketing-cookie hozzájárulás, hanem működési tájékoztatás tudomásulvétele. Analytics, reklám-cookie vagy marketing célú engedélyezési logika nem kerülhet bele.

A publikus adatvédelmi irányelvek linkje:

```text
https://www.zenitprograms.hu/?page_id=226
```

## Futtatás lokálisan

Mivel statikus webapp, külön build vagy adatbázis nem szükséges. A projekt futtatható egyszerű lokális webszerverrel, például:

```bash
python3 -m http.server 8080
```

Ezután böngészőben:

```text
http://localhost:8080
```

## cPanel deploy

A repó gyökerében található `.cpanel.yml` fájl végzi a deploy-t:

```yaml
---
deployment:
  tasks:
    - export DEPLOYPATH=/home/zenitpr1/public_html/fitdino/
    - /bin/mkdir -p "$DEPLOYPATH"
    - >
      /bin/rsync -av --delete --delete-after
      --exclude='.git/'
      --exclude='.github/'
      --exclude='*.zip'
      --exclude='*.yml'
      --exclude='*.yaml'
      --exclude='*.csv'
      --exclude='*.md'
      --exclude='*.sql'
      --exclude='uploads/'
      --exclude='_backup/'
      --exclude='backup/'
      --exclude='backups/'
      --exclude='tmp/'
      --exclude='cache/'
      --exclude='logs/'
      ./
      "$DEPLOYPATH/"
```

A deploy `rsync --delete` használatával működik, ezért a repóból törölt fájlok az éles célmappából is törlődnek.

## Fontos fejlesztési elvek

- Ne legyen adatbázis.
- Ne legyen felesleges backend.
- Ne kerüljön be nagy külső framework.
- Maradjon gyors, egyszerű, mobilon is használható játék.
- A felhasználói felület magyar nyelvű legyen.
- Az adatvédelmi/footer link és a felső tájékoztató sáv maradjon üzleti logikától mentes.
- A tájékoztató sáv csak működéshez szükséges sütikről és helyi böngészőtárolásról szólhat.
- Patch ZIP készítéskor csak az új és módosított fájlok kerüljenek a csomagba.
