# Seed images

Drop last year's photo folders in here to have `pnpm --filter api db:seed`
use them instead of placeholder images.

Each folder name must match the `image path` of the house in
`apps/api/src/scripts/seed.ts`. The nine expected folders are:

```
apps/api/seed-images/
├── Barn Brothers/
├── Barn Rennovation Organization/     # yes, the original folder is misspelled
├── Beyond Barn Architecture/
├── Bil & Law Architecture/
├── Bon Jour Barns/
├── JDesigns/
├── M & M Architecture/
├── P & E Architects/
└── Supreme Renovations/
```

Put `01.jpg`, `02.jpg`, … inside each folder.

Files are sorted naturally (`01.jpg`, `02.jpg`, … `10.jpg`) and copied into
`apps/api/uploads/` under the house's slug, so re-running the seed refreshes
them. Images `01`–`03` are treated as the showcase images by the UI; the rest
fill the gallery.

These files are git-ignored by default to keep the repository small. Force-add
them if you want them committed:

```bash
git add -f apps/api/seed-images
```
