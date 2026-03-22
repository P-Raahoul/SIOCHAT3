import { createServer } from 'http';
import { Server } from 'socket.io';
import express from 'express';
import cors from 'cors'

const app = express();
app.use(cors())
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
  },
});


app.use(express.json());
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



// la suite 
io.on('connection', (socket) => {
  console.log('Un utilisateur vient de se connecter');

  // Réception d'un objet contenant pseudo et message
  socket.on('chat message', (data) => {
    console.log("Données reçues du client : ", data);  // Affiche les données envoyées par le client

    // Formatage du message en chaîne de caractères
    const message = `${data.pseudo} : ${data.text}`;
    
    io.emit('chat message', message);  // Envoi du message formaté à tous les clients
  });
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});


