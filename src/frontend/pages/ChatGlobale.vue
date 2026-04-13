<template>
  <div class="chat-page">

    <ProfilModal
      v-if="showProfil"
      @close="showProfil = false"
      @profile-updated="onProfileUpdated"
    />

    <ChatPrive
      v-if="showChatPrive"
      :destinataire="chatPriveDestinataire"
      @close="showChatPrive = false"
    />

    <!-- Sidebar -->
    <aside class="sidebar">
      <div class="brand">
        <span class="brand-prefix">SIO</span><span class="brand-suffix">CHAT</span>
      </div>

      <div class="room-section">
        <p class="room-label">Salon</p>
        <div class="room-item active">
          <span class="room-icon">#</span>
          <span>général</span>
        </div>
      </div>

      <div class="room-section">
        <p class="room-label">Messages directs</p>
        <div
          v-for="user in autresUtilisateurs"
          :key="user.pseudo"
          class="room-item room-item--user"
          @click="ouvrirChatPrive(user.pseudo)"
        >
          <div class="user-avatar-mini" :style="getAvatarStyle(user.pseudo)">
            <img v-if="getAvatar(user.pseudo)" :src="getAvatar(user.pseudo)" alt="pdp" class="avatar-img-mini" />
            <span v-else>{{ user.pseudo[0].toUpperCase() }}</span>
          </div>
          <span>{{ user.pseudo }}</span>
          <span v-if="hasUnread(user.pseudo)" class="unread-dot"></span>
        </div>
        <p v-if="autresUtilisateurs.length === 0" class="no-users">Aucun autre utilisateur.</p>
      </div>

      <div class="sidebar-footer">
        <div class="user-info" @click="showProfil = true" title="Modifier mon profil">
          <div class="avatar">
            <img v-if="avatar" :src="avatar" alt="pdp" class="avatar-img" />
            <span v-else>{{ session.pseudo ? session.pseudo[0].toUpperCase() : '?' }}</span>
          </div>
          <div class="user-info-text">
            <span class="pseudo">{{ session.pseudo }}</span>
            <span class="user-status">En ligne</span>
          </div>
          <span class="edit-icon">✏️</span>
        </div>
        <button class="btn-logout" @click="handleLogout" title="Se déconnecter">⏻</button>
      </div>
    </aside>

    <!-- Chat principal -->
    <main class="chat-main">
      <header class="chat-header">
        <div class="header-left">
          <span class="header-hash">#</span>
          <span class="header-channel">général</span>
        </div>
        <span class="header-subtitle">Chat commun — tout le monde peut lire et écrire</span>
      </header>

      <div class="messages-area" ref="messagesArea">
        <div
          v-for="(msg, index) in messages"
          :key="index"
          class="message"
          :class="{ 'message--own': msg.pseudo === session.pseudo }"
        >
          <div
            class="message-avatar"
            :style="getAvatarStyle(msg.pseudo)"
            @click="msg.pseudo !== session.pseudo && ouvrirChatPrive(msg.pseudo)"
            :class="{ 'clickable': msg.pseudo !== session.pseudo }"
          >
            <img v-if="getAvatar(msg.pseudo)" :src="getAvatar(msg.pseudo)" alt="pdp" class="avatar-img" />
            <span v-else>{{ msg.pseudo[0].toUpperCase() }}</span>
          </div>
          <div class="message-body">
            <div class="message-meta">
              <span
                class="message-pseudo"
                :class="{ 'clickable': msg.pseudo !== session.pseudo }"
                @click="msg.pseudo !== session.pseudo && ouvrirChatPrive(msg.pseudo)"
              >{{ msg.pseudo }}</span>
              <span class="message-time">{{ msg.time }}</span>
            </div>
            <p class="message-text">{{ msg.text }}</p>
          </div>
        </div>

        <div v-if="messages.length === 0" class="empty-chat">
          <div class="empty-chat-icon">💬</div>
          <p class="empty-chat-title">Aucun message pour l'instant</p>
          <p class="empty-chat-sub">Sois le premier à écrire quelque chose !</p>
        </div>
      </div>

      <div class="input-area">
        <div class="input-wrapper">
          <input
            v-model="newMessage"
            type="text"
            class="input-message"
            placeholder="Envoie un message dans #général..."
            @keydown.enter="sendMessage"
          />
          <button class="btn-send" @click="sendMessage">
            <span class="btn-send-label">Envoyer</span>
            <span class="btn-send-icon">↑</span>
          </button>
        </div>
      </div>
    </main>
  </div>
