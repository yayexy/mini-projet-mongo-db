# 🌤 Plateforme météorologique — Installation

Plateforme de gestion de données météorologiques développée avec **Next.js 15** et **MongoDB Atlas**.

---

## Prérequis

- [Node.js](https://nodejs.org/) version **18 ou supérieure**
- Un terminal (PowerShell, Terminal, Git Bash…)
- Le fichier **`.env.local`** fourni séparément (contient l'URI de connexion MongoDB)

---

## Méthode 1 — Clonage GitHub

```bash
# 1. Cloner le dépôt
git clone https://github.com/<votre-repo>/meteo-mongodb.git

# 2. Se placer dans le dossier
cd meteo-mongodb

# 3. Installer les dépendances
npm install

# 4. Créer le fichier de configuration à la racine du projet
#    Copier-coller le fichier .env.local fourni à cet emplacement :
#    meteo-mongodb/.env.local
```

> **Contenu du `.env.local` :**
> ```
> MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/meteo?retryWrites=true&w=majority
> ```
> Ce fichier vous est transmis séparément (par mail ou message) — ne pas le partager publiquement.

```bash
# 5. Lancer l'application
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000) dans le navigateur.

---

## Méthode 2 — Archive ZIP (Teams)

```bash
# 1. Télécharger le fichier .zip depuis Teams et l'extraire

# 2. Ouvrir un terminal dans le dossier extrait
#    (clic droit sur le dossier → "Ouvrir dans le terminal")

# 3. Installer les dépendances
npm install

# 4. Créer le fichier .env.local à la racine du dossier extrait
#    Copier-coller le fichier .env.local fourni à cet emplacement
```

> **Contenu du `.env.local` :**
> ```
> MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/meteo?retryWrites=true&w=majority
> ```

```bash
# 5. Lancer l'application
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000) dans le navigateur.

---

## Structure du projet

```
src/
├── app/
│   ├── page.tsx                    ← Dashboard principal
│   ├── stations/
│   │   ├── new/page.tsx            ← Créer une station
│   │   └── [id]/edit/page.tsx      ← Modifier une station
│   ├── releves/
│   │   ├── [id]/new/page.tsx       ← Créer un relevé
│   │   └── [id]/edit/page.tsx      ← Modifier un relevé
│   └── api/
│       ├── stations/               ← CRUD stations
│       │   └── [id]/sync/          ← Synchronisation Open-Meteo
│       └── releves/                ← CRUD relevés
└── lib/
    └── mongodb.ts                  ← Client MongoDB
```

---

## Fonctionnalités

- **Stations météo** — ajout, modification, suppression
- **Relevés météo** — mesures et prévisions, avec champs spécifiques selon le type de station (enneigement, hauteur des vagues, qualité de l'air…)
- **Filtres** — par type de relevé, période, plage de température
- **Synchronisation** — import automatique des données météo actuelles depuis [Open-Meteo](https://open-meteo.com/) (API gratuite, sans clé)
- **Base de données** — MongoDB Atlas (hébergé, aucune installation locale requise)

---

## Remarques

- La base de données est hébergée sur **MongoDB Atlas** — aucune installation locale de MongoDB n'est nécessaire.
- La synchronisation Open-Meteo nécessite que la station ait des coordonnées GPS renseignées.
- L'application fonctionne en mode développement (`npm run dev`). Pour la production : `npm run build && npm start`.