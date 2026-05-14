# FitDino

A **FitDino** egy egyszerű, magyar nyelvű, dínós ugrálós webjáték. A játékos a dínót irányítja, amelynek random generált akadályokat kell átugrania. Ütközéskor életet veszít, összesen 3 élete van.

## Fő funkciók

- Dínós ugrálós játék böngészőben
- Fel nyíl vagy Space billentyűvel ugrás
- Mobilon érintéses vezérlés
- Random generált akadályok
- 3 élet: az első ütközés után még 2 próbálkozás marad
- Pontszám, szintek és rekord mentése localStorage-ban
- Adatbázis nélküli működés

## Telepítési hely

A webapp éles helye:

```text
/public_html/FitDino
```

cPanel szerverútvonallal:

```text
/home/zenitpr1/public_html/FitDino/
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
        └── fitdino/
            ├── constants.js
            ├── renderer.js
            └── utils.js
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
    - export DEPLOYPATH=/home/zenitpr1/public_html/FitDino/
    - /bin/mkdir -p "$DEPLOYPATH"
    - /bin/rsync -av --delete --exclude='.git' --exclude='.github' --exclude='.cpanel.yml' --exclude='.cPanel.yaml' --exclude='AGENTS.md' --exclude='README.md' --exclude='patch_liras.md' ./ "$DEPLOYPATH"
```

A deploy `rsync --delete` használatával működik, ezért a repóból törölt fájlok az éles célmappából is törlődnek.

## Fontos fejlesztési elvek

- Ne legyen adatbázis.
- Ne legyen felesleges backend.
- Ne kerüljön be nagy külső framework.
- Maradjon gyors, egyszerű, mobilon is használható játék.
- A felhasználói felület magyar nyelvű legyen.
- Patch ZIP készítéskor csak az új és módosított fájlok kerüljenek a csomagba.