</template>

<script>
// Composants enfants utilisés dans cette page
import ProfilModal from '../composant/Profile.vue'
import ChatPrive from '../composant/ChatPrive.vue'
// Client Socket.IO pour la communication en temps réel
import { io } from 'socket.io-client'

// URL de base de l'API backend
const API_URL = 'http://localhost:3000'

export default {
  name: 'ChatGlobale',
  components: { ProfilModal, ChatPrive },

  data() {
    return {
      session: {},              // Données de l'utilisateur connecté (pseudo, etc.)
      avatar: null,             // URL de l'avatar de l'utilisateur connecté
      messages: [],             // Liste des messages du chat global
      newMessage: '',           // Contenu du champ de saisie
      showProfil: false,        // Affiche/masque la modale de profil
      showChatPrive: false,     // Affiche/masque la fenêtre de chat privé
      chatPriveDestinataire: '', // Pseudo du destinataire du chat privé ouvert
      autresUtilisateurs: [],   // Liste des autres utilisateurs connectés
      socket: null,             // Instance Socket.IO
      pollingInterval: null,    // Référence de l'intervalle de polling des utilisateurs
    }
  },

  created() {
    // Vérification de la session — redirige vers /login si l'utilisateur n'est pas connecté
    const sessionData = localStorage.getItem('siochat_session')
    if (!sessionData) { this.$router.push('/login'); return }
    this.session = JSON.parse(sessionData)

    // Chargement initial des données
    this.loadAvatar()
    this.loadUtilisateurs()

    // Connexion Socket.IO au serveur
    this.socket = io(API_URL)

    // Écoute des nouveaux messages du chat global et défilement automatique vers le bas
    this.socket.on('chat message', (msg) => {
      this.messages.push(msg)
      this.$nextTick(() => this.scrollToBottom())
    })

    // Polling toutes les 2 secondes pour mettre à jour la liste des utilisateurs connectés
    this.pollingInterval = setInterval(() => {
      this.loadUtilisateurs()
    }, 2000)
  },

  beforeUnmount() {
    // Nettoyage : arrêt du polling et déconnexion du socket avant destruction du composant
    clearInterval(this.pollingInterval)
    if (this.socket) this.socket.disconnect()
  },

  methods: {
    // Charge l'avatar de l'utilisateur connecté depuis le localStorage
    loadAvatar() {
      const profil = JSON.parse(localStorage.getItem('siochat_profil_' + this.session.pseudo) || '{}')
      this.avatar = profil.avatar || null
    },

    // Récupère la liste de tous les utilisateurs depuis l'API et exclut l'utilisateur connecté
    async loadUtilisateurs() {
      try {
        const response = await fetch(`${API_URL}/users`)
        const data = await response.json()
        this.autresUtilisateurs = data.filter(u => u.pseudo !== this.session.pseudo)
      } catch (err) {
        console.error('Erreur chargement utilisateurs', err)
      }
    },

    // Envoie un message dans le chat global via Socket.IO
    sendMessage() {
      const texte = this.newMessage.trim()
      if (!texte) return // Ignore les messages vides

      const heure = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
      this.socket.emit('chat message', {
        pseudo: this.session.pseudo,
        text: texte,
        time: heure
      })
      this.newMessage = '' // Réinitialise le champ de saisie après envoi
    },

    // Fait défiler la zone de messages jusqu'en bas
    scrollToBottom() {
      const area = this.$refs.messagesArea
      if (area) area.scrollTop = area.scrollHeight
    },

    // Ouvre le chat privé avec l'utilisateur correspondant au pseudo donné
    ouvrirChatPrive(pseudo) {
      this.chatPriveDestinataire = pseudo
      this.showChatPrive = true
    },

    // Déconnecte l'utilisateur : supprime la session, coupe le socket et redirige vers /login
    handleLogout() {
      localStorage.removeItem('siochat_session')
      if (this.socket) this.socket.disconnect()
      this.$router.push('/login')
    },

    // Met à jour les données locales après modification du profil (pseudo, avatar)
    onProfileUpdated({ pseudo, avatar }) {
      this.session = JSON.parse(localStorage.getItem('siochat_session') || '{}')
      this.avatar = avatar
      this.showProfil = false
    },

    // Retourne l'URL de l'avatar d'un utilisateur depuis le localStorage, ou null si absent
    getAvatar(pseudo) {
      const profil = JSON.parse(localStorage.getItem('siochat_profil_' + pseudo) || '{}')
      return profil.avatar || null
    },

    // Retourne un style de fond dégradé basé sur la première lettre du pseudo
    // (utilisé quand l'utilisateur n'a pas d'avatar)
    getAvatarStyle(pseudo) {
      if (this.getAvatar(pseudo)) return {} // Pas de style si un avatar existe déjà
      const colors = [
        'linear-gradient(135deg, #1d4ed8, #3b82f6)',
        'linear-gradient(135deg, #1e40af, #60a5fa)',
        'linear-gradient(135deg, #2563eb, #93c5fd)',
        'linear-gradient(135deg, #1e3a8a, #3b82f6)',
        'linear-gradient(135deg, #3730a3, #6366f1)',
        'linear-gradient(135deg, #0369a1, #38bdf8)',
      ]
      // Sélection déterministe de la couleur selon le code ASCII du premier caractère
      const index = (pseudo.charCodeAt(0) || 0) % colors.length
      return { background: colors[index] }
    },

    // Vérifie si le dernier message privé avec cet utilisateur n'a pas encore été lu
    // (le dernier message a été envoyé par l'autre utilisateur)
    hasUnread(pseudo) {
      const participants = [this.session.pseudo, pseudo].sort()
      const key = `siochat_mp_${participants[0]}_${participants[1]}`
      const msgs = JSON.parse(localStorage.getItem(key) || '[]')
      if (msgs.length === 0) return false
      return msgs[msgs.length - 1].from === pseudo // Non lu si le dernier message vient de l'autre
    },
  },
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,400&family=DM+Mono:wght@500&display=swap');

/* ── Variables ──────────────────────────────────────────── */
* { box-sizing: border-box; margin: 0; padding: 0; }

.chat-page {
  --c-bg:          #080e1a;
  --c-sidebar:     #0c1422;
  --c-surface:     #111827;
  --c-surface2:    #1a2436;
  --c-border:      #1f2e45;
  --c-border-soft: rgba(59,130,246,0.12);
  --c-blue:        #3b82f6;
  --c-blue-dim:    #1d4ed8;
  --c-blue-glow:   rgba(59,130,246,0.18);
  --c-text:        #cbd5e1;
  --c-text-bright: #f1f5f9;
  --c-muted:       #475569;
  --c-own-bubble:  #0f2a4a;
  --c-danger:      #ef4444;
  --radius-sm:     6px;
  --radius-md:     10px;
  --radius-lg:     14px;
  --sidebar-w:     252px;

  display: flex;
  height: 100vh;
  width: 100vw;
  font-family: 'DM Sans', sans-serif;
  background: var(--c-bg);
  color: var(--c-text);
  overflow: hidden;
}

/* ── Sidebar ────────────────────────────────────────────── */
.sidebar {
  width: var(--sidebar-w);
  min-width: var(--sidebar-w);
  background: var(--c-sidebar);
  border-right: 1px solid var(--c-border);
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  overflow-x: hidden;
}
.sidebar::-webkit-scrollbar { width: 3px; }
.sidebar::-webkit-scrollbar-thumb { background: var(--c-border); }

/* Brand */
.brand {
  padding: 22px 20px 18px;
  font-family: 'DM Mono', monospace;
  font-size: 1.2rem;
  letter-spacing: 0.06em;
  border-bottom: 1px solid var(--c-border);
  position: relative;
}
.brand::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 20px;
  width: 40px;
  height: 2px;
  background: var(--c-blue);
  border-radius: 2px;
}
.brand-prefix { color: var(--c-text-bright); }
.brand-suffix {
  color: var(--c-blue);
  text-shadow: 0 0 18px rgba(59,130,246,0.5);
}

