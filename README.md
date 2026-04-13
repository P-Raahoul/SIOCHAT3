# SIOCHAT

Une application de chat en temps réel construite avec Vue 3 et Socket.io.

## Fonctionnalités

- Messagerie en temps réel
- Fonctionnalité de chat privé
- Profils utilisateurs
- Salon de chat global

## Pile Technologique

- **Frontend** : Vue 3, Vue Router, Vite
- **Backend** : Node.js, Socket.io, Express
- **Base de données** : MongoDB Atlas
- **Outil de Build** : Vite

## Configuration IDE Recommandée

[VS Code](https://code.visualstudio.com/) + [Vue (Official)](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (et désactiver Vetur).

## Configuration Navigateur Recommandée

- Navigateurs basés sur Chromium (Chrome, Edge, Brave, etc.) :
  - [Vue.js devtools](https://chromewebstore.google.com/detail/vuejs-devtools/nhdogjmejiglipccpnnnanhbledajbpd)
  - [Activer le formateur d'objet personnalisé dans Chrome DevTools](http://bit.ly/object-formatters)
- Firefox :
  - [Vue.js devtools](https://addons.mozilla.org/en-US/firefox/addon/vue-js-devtools/)
  - [Activer le formateur d'objet personnalisé dans Firefox DevTools](https://fxdx.dev/firefox-devtools-custom-object-formatters/)

## Configuration du Projet

### Prérequis

- Node.js (version 20.19.0 ou supérieure, ou 22.12.0+)
- npm ou yarn

### Installation

1. Cloner le dépôt
2. Installer les dépendances pour le frontend :
```sh
   npm install
```
3. Installer les dépendances pour le serveur :
```sh
   cd Serveur
   npm install
   cd ..
```

### Exécution de l'Application

1. Démarrer le serveur :
```sh
   cd Serveur
   node serveur.js
```
   Vous devez voir :
   - Connecté à MongoDB
   - Server running on port 3000

2. Dans un nouveau terminal, démarrer le frontend :
```sh
   npm run dev
```
   Le frontend sera disponible sur http://localhost:5173 (port Vite par défaut).

### Build pour la Production

```sh
npm run build
```

### Aperçu du Build de Production

```sh
npm run preview
```

## Structure du Projet

- `src/` - Code source frontend Vue.js
- `Serveur/` - Serveur Node.js avec Socket.io
- `public/` - Ressources statiques
- `App/` - Composant d'application supplémentaire (si utilisé)

## Contribution

1. Forker le dépôt
2. Créer une branche de fonctionnalité
3. Effectuer vos modifications
4. Tester minutieusement
5. Soumettre une pull request

## Licence

Ce projet est privé.