<template>
  <div class="cp-overlay" @click.self="$emit('close')">
    <div class="cp-modal">

      <!-- Header -->
      <div class="cp-header">
        <div class="cp-header-user">
          <div class="cp-avatar" :style="getAvatarStyle(destinataire)">
            <img v-if="getAvatar(destinataire)" :src="getAvatar(destinataire)" alt="pdp" class="cp-avatar-img" />
            <span v-else>{{ destinataire[0]?.toUpperCase() }}</span>
          </div>
          <div class="cp-header-info">
            <span class="cp-header-pseudo">{{ destinataire }}</span>
            <span class="cp-header-label">Message privé</span>
          </div>
        </div>
        <button class="cp-close" @click="$emit('close')">✕</button>
      </div>

      <!-- Messages -->
      <div class="cp-messages" ref="messagesArea">
        <div
          v-for="(msg, index) in messages"
          :key="index"
          class="cp-message"
          :class="{ 'cp-message--own': msg.from === session.pseudo }"
        >
          <div class="cp-msg-avatar" :style="getAvatarStyle(msg.from)">
            <img v-if="getAvatar(msg.from)" :src="getAvatar(msg.from)" alt="pdp" class="cp-avatar-img" />
            <span v-else>{{ msg.from[0].toUpperCase() }}</span>
          </div>
          <div class="cp-msg-body">
            <div class="cp-msg-meta">
              <span class="cp-msg-pseudo">{{ msg.from }}</span>
              <span class="cp-msg-time">{{ msg.time }}</span>
            </div>
            <p class="cp-msg-text">{{ msg.text }}</p>
          </div>
        </div>

        <div v-if="messages.length === 0" class="cp-empty">
          <div class="cp-empty-icon">🔒</div>
          <p class="cp-empty-title">Conversation privée</p>
          <p class="cp-empty-sub">Début de votre échange avec <strong>{{ destinataire }}</strong></p>
        </div>
      </div>

      <!-- Input -->
      <div class="cp-input-area">
        <div class="cp-input-wrapper">
          <input
            v-model="newMessage"
            type="text"
            class="cp-input"
            :placeholder="`Message à ${destinataire}...`"
            @keydown.enter="sendMessage"
          />
          <button class="cp-btn-send" @click="sendMessage">↑</button>
        </div>
      </div>

    </div>
  </div>
</template>

<script>
export default {
  name: 'ChatPrive',

  props: {
    // Pseudo de l'utilisateur avec qui on discute (obligatoire, passé par le parent)
    destinataire: { type: String, required: true },
  },

  // Événement émis vers le parent pour fermer la modale
  emits: ['close'],

  data() {
    return {
      session: {},           // Données de l'utilisateur connecté (pseudo, etc.)
      messages: [],          // Liste des messages de la conversation privée
      newMessage: '',        // Contenu du champ de saisie
      pollingInterval: null, // Référence de l'intervalle de polling des messages
    }
  },

  created() {
    // Récupération de la session depuis le localStorage
    this.session = JSON.parse(localStorage.getItem('siochat_session') || '{}')
    this.loadMessages()
    // Polling toutes les 2 secondes pour détecter les nouveaux messages de l'autre utilisateur
    this.pollingInterval = setInterval(this.loadMessages, 2000)
  },

  beforeUnmount() {
    // Nettoyage : arrêt du polling avant destruction du composant
    clearInterval(this.pollingInterval)
  },

  methods: {
    // Génère une clé unique pour la conversation entre les deux utilisateurs.
    // Les pseudos sont triés alphabétiquement pour que la clé soit identique des deux côtés.
    getConversationKey() {
      const p = [this.session.pseudo, this.destinataire].sort()
      return `siochat_mp_${p[0]}_${p[1]}`
    },

    // Charge les messages de la conversation depuis le localStorage et défile vers le bas
    loadMessages() {
      const msgs = JSON.parse(localStorage.getItem(this.getConversationKey()) || '[]')
      this.messages = msgs
      this.$nextTick(() => this.scrollToBottom())
    },

    // Envoie un message : l'ajoute dans le localStorage puis met à jour l'affichage
    sendMessage() {
      const texte = this.newMessage.trim()
      if (!texte) return // Ignore les messages vides

      const msgs = JSON.parse(localStorage.getItem(this.getConversationKey()) || '[]')
      const heure = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })

      // Ajout du nouveau message avec l'expéditeur, le destinataire, le texte et l'heure
      msgs.push({ from: this.session.pseudo, to: this.destinataire, text: texte, time: heure })
      localStorage.setItem(this.getConversationKey(), JSON.stringify(msgs))

      this.messages = msgs
      this.newMessage = '' // Réinitialise le champ de saisie après envoi
      this.$nextTick(() => this.scrollToBottom())
    },

    // Fait défiler la zone de messages jusqu'en bas
    scrollToBottom() {
      const area = this.$refs.messagesArea
      if (area) area.scrollTop = area.scrollHeight
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
  },
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&family=DM+Mono:wght@500&display=swap');

* { box-sizing: border-box; margin: 0; padding: 0; }

/* ── Overlay ──────────────────────────────────────────────── */
.cp-overlay {
  position: fixed; inset: 0; z-index: 100;
  background: rgba(4, 8, 18, 0.75);
  backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
  animation: cp-fade-in 0.18s ease;
}
@keyframes cp-fade-in {
  from { opacity: 0; }
  to   { opacity: 1; }
}

/* ── Modal ────────────────────────────────────────────────── */
.cp-modal {
  width: 520px;
  max-width: calc(100vw - 32px);
  height: 560px;
  max-height: calc(100vh - 48px);
  background: #0d1826;
  border: 1px solid #1f2e45;
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow:
    0 24px 64px rgba(0,0,0,0.55),
    0 0 0 1px rgba(59,130,246,0.08),
    inset 0 1px 0 rgba(255,255,255,0.04);
  animation: cp-slide-up 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}
@keyframes cp-slide-up {
  from { opacity: 0; transform: translateY(20px) scale(0.97); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}

/* ── Header ───────────────────────────────────────────────── */
.cp-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #1f2e45;
  background: rgba(255,255,255,0.02);
  flex-shrink: 0;
}
.cp-header-user { display: flex; align-items: center; gap: 12px; }

.cp-avatar {
  width: 40px; height: 40px;
  border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
  font-family: 'DM Sans', sans-serif;
  font-size: 1rem; font-weight: 700; color: #fff;
  overflow: hidden; flex-shrink: 0;
  box-shadow: 0 3px 10px rgba(0,0,0,0.4);
}
.cp-avatar-img { width: 100%; height: 100%; object-fit: cover; }

.cp-header-info { display: flex; flex-direction: column; gap: 1px; }
.cp-header-pseudo {
  font-family: 'DM Sans', sans-serif;
  font-size: 0.95rem; font-weight: 600;
  color: #f1f5f9;
}
.cp-header-label {
  font-size: 0.7rem;
  color: #3b82f6;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  font-weight: 500;
}

.cp-close {
  background: none; border: none;
  color: #475569; font-size: 0.95rem;
  cursor: pointer; padding: 6px 8px;
  border-radius: 8px;
  transition: background 0.13s, color 0.13s;
  line-height: 1;
}
.cp-close:hover { background: rgba(239,68,68,0.12); color: #ef4444; }

/* ── Messages ─────────────────────────────────────────────── */
.cp-messages {
  flex: 1;
  overflow-y: auto;
  padding: 20px 20px 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  scroll-behavior: smooth;
}
.cp-messages::-webkit-scrollbar { width: 4px; }
.cp-messages::-webkit-scrollbar-track { background: transparent; }
.cp-messages::-webkit-scrollbar-thumb { background: #1f2e45; border-radius: 4px; }

.cp-message {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 4px 6px;
  border-radius: 12px;
  transition: background 0.12s;
}
.cp-message:hover { background: rgba(255,255,255,0.03); }

.cp-message--own { flex-direction: row-reverse; }
.cp-message--own .cp-msg-body { align-items: flex-end; }
.cp-message--own .cp-msg-meta { flex-direction: row-reverse; }
.cp-message--own .cp-msg-text {
  background: #0f2a4a;
  border-color: rgba(59,130,246,0.22);
  border-radius: 14px 4px 14px 14px;
  color: #bfdbfe;
}

.cp-msg-avatar {
  width: 32px; height: 32px;
  border-radius: 9px;
  display: flex; align-items: center; justify-content: center;
  font-family: 'DM Sans', sans-serif;
  font-size: 0.78rem; font-weight: 700; color: #fff;
  flex-shrink: 0; overflow: hidden;
  box-shadow: 0 2px 6px rgba(0,0,0,0.3);
}

.cp-msg-body { display: flex; flex-direction: column; gap: 3px; max-width: 70%; }
.cp-msg-meta { display: flex; align-items: baseline; gap: 7px; padding: 0 2px; }
.cp-msg-pseudo { font-size: 0.8rem; font-weight: 600; color: #3b82f6; }
.cp-msg-time   { font-size: 0.68rem; color: #475569; }

.cp-msg-text {
  background: #1a2436;
  color: #cbd5e1;
  padding: 8px 13px;
  border-radius: 4px 14px 14px 14px;
  font-family: 'DM Sans', sans-serif;
  font-size: 0.88rem; line-height: 1.5;
  word-break: break-word;
  border: 1px solid #1f2e45;
  box-shadow: 0 1px 4px rgba(0,0,0,0.2);
  transition: border-color 0.12s;
}
.cp-message:hover .cp-msg-text { border-color: rgba(59,130,246,0.15); }

/* Empty */
.cp-empty {
  flex: 1; display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  gap: 8px; padding-bottom: 20px;
}
.cp-empty-icon  { font-size: 2.2rem; opacity: 0.35; }
.cp-empty-title { font-size: 0.95rem; font-weight: 600; color: #cbd5e1; opacity: 0.5; }
.cp-empty-sub   { font-size: 0.8rem; color: #475569; }
.cp-empty-sub strong { color: #3b82f6; }

/* ── Input ────────────────────────────────────────────────── */
.cp-input-area {
  padding: 12px 16px 16px;
  border-top: 1px solid #1f2e45;
  background: rgba(0,0,0,0.2);
  flex-shrink: 0;
}
.cp-input-wrapper {
  display: flex; align-items: center;
  background: #1a2436;
  border: 1px solid #1f2e45;
  border-radius: 12px;
  overflow: hidden;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.cp-input-wrapper:focus-within {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59,130,246,0.15);
}
.cp-input {
  flex: 1; background: transparent; border: none;
  padding: 11px 16px;
  font-family: 'DM Sans', sans-serif;
  font-size: 0.88rem; color: #f1f5f9; outline: none;
}
.cp-input::placeholder { color: #475569; }

.cp-btn-send {
  background: #3b82f6; color: #fff; border: none;
  width: 36px; height: 36px; margin: 4px;
  border-radius: 9px;
  font-size: 1.1rem; font-weight: 700; line-height: 1;
  cursor: pointer; flex-shrink: 0;
  transition: background 0.15s, transform 0.1s;
  display: flex; align-items: center; justify-content: center;
}
.cp-btn-send:hover  { background: #1d4ed8; }
.cp-btn-send:active { transform: scale(0.93); }
</style>