/* Sections */
.room-section { padding: 18px 10px 8px; }

.room-label {
  font-size: 0.67rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--c-muted);
  padding: 0 8px;
  margin-bottom: 4px;
}

.room-item {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 8px 10px;
  border-radius: var(--radius-md);
  font-size: 0.88rem;
  color: var(--c-muted);
  cursor: pointer;
  transition: background 0.14s ease, color 0.14s ease, padding-left 0.14s ease;
  position: relative;
  user-select: none;
}
.room-item:hover {
  background: var(--c-surface2);
  color: var(--c-text);
  padding-left: 14px;
}
.room-item.active {
  background: linear-gradient(90deg, rgba(59,130,246,0.15), transparent);
  color: var(--c-text-bright);
  font-weight: 500;
  border-left: 2px solid var(--c-blue);
  padding-left: 8px;
}
.room-icon { font-size: 1rem; color: var(--c-muted); }

/* User items */
.room-item--user { gap: 10px; }

.user-avatar-mini {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.72rem;
  font-weight: 700;
  color: #fff;
  flex-shrink: 0;
  overflow: hidden;
  box-shadow: 0 2px 6px rgba(0,0,0,0.3);
}
.avatar-img-mini { width: 100%; height: 100%; object-fit: cover; }

.unread-dot {
  width: 8px;
  height: 8px;
  background: var(--c-blue);
  border-radius: 50%;
  margin-left: auto;
  flex-shrink: 0;
  box-shadow: 0 0 6px var(--c-blue);
  animation: pulse 2s infinite;
}
@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50%       { opacity: 0.6; transform: scale(0.85); }
}

