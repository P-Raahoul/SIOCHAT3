import { createServer } from 'http';
import { Server } from 'socket.io';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
app.use(cors());
app.use(express.json());

// Sert les fichiers du dossier "dist" (votre front-end compilé)
app.use(express.static(path.join(__dirname, '..', 'SIOCHAT3', 'dist')));

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
  },
});

// Tableau qui stocke les utilisateurs
const users = [];

// Créer un utilisateur
app.post('/users', (req, res) => {
  const { pseudo } = req.body;
  if (!pseudo || pseudo.length < 3) {
    return res.status(400).json({ error: "Pseudo invalide (minimum 3 caractères)" });
  }
  const exists = users.find(u => u.pseudo === pseudo);
  if (exists) {
    return res.status(400).json({ error: "Pseudo déjà utilisé" });
  }
  const user = { id: users.length + 1, pseudo };
  users.push(user);
  res.status(201).json(user);
});

// Récupérer tous les utilisateurs
app.get('/users', (req, res) => {
  res.json(users);
});

// Login
app.post('/login', (req, res) => {
  const { pseudo } = req.body;
  const user = users.find(u => u.pseudo === pseudo);
  if (!user) {
    return res.status(404).json({ error: "Utilisateur non trouvé" });
  }
  res.json({ message: "Connecté", user });
});

// Socket.IO
io.on('connection', (socket) => {
  console.log('Un utilisateur vient de se connecter');
  socket.on('chat message', (data) => {
    const heure = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    const msg = {
      pseudo: data.pseudo,
      text: data.text,
      time: data.time || heure
    };
    io.emit('chat message', msg);
  });
  socket.on('disconnect', () => {
    console.log('Un utilisateur vient de se déconnecter');
  });
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});