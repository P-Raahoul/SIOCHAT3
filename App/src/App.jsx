import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';
import './App.css';
import './index.css';

const socket = io('http://172.16.7.42:3000'); // Assure-toi que c'est bien l'adresse du serveur

function App() {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [pseudo, setPseudo] = useState('');
  const [isPseudoSet, setIsPseudoSet] = useState(false);

  // Demander le pseudo à l'utilisateur lors de la première connexion
  useEffect(() => {
    const userPseudo = window.prompt("Entrez votre pseudo :");
    if (userPseudo) {
      setPseudo(userPseudo);
      setIsPseudoSet(true);
    } else {
      setPseudo("Anonyme");
      setIsPseudoSet(true);
    }
  }, []);

  // Fonction d'envoi de message
  function sendMessage(e) {
    e.preventDefault();
    if (message.trim() === '') return; // Empêche d'envoyer un message vide

    // Envoi de l'objet { pseudo, text } au serveur
    console.log("Envoi du message au serveur : ", { pseudo, text: message }); // Vérifie ce qui est envoyé
    socket.emit('chat message', { pseudo, text: message });

    setMessage(''); // Réinitialise le champ de message
  }

  useEffect(() => {
    // Écoute des messages envoyés par le serveur
    socket.on('chat message', (msg) => {
      console.log("Type du message reçu :", typeof msg);  // Affiche le type du message reçu
      console.log("Message reçu : ", msg);  // Affiche le message reçu
      if (typeof msg === 'string') {
        setMessages((prevMessages) => [...prevMessages, msg]); // Si c'est une chaîne, ajoute le message
      } else {
        console.error("Le message reçu n'est pas une chaîne de caractères :", msg);
      }
    });

    return () => {
      socket.off('chat message');
    };
  }, []);

  return (
    <div>
      {!isPseudoSet ? (
        <form onSubmit={(e) => {
          e.preventDefault();
          setIsPseudoSet(true);
        }}>
          <input
            type="text"
            placeholder="Entrez votre pseudo"
            value={pseudo}
            onChange={(e) => setPseudo(e.target.value)}
            required
          />
          <button type="submit">Valider</button>
        </form>
      ) : (
        <>
          <ul>
            {messages.map((msg, index) => (
              <li key={index}>{msg}</li>
            ))}
          </ul>
          
          <form onSubmit={sendMessage}>
            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              autoComplete="off"
            />
            <button type="submit">Envoyer</button>
          </form>
        </>
      )}
    </div>
  );
}

export default App;