.no-users {
  font-size: 0.78rem;
  color: var(--c-muted);
  padding: 4px 10px;
  font-style: italic;
}

/* Footer */
.sidebar-footer {
  margin-top: auto;
  padding: 10px;
  border-top: 1px solid var(--c-border);
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(0,0,0,0.2);
}

.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  padding: 7px 8px;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: background 0.14s;
  min-width: 0;
}
.user-info:hover { background: var(--c-surface2); }

.avatar {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.85rem;
  font-weight: 700;
  color: #fff;
  flex-shrink: 0;
  overflow: hidden;
  background: linear-gradient(135deg, #1d4ed8, #3b82f6);
  box-shadow: 0 2px 10px rgba(59,130,246,0.3);
  position: relative;
}
.avatar::after {
  content: '';
  position: absolute;
  bottom: 1px;
  right: 1px;
  width: 9px;
  height: 9px;
  background: #22c55e;
  border: 2px solid var(--c-sidebar);
  border-radius: 50%;
}
.avatar-img { width: 100%; height: 100%; object-fit: cover; }

.user-info-text {
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.pseudo {
  font-size: 0.88rem;
  font-weight: 600;
  color: var(--c-text-bright);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.user-status {
  font-size: 0.7rem;
  color: #22c55e;
}

.edit-icon { font-size: 0.72rem; margin-left: auto; opacity: 0.4; }

.btn-logout {
  background: none;
  border: 1px solid transparent;
  color: var(--c-muted);
  font-size: 1rem;
  cursor: pointer;
  padding: 7px 8px;
  border-radius: var(--radius-sm);
  transition: all 0.14s;
  flex-shrink: 0;
  line-height: 1;
}
.btn-logout:hover {
  background: rgba(239,68,68,0.1);
  border-color: rgba(239,68,68,0.3);
  color: var(--c-danger);
}

/* ── Chat main ──────────────────────────────────────────── */
.chat-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: var(--c-surface);
  min-width: 0;
  position: relative;
}

/* Subtle grid texture on background */
.chat-main::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(var(--c-border-soft) 1px, transparent 1px),
    linear-gradient(90deg, var(--c-border-soft) 1px, transparent 1px);
  background-size: 32px 32px;
  pointer-events: none;
  opacity: 0.4;
}

/* Header */
.chat-header {
  padding: 0 24px;
  height: 56px;
  border-bottom: 1px solid var(--c-border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(17,24,39,0.95);
  backdrop-filter: blur(8px);
  position: relative;
  z-index: 1;
  flex-shrink: 0;
}
.header-left {
  display: flex;
  align-items: center;
  gap: 6px;
}
.header-hash {
  font-size: 1.3rem;
  font-weight: 700;
  color: var(--c-blue);
  line-height: 1;
  text-shadow: 0 0 14px var(--c-blue-glow);
}
.header-channel {
  font-size: 1rem;
  font-weight: 600;
  color: var(--c-text-bright);
  letter-spacing: 0.01em;
}
.header-subtitle {
  font-size: 0.78rem;
  color: var(--c-muted);
  font-style: italic;
}

/* Messages */
.messages-area {
  flex: 1;
  overflow-y: auto;
  padding: 24px 28px 16px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  scroll-behavior: smooth;
  position: relative;
  z-index: 1;
}
.messages-area::-webkit-scrollbar { width: 4px; }
.messages-area::-webkit-scrollbar-track { background: transparent; }
.messages-area::-webkit-scrollbar-thumb {
  background: var(--c-border);
  border-radius: 4px;
}

.message {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 5px 8px;
  border-radius: var(--radius-lg);
  transition: background 0.12s;
  position: relative;
}
.message:hover { background: rgba(255,255,255,0.025); }

.message--own { flex-direction: row-reverse; }
.message--own .message-body { align-items: flex-end; }
.message--own .message-meta { flex-direction: row-reverse; }
.message--own .message-text {
  background: var(--c-own-bubble);
  border-color: rgba(59,130,246,0.2);
  border-radius: var(--radius-lg) var(--radius-sm) var(--radius-lg) var(--radius-lg);
  color: #bfdbfe;
}

.message-avatar {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.9rem;
  font-weight: 700;
  color: #fff;
  flex-shrink: 0;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0,0,0,0.35);
  transition: transform 0.15s, box-shadow 0.15s;
}
.message-avatar.clickable { cursor: pointer; }
.message-avatar.clickable:hover {
  transform: scale(1.08);
  box-shadow: 0 4px 14px rgba(59,130,246,0.35);
}

.message-body {
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-width: 62%;
}

.message-meta {
  display: flex;
  align-items: baseline;
  gap: 8px;
  padding: 0 2px;
}
.message-pseudo {
  font-size: 0.83rem;
  font-weight: 600;
  color: var(--c-blue);
  letter-spacing: 0.01em;
}
.message-pseudo.clickable {
  cursor: pointer;
  transition: color 0.12s;
}
.message-pseudo.clickable:hover { color: #93c5fd; }

.message-time {
  font-size: 0.7rem;
  color: var(--c-muted);
}

.message-text {
  background: var(--c-surface2);
  color: var(--c-text);
  padding: 9px 14px;
  border-radius: var(--radius-sm) var(--radius-lg) var(--radius-lg) var(--radius-lg);
  font-size: 0.9rem;
  line-height: 1.55;
  word-break: break-word;
  border: 1px solid var(--c-border);
  box-shadow: 0 1px 4px rgba(0,0,0,0.2);
  transition: border-color 0.12s;
}
.message:hover .message-text { border-color: rgba(59,130,246,0.15); }

/* Empty state */
.empty-chat {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding-bottom: 40px;
}
.empty-chat-icon { font-size: 2.8rem; opacity: 0.4; }
.empty-chat-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--c-text);
  opacity: 0.5;
}
.empty-chat-sub {
  font-size: 0.82rem;
  color: var(--c-muted);
}

/* Input area */
.input-area {
  padding: 14px 24px 18px;
  border-top: 1px solid var(--c-border);
  background: rgba(17,24,39,0.95);
  backdrop-filter: blur(8px);
  position: relative;
  z-index: 1;
  flex-shrink: 0;
}

.input-wrapper {
  display: flex;
  align-items: center;
  gap: 0;
  background: var(--c-surface2);
  border: 1px solid var(--c-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.input-wrapper:focus-within {
  border-color: var(--c-blue);
  box-shadow: 0 0 0 3px var(--c-blue-glow);
}

.input-message {
  flex: 1;
  background: transparent;
  border: none;
  padding: 12px 18px;
  font-family: 'DM Sans', sans-serif;
  font-size: 0.9rem;
  color: var(--c-text-bright);
  outline: none;
}
.input-message::placeholder { color: var(--c-muted); }

.btn-send {
  background: var(--c-blue);
  color: #fff;
  border: none;
  padding: 10px 18px;
  font-family: 'DM Sans', sans-serif;
  font-size: 0.88rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s, padding 0.15s;
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 4px;
  border-radius: var(--radius-md);
  white-space: nowrap;
}
.btn-send:hover { background: var(--c-blue-dim); }
.btn-send:active { transform: scale(0.97); }
.btn-send-icon {
  font-size: 1rem;
  font-weight: 700;
  line-height: 1;
}
</style>