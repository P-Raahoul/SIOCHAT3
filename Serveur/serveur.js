import { createServer } from 'http';
import { Server } from 'socket.io';

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin: '*',
  },
});

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


