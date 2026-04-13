// ── Imports ──────────────────────────────────────────────────────────────────
import { createServer } from 'http';       // Création du serveur HTTP natif Node.js
import { Server } from 'socket.io';        // Serveur WebSocket temps réel
import express from 'express';             // Framework HTTP pour les routes REST
import cors from 'cors';                   // Middleware pour autoriser les requêtes cross-origin
import path from 'path';                   // Utilitaire de gestion des chemins de fichiers
import { fileURLToPath } from 'url';       // Conversion d'URL de module ES en chemin fichier
import mongoose from 'mongoose';           // ODM pour interagir avec MongoDB

// ── Configuration de base ─────────────────────────────────────────────────────

// Reconstitue __dirname (non disponible nativement en ES Modules)
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Création de l'application Express
const app = express();
app.use(cors());           // Autorise toutes les origines (frontend sur un port différent)
app.use(express.json());   // Parse automatiquement le corps des requêtes en JSON

// Ligne désactivée : sert les fichiers buildés du frontend en production
//app.use(express.static(path.join(__dirname, '..', 'SIOCHAT3', 'dist')));//

// Création du serveur HTTP à partir d'Express (requis pour y attacher Socket.IO)
const httpServer = createServer(app);

// Initialisation de Socket.IO sur le même serveur HTTP, avec CORS ouvert à tous
const io = new Server(httpServer, {
  cors: {
    origin: '*',
  },
});

// ── Connexion à la base de données MongoDB ────────────────────────────────────
mongoose.connect('mongodb+srv://raahoulpandourangame_db_user:sio123456@sio-chat.dk8jf8a.mongodb.net/?appName=SIO-CHAT')
  .then(() => console.log('✅ Connecté à MongoDB'))
  .catch((err) => console.error('❌ Erreur MongoDB:', err))

// ── Modèle Mongoose ───────────────────────────────────────────────────────────

// Schéma utilisateur : un seul champ pseudo, obligatoire et unique
const userSchema = new mongoose.Schema({
  pseudo: { type: String, required: true, unique: true },
})
// Modèle Mongoose associé à la collection "users" dans MongoDB
const User = mongoose.model('User', userSchema)

// ── Routes REST ───────────────────────────────────────────────────────────────

// POST /users — Inscription : crée un nouvel utilisateur avec le pseudo fourni
app.post('/users', async (req, res) => {
  const { pseudo } = req.body

  // Validation : le pseudo doit exister et faire au moins 3 caractères
  if (!pseudo || pseudo.length < 3) {
    return res.status(400).json({ error: "Pseudo invalide (minimum 3 caractères)" })
  }
  try {
    const user = new User({ pseudo })
    await user.save()
    res.status(201).json(user) // 201 Created : utilisateur créé avec succès
  } catch (err) {
    // Mongoose renvoie une erreur si le pseudo est déjà pris (contrainte unique)
    res.status(400).json({ error: "Pseudo déjà utilisé" })
  }
})

// GET /users — Retourne la liste de tous les utilisateurs enregistrés
// Utilisé par le frontend pour afficher les utilisateurs connectés dans la sidebar
app.get('/users', async (req, res) => {
  const users = await User.find()
  res.json(users)
})

// POST /login — Connexion : vérifie que le pseudo existe en base
// Note : pas de mot de passe côté serveur, l'authentification est basique
app.post('/login', async (req, res) => {
  const { pseudo } = req.body
  const user = await User.findOne({ pseudo })
  if (!user) {
    return res.status(404).json({ error: "Utilisateur non trouvé" })
  }
  res.json({ message: "Connecté", user })
})

// ── Socket.IO — Messagerie temps réel ────────────────────────────────────────
io.on('connection', (socket) => {
  console.log('Un utilisateur vient de se connecter');

  // Écoute l'événement 'chat message' envoyé par un client
  socket.on('chat message', (data) => {
    // Génère l'heure côté serveur comme fallback si le client n'en envoie pas
    const heure = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    const msg = {
      pseudo: data.pseudo,
      text: data.text,
      time: data.time || heure // Priorité à l'heure du client, sinon celle du serveur
    };
    // Rediffuse le message à tous les clients connectés (broadcast global)
    io.emit('chat message', msg);
  });

  // Événement déclenché quand un client se déconnecte (fermeture de l'onglet, etc.)
  socket.on('disconnect', () => {
    console.log('Un utilisateur vient de se déconnecter');
  });
});

// ── Démarrage du serveur ──────────────────────────────────────────────────────

// Utilise le port défini dans les variables d'environnement, ou 3000 par défaut
const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});