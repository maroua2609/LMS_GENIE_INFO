# LMS Génie Informatique - Frontend

Frontend React + TypeScript pour la plateforme d'apprentissage en ligne.

## 🚀 Installation

### Prérequis
- Node.js 16+
- npm ou yarn

### Étapes

1. **Installer les dépendances**
```bash
npm install
# ou
yarn install
```

2. **Installer lucide-react pour les icônes**
```bash
npm install lucide-react
```

3. **Configurer les variables d'environnement**
```bash
cp .env.example .env.local
```

Modifier `.env.local`:
```
VITE_API_URL=http://localhost:8000/api
```

4. **Démarrer le serveur de développement**
```bash
npm run dev
```

Le frontend sera accessible à `http://localhost:5173`

## 📁 Structure du projet

```
src/
├── pages/                 # Pages principales
│   ├── Login.tsx         # Connexion
│   ├── Register.tsx      # Inscription
│   ├── DashboardNew.tsx  # Tableau de bord
│   ├── ModuleDetailNew.tsx
│   ├── CoursDetailNew.tsx
│   ├── QuizNew.tsx
│   ├── ForumNew.tsx
│   └── AnnoncesNew.tsx
├── components/
│   ├── common/           # Composants réutilisables
│   │   ├── Navbar.tsx
│   │   └── index.ts      # Loading, ErrorAlert, EmptyState, Card
│   ├── form/             # Composants de formulaire
│   │   └── index.ts      # Input, Textarea, Select, Checkbox, Button
│   └── ProtectedRoute.tsx # Protection des routes
├── services/             # Appels API
│   ├── authService.ts
│   ├── moduleService.ts
│   ├── quizService.ts
│   ├── annonceService.ts
│   └── forumService.ts
├── hooks/
│   └── useAuth.ts        # Hook d'authentification
├── types/
│   └── index.ts          # Types TypeScript
├── utils/
│   └── helpers.ts        # Fonctions utilitaires
├── api/
│   └── config.ts         # Configuration axios
└── App.tsx               # Routeur principal
```

## 🔐 Authentification

L'authentification se fait via JWT:
- Les tokens sont stockés dans `localStorage`
- Intercepteurs axios pour ajouter le token automatiquement
- Vérification automatique de l'expiration

**Compte de test:**
- Email: `admin@lms-gi.ma`
- Mot de passe: `password`

## 🎨 Design System

- **Framework CSS**: Tailwind CSS v4
- **Icônes**: Lucide React
- **Composants**: Personnalisés (pas de bibliothèque UI)

### Palette de couleurs
- Primaire: `#2563eb` (Bleu)
- Danger: `#ef4444` (Rouge)
- Succès: `#10b981` (Vert)
- Avertissement: `#f59e0b` (Ambre)

## 🔌 Endpoints API utilisés

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/auth/login` | Connexion |
| POST | `/auth/register` | Inscription |
| GET | `/auth/me` | Utilisateur courant |
| GET | `/modules` | Tous les modules |
| GET | `/modules/:id` | Détail module |
| GET | `/modules/:id/cours` | Cours du module |
| GET | `/me/modules` | Mes modules |
| GET | `/cours/:id` | Détail cours |
| GET | `/cours/:id/ressources` | Ressources du cours |
| GET | `/quiz/:id` | Détail quiz |
| GET | `/quiz/:id/questions` | Questions du quiz |
| POST | `/quiz/:id/start` | Démarrer un quiz |
| GET | `/annonces` | Annonces |
| GET | `/modules/:id/forum` | Sujets du forum |
| POST | `/modules/:id/forum` | Créer un sujet |

## 📦 Commandes utiles

```bash
# Développement
npm run dev

# Build production
npm run build

# Linter
npm run lint

# Preview build
npm run preview

# Initialiser Tailwind CSS
npm run init-tailwind
```

## 🔧 Configuration TypeScript

- Strict mode activé
- Resolution es2020
- Module ESNext
- JSX React 17+

## 📝 Conventions de code

- Composants en PascalCase
- Fichiers en camelCase ou PascalCase
- Types dans un dossier `types/`
- Services dans un dossier `services/`
- Hooks dans un dossier `hooks/`

## 🚀 Déploiement

### Build production
```bash
npm run build
```

### Serveur statique
```bash
npm install -g serve
serve -s dist -l 3000
```

## 📞 Support

Pour les problèmes, vérifiez:
1. La connexion à l'API backend (`VITE_API_URL`)
2. Les tokens JWT dans `localStorage`
3. La console du navigateur pour les erreurs

## 📄 License

MIT
