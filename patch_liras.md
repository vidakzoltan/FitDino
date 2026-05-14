# FitDino patch leírás

## Módosítások

- Új `.cpanel.yml` fájl készült a cPanel Git deployhoz.
- A deploy célmappája: `/home/zenitpr1/public_html/FitDino/`.
- A deploy `rsync --delete` alapon működik, így a repóból törölt fájlok az éles mappából is törlődnek.
- Új `AGENTS.md` fájl készült a fejlesztési szabályokkal és projektutasításokkal.
- Új `README.md` fájl készült a projekt leírásával, struktúrájával és futtatási/deploy információival.

## Érintett fájlok

- `.cpanel.yml`
- `AGENTS.md`
- `README.md`
- `patch_liras.md`

## Megjegyzés

A cPanel Git deploy hivatalosan a `.cpanel.yml` fájlnevet figyeli, ezért ezt a fájlnevet használtam. A `.cPanel.yaml` elnevezést nem tettem aktív deploy fájlként a csomagba, mert a cPanelnél ez könnyen félrevezető vagy hatástalan lehet.
