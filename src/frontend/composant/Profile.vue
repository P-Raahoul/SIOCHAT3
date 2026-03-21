<template>
  <div class="pf-overlay" @click.self="$emit('close')">
    <div class="pf-modal">

      <!-- Header -->
      <div class="pf-header">
        <h2 class="pf-title">Mon profil</h2>
        <button class="pf-close" @click="$emit('close')">✕</button>
      </div>

      <!-- Avatar -->
      <div class="pf-avatar-section">
        <div class="pf-avatar-wrap">
          <div class="pf-avatar" :style="avatarStyle">
            <img v-if="previewUrl" :src="previewUrl" alt="pdp" class="pf-avatar-img" />
            <span v-else class="pf-avatar-initiale">{{ pseudo[0]?.toUpperCase() }}</span>
          </div>
          <label class="pf-avatar-badge" for="upload-pdp" title="Changer la photo">📷</label>
          <input
            id="upload-pdp"
            type="file"
            accept="image/*"
            style="display:none"
            @change="handleImageUpload"
          />
        </div>

        <div class="pf-avatar-info">
          <p class="pf-avatar-name">{{ pseudo || '—' }}</p>
          <div class="pf-avatar-actions">
            <label class="btn-upload" for="upload-pdp">Changer la photo</label>
            <button v-if="previewUrl" class="btn-remove" @click="removePhoto">Supprimer</button>
          </div>
        </div>
      </div>

      <div class="pf-divider"></div>

      <!-- Champ pseudo -->
      <div class="pf-field">
        <label class="pf-label" for="new-pseudo">Pseudo</label>
        <div class="pf-input-wrap">
          <input
            id="new-pseudo"
            v-model="pseudo"
            type="text"
            class="pf-input"
            placeholder="Ton pseudo"
            maxlength="24"
          />
          <span class="pf-counter">{{ pseudo.length }}/24</span>
        </div>
      </div>

      <!-- Feedback -->
      <transition name="pf-msg">
        <p v-if="successMsg" class="pf-success">✓ {{ successMsg }}</p>
        <p v-else-if="errorMsg" class="pf-error">✕ {{ errorMsg }}</p>
      </transition>

      <!-- Actions -->
      <div class="pf-actions">
        <button class="pf-btn-cancel" @click="$emit('close')">Annuler</button>
        <button class="pf-btn-save" @click="saveProfile">Enregistrer</button>
      </div>

    </div>
  </div>
</template>

<script>
export default {
  name: 'ProfilModal',
  emits: ['close', 'profile-updated'],
  data() {
    return {
      pseudo: '',
      previewUrl: null,
      avatarBase64: null,
      successMsg: '',
      errorMsg: '',
    }
  },
  computed: {
    avatarStyle() {
      if (this.previewUrl) return {}
      const colors = [
        'linear-gradient(135deg, #1d4ed8, #3b82f6)',
        'linear-gradient(135deg, #1e40af, #60a5fa)',
        'linear-gradient(135deg, #2563eb, #93c5fd)',
        'linear-gradient(135deg, #1e3a8a, #3b82f6)',
        'linear-gradient(135deg, #3730a3, #6366f1)',
        'linear-gradient(135deg, #0369a1, #38bdf8)',
      ]
      const index = (this.pseudo.charCodeAt(0) || 0) % colors.length
      return { background: colors[index] }
    },
  },
  created() { this.loadProfile() },
  methods: {
    loadProfile() {
      const session = JSON.parse(localStorage.getItem('siochat_session') || '{}')
      this.pseudo = session.pseudo || ''
      const profil = JSON.parse(localStorage.getItem('siochat_profil_' + this.pseudo) || '{}')
      if (profil.avatar) { this.previewUrl = profil.avatar; this.avatarBase64 = profil.avatar }
    },
    handleImageUpload(event) {
      const fichier = event.target.files[0]
      if (!fichier) return
      if (fichier.size > 2 * 1024 * 1024) { this.errorMsg = 'Image trop lourde (max 2 Mo).'; return }
      const reader = new FileReader()
      reader.onload = (e) => {
        this.previewUrl = e.target.result
        this.avatarBase64 = e.target.result
        this.errorMsg = ''
      }
      reader.readAsDataURL(fichier)
    },
    removePhoto() { this.previewUrl = null; this.avatarBase64 = null },
    saveProfile() {
      this.successMsg = ''; this.errorMsg = ''
      const pseudoTrimmed = this.pseudo.trim()
      if (!pseudoTrimmed) { this.errorMsg = 'Le pseudo ne peut pas être vide.'; return }
      const session = JSON.parse(localStorage.getItem('siochat_session') || '{}')
      const ancienPseudo = session.pseudo
      if (pseudoTrimmed !== ancienPseudo) {
        const comptes = JSON.parse(localStorage.getItem('siochat_users') || '[]')
        if (comptes.find(u => u.pseudo === pseudoTrimmed)) { this.errorMsg = 'Ce pseudo est déjà utilisé.'; return }
        const comptesMAJ = comptes.map(u => u.pseudo === ancienPseudo ? { ...u, pseudo: pseudoTrimmed } : u)
        localStorage.setItem('siochat_users', JSON.stringify(comptesMAJ))
      }
      session.pseudo = pseudoTrimmed
      localStorage.setItem('siochat_session', JSON.stringify(session))
      localStorage.setItem('siochat_profil_' + pseudoTrimmed, JSON.stringify({ avatar: this.avatarBase64 }))
      if (pseudoTrimmed !== ancienPseudo) localStorage.removeItem('siochat_profil_' + ancienPseudo)
      this.successMsg = 'Profil mis à jour !'
      this.$emit('profile-updated', { pseudo: pseudoTrimmed, avatar: this.avatarBase64 })
    },
  },
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&display=swap');

* { box-sizing: border-box; margin: 0; padding: 0; }

/* ── Overlay ──────────────────────────────────────────────── */
.pf-overlay {
  position: fixed; inset: 0; z-index: 200;
  background: rgba(4, 8, 18, 0.78);
  backdrop-filter: blur(7px);
  display: flex; align-items: center; justify-content: center;
  animation: pf-fade 0.18s ease;
}
@keyframes pf-fade { from { opacity: 0; } to { opacity: 1; } }

/* ── Modal ────────────────────────────────────────────────── */
.pf-modal {
  width: 420px;
  max-width: calc(100vw - 32px);
  background: #0d1826;
  border: 1px solid #1f2e45;
  border-radius: 18px;
  display: flex; flex-direction: column;
  overflow: hidden;
  box-shadow:
    0 28px 70px rgba(0,0,0,0.6),
    0 0 0 1px rgba(59,130,246,0.07),
    inset 0 1px 0 rgba(255,255,255,0.04);
  animation: pf-up 0.22s cubic-bezier(0.16, 1, 0.3, 1);
}
@keyframes pf-up {
  from { opacity: 0; transform: translateY(18px) scale(0.97); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}

/* ── Header ───────────────────────────────────────────────── */
.pf-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 18px 22px 16px;
  border-bottom: 1px solid #1f2e45;
  background: rgba(255,255,255,0.015);
}
.pf-title {
  font-family: 'DM Sans', sans-serif;
  font-size: 1rem; font-weight: 600;
  color: #f1f5f9;
  letter-spacing: 0.01em;
}
.pf-close {
  background: none; border: none;
  color: #475569; font-size: 0.9rem;
  cursor: pointer; padding: 6px 8px;
  border-radius: 8px;
  transition: background 0.13s, color 0.13s;
}
.pf-close:hover { background: rgba(239,68,68,0.12); color: #ef4444; }

/* ── Avatar section ───────────────────────────────────────── */
.pf-avatar-section {
  display: flex; align-items: center; gap: 20px;
  padding: 24px 22px 20px;
}

.pf-avatar-wrap { position: relative; flex-shrink: 0; }

.pf-avatar {
  width: 72px; height: 72px;
  border-radius: 18px;
  display: flex; align-items: center; justify-content: center;
  font-family: 'DM Sans', sans-serif;
  font-size: 1.8rem; font-weight: 700; color: #fff;
  overflow: hidden;
  box-shadow:
    0 4px 16px rgba(0,0,0,0.4),
    0 0 0 2px rgba(59,130,246,0.2);
  transition: box-shadow 0.2s;
}
.pf-avatar:hover {
  box-shadow: 0 4px 20px rgba(59,130,246,0.35), 0 0 0 2px rgba(59,130,246,0.4);
}
.pf-avatar-img { width: 100%; height: 100%; object-fit: cover; }

.pf-avatar-badge {
  position: absolute; bottom: -6px; right: -6px;
  width: 26px; height: 26px;
  background: #1d4ed8;
  border: 2px solid #0d1826;
  border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  font-size: 0.72rem; cursor: pointer;
  transition: background 0.14s, transform 0.14s;
}
.pf-avatar-badge:hover { background: #3b82f6; transform: scale(1.1); }

.pf-avatar-info { display: flex; flex-direction: column; gap: 8px; }
.pf-avatar-name {
  font-family: 'DM Sans', sans-serif;
  font-size: 1.05rem; font-weight: 600; color: #f1f5f9;
}
.pf-avatar-actions { display: flex; align-items: center; gap: 10px; }

.btn-upload {
  font-family: 'DM Sans', sans-serif;
  font-size: 0.8rem; font-weight: 500;
  color: #3b82f6;
  cursor: pointer;
  padding: 5px 12px;
  border-radius: 8px;
  border: 1px solid rgba(59,130,246,0.3);
  background: rgba(59,130,246,0.08);
  transition: background 0.14s, border-color 0.14s;
  white-space: nowrap;
}
.btn-upload:hover { background: rgba(59,130,246,0.16); border-color: rgba(59,130,246,0.5); }

.btn-remove {
  font-family: 'DM Sans', sans-serif;
  font-size: 0.8rem; font-weight: 500;
  color: #ef4444;
  cursor: pointer; background: none;
  border: 1px solid rgba(239,68,68,0.25);
  padding: 5px 12px; border-radius: 8px;
  transition: background 0.14s, border-color 0.14s;
}
.btn-remove:hover { background: rgba(239,68,68,0.1); border-color: rgba(239,68,68,0.4); }

/* ── Divider ──────────────────────────────────────────────── */
.pf-divider {
  height: 1px;
  background: linear-gradient(90deg, transparent, #1f2e45 20%, #1f2e45 80%, transparent);
  margin: 0 22px;
}

/* ── Field ────────────────────────────────────────────────── */
.pf-field { padding: 20px 22px 0; display: flex; flex-direction: column; gap: 8px; }
.pf-label {
  font-family: 'DM Sans', sans-serif;
  font-size: 0.75rem; font-weight: 600;
  text-transform: uppercase; letter-spacing: 0.1em;
  color: #475569;
}
.pf-input-wrap {
  position: relative;
  display: flex; align-items: center;
  background: #1a2436;
  border: 1px solid #1f2e45;
  border-radius: 10px;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.pf-input-wrap:focus-within {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59,130,246,0.15);
}
.pf-input {
  flex: 1; background: transparent; border: none;
  padding: 11px 16px;
  font-family: 'DM Sans', sans-serif;
  font-size: 0.9rem; color: #f1f5f9; outline: none;
}
.pf-input::placeholder { color: #334155; }
.pf-counter {
  font-size: 0.72rem; color: #334155;
  padding-right: 12px; flex-shrink: 0;
  font-family: 'DM Sans', sans-serif;
}

/* ── Feedback ─────────────────────────────────────────────── */
.pf-success, .pf-error {
  margin: 14px 22px 0;
  font-family: 'DM Sans', sans-serif;
  font-size: 0.82rem; font-weight: 500;
  padding: 9px 14px; border-radius: 9px;
}
.pf-success {
  color: #4ade80;
  background: rgba(74,222,128,0.08);
  border: 1px solid rgba(74,222,128,0.2);
}
.pf-error {
  color: #f87171;
  background: rgba(248,113,113,0.08);
  border: 1px solid rgba(248,113,113,0.2);
}
.pf-msg-enter-active, .pf-msg-leave-active { transition: opacity 0.2s, transform 0.2s; }
.pf-msg-enter-from, .pf-msg-leave-to { opacity: 0; transform: translateY(-4px); }

/* ── Actions ──────────────────────────────────────────────── */
.pf-actions {
  display: flex; justify-content: flex-end; gap: 10px;
  padding: 20px 22px 22px;
}

.pf-btn-cancel {
  font-family: 'DM Sans', sans-serif;
  font-size: 0.88rem; font-weight: 500;
  background: none;
  border: 1px solid #1f2e45;
  color: #64748b;
  padding: 9px 20px; border-radius: 10px;
  cursor: pointer;
  transition: background 0.14s, border-color 0.14s, color 0.14s;
}
.pf-btn-cancel:hover { background: rgba(255,255,255,0.04); border-color: #2d3f58; color: #94a3b8; }

.pf-btn-save {
  font-family: 'DM Sans', sans-serif;
  font-size: 0.88rem; font-weight: 600;
  background: #3b82f6;
  border: none; color: #fff;
  padding: 9px 24px; border-radius: 10px;
  cursor: pointer;
  transition: background 0.14s, transform 0.1s, box-shadow 0.14s;
  box-shadow: 0 2px 10px rgba(59,130,246,0.3);
}
.pf-btn-save:hover { background: #1d4ed8; box-shadow: 0 4px 16px rgba(59,130,246,0.4); }
.pf-btn-save:active { transform: scale(0.97); }
</style>