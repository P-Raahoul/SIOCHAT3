<template>
  <div class="signin-page">

    <!-- Panneau gauche décoratif -->
    <div class="signin-deco">
      <div class="deco-content">
        <div class="deco-brand">
          <span class="deco-brand-prefix">SIO</span><span class="deco-brand-suffix">CHAT</span>
        </div>
        <p class="deco-tagline">Rejoins la conversation,<br/>crée ton compte en quelques secondes.</p>
        <div class="deco-dots">
          <span></span><span></span><span></span>
        </div>
      </div>
      <div class="deco-grid"></div>
    </div>

    <!-- Panneau droit : formulaire -->
    <div class="signin-panel">
      <div class="signin-box">

        <div class="signin-top">
          <h1 class="signin-title">Créer un compte ✨</h1>
          <p class="signin-sub">Rejoins SIOCHAT et commence à discuter</p>
        </div>

        <div class="signin-form">
          <div class="field">
            <label for="pseudo">Pseudo</label>
            <div class="input-wrap" :class="{ focused: focusPseudo }">
              <span class="input-icon">@</span>
              <input
                id="pseudo"
                v-model="form.pseudo"
                type="text"
                placeholder="Choisis un pseudo"
                autocomplete="username"
                @focus="focusPseudo = true"
                @blur="focusPseudo = false"
              />
            </div>
          </div>

          <div class="field">
            <label for="email">E-mail</label>
            <div class="input-wrap" :class="{ focused: focusEmail }">
              <span class="input-icon">✉</span>
              <input
                id="email"
                v-model="form.email"
                type="email"
                placeholder="ton@email.com"
                autocomplete="email"
                @focus="focusEmail = true"
                @blur="focusEmail = false"
              />
            </div>
          </div>

          <div class="field">
            <label for="password">Mot de passe</label>
            <div class="input-wrap" :class="{ focused: focusPassword }">
              <span class="input-icon">🔑</span>
              <input
                id="password"
                v-model="form.password"
                :type="showPassword ? 'text' : 'password'"
                placeholder="Choisis un mot de passe"
                autocomplete="new-password"
                @focus="focusPassword = true"
                @blur="focusPassword = false"
              />
              <button class="input-eye" @click="showPassword = !showPassword" type="button">
                {{ showPassword ? '🙈' : '👁' }}
              </button>
            </div>
            <!-- Barre de force du mot de passe -->
            <div class="password-strength" v-if="form.password.length > 0">
              <div
                v-for="i in 4" :key="i"
                class="strength-bar"
                :class="{ active: i <= passwordStrength }"
                :style="i <= passwordStrength ? { background: strengthColor } : {}"
              ></div>
              <span class="strength-label" :style="{ color: strengthColor }">{{ strengthLabel }}</span>
            </div>
          </div>

          <transition name="msg">
            <p v-if="error" class="error-msg">✕ {{ error }}</p>
          </transition>

          <button class="btn-submit" @click="handleSignin" :class="{ loading: isLoading }">
            <span v-if="!isLoading">Créer mon compte</span>
            <span v-else class="spinner"></span>
          </button>
        </div>

        <div class="signin-footer">
          <p class="redirect">
            Déjà un compte ?
            <router-link to="/login">Connecte-toi</router-link>
          </p>
        </div>

      </div>
    </div>

  </div>
</template>

<script>
const API_URL = window.location.origin

export default {
  name: 'SigninPage',
  data() {
    return {
      form: { pseudo: '', email: '', password: '' },
      error: '',
      isLoading: false,
      showPassword: false,
      focusPseudo: false,
      focusEmail: false,
      focusPassword: false,
    }
  },
  computed: {
    passwordStrength() {
      const p = this.form.password
      if (p.length === 0) return 0
      let score = 0
      if (p.length >= 6)  score++
      if (p.length >= 10) score++
      if (/[A-Z]/.test(p) || /[0-9]/.test(p)) score++
      if (/[^A-Za-z0-9]/.test(p)) score++
      return score
    },
    strengthColor() {
      return ['', '#ef4444', '#f97316', '#eab308', '#22c55e'][this.passwordStrength]
    },
    strengthLabel() {
      return ['', 'Faible', 'Moyen', 'Bon', 'Fort'][this.passwordStrength]
    },
  },
  methods: {
    async handleSignin() {
      this.error = ''
      if (!this.form.pseudo || !this.form.email || !this.form.password) {
        this.error = 'Veuillez remplir tous les champs.'
        return
      }
      this.isLoading = true
      try {
        const response = await fetch(`${API_URL}/users`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pseudo: this.form.pseudo })
        })
        const data = await response.json()
        if (!response.ok) {
          this.error = data.error
          this.isLoading = false
          return
        }
        localStorage.setItem('siochat_session', JSON.stringify({
          pseudo: data.pseudo,
        }))
        this.$router.push('/chat')
      } catch (err) {
        this.error = 'Impossible de contacter le serveur.'
        this.isLoading = false
      }
    }
  },
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&family=DM+Mono:wght@500&display=swap');

* { box-sizing: border-box; margin: 0; padding: 0; }

/* ── Page ─────────────────────────────────────────────────── */
.signin-page {
  display: flex;
  min-height: 100vh;
  font-family: 'DM Sans', sans-serif;
  background: #080e1a;
  color: #cbd5e1;
}

/* ── Déco gauche ──────────────────────────────────────────── */
.signin-deco {
  flex: 1;
  position: relative;
  background: #0c1422;
  border-right: 1px solid #1f2e45;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}
.deco-grid {
  position: absolute; inset: 0;
  background-image:
    linear-gradient(rgba(59,130,246,0.07) 1px, transparent 1px),
    linear-gradient(90deg, rgba(59,130,246,0.07) 1px, transparent 1px);
  background-size: 40px 40px;
}
.signin-deco::after {
  content: '';
  position: absolute;
  width: 420px; height: 420px;
  background: radial-gradient(circle, rgba(59,130,246,0.13) 0%, transparent 70%);
  pointer-events: none;
}
.deco-content {
  position: relative; z-index: 1;
  display: flex; flex-direction: column;
  align-items: center; gap: 24px;
  text-align: center;
}
.deco-brand {
  font-family: 'DM Mono', monospace;
  font-size: 3rem; letter-spacing: 0.08em;
}
.deco-brand-prefix { color: #f1f5f9; }
.deco-brand-suffix { color: #3b82f6; text-shadow: 0 0 32px rgba(59,130,246,0.6); }
.deco-tagline { font-size: 1rem; color: #475569; line-height: 1.6; max-width: 240px; }
.deco-dots { display: flex; gap: 8px; margin-top: 8px; }
.deco-dots span { width: 8px; height: 8px; border-radius: 50%; background: #1f2e45; }
.deco-dots span:first-child { background: #3b82f6; }
.deco-dots span:nth-child(2) { background: #1d4ed8; }

/* ── Panneau droit ────────────────────────────────────────── */
.signin-panel {
  width: 440px;
  min-width: 360px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 32px;
  background: #080e1a;
}
.signin-box {
  width: 100%;
  display: flex; flex-direction: column;
  gap: 28px;
  animation: fade-up 0.3s ease both;
}
@keyframes fade-up {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}

.signin-top { display: flex; flex-direction: column; gap: 6px; }
.signin-title { font-size: 1.7rem; font-weight: 600; color: #f1f5f9; letter-spacing: -0.01em; }
.signin-sub { font-size: 0.88rem; color: #475569; }

/* ── Form ─────────────────────────────────────────────────── */
.signin-form { display: flex; flex-direction: column; gap: 16px; }

.field { display: flex; flex-direction: column; gap: 7px; }
.field label {
  font-size: 0.78rem; font-weight: 600;
  text-transform: uppercase; letter-spacing: 0.1em;
  color: #475569;
}

.input-wrap {
  display: flex; align-items: center;
  background: #111827;
  border: 1px solid #1f2e45;
  border-radius: 11px;
  overflow: hidden;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.input-wrap.focused {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59,130,246,0.15);
}
.input-icon {
  padding: 0 4px 0 14px;
  font-size: 0.85rem; color: #334155;
  flex-shrink: 0;
  font-style: normal;
  font-family: 'DM Mono', monospace;
}
.input-wrap input {
  flex: 1; background: transparent; border: none;
  padding: 12px 14px;
  font-family: 'DM Sans', sans-serif;
  font-size: 0.92rem; color: #f1f5f9; outline: none;
}
.input-wrap input::placeholder { color: #334155; }
.input-eye {
  background: none; border: none;
  padding: 0 14px; cursor: pointer;
  font-size: 0.9rem; color: #334155;
  transition: color 0.13s;
}
.input-eye:hover { color: #64748b; }

/* ── Barre de force ───────────────────────────────────────── */
.password-strength {
  display: flex; align-items: center; gap: 5px;
  padding: 2px 2px 0;
}
.strength-bar {
  flex: 1; height: 3px;
  background: #1f2e45;
  border-radius: 2px;
  transition: background 0.25s;
}
.strength-label {
  font-size: 0.72rem; font-weight: 600;
  min-width: 36px; text-align: right;
  transition: color 0.25s;
}

/* ── Erreur ───────────────────────────────────────────────── */
.error-msg {
  font-size: 0.82rem; font-weight: 500;
  color: #f87171;
  background: rgba(248,113,113,0.08);
  border: 1px solid rgba(248,113,113,0.2);
  padding: 9px 14px; border-radius: 9px;
}
.msg-enter-active, .msg-leave-active { transition: opacity 0.2s, transform 0.2s; }
.msg-enter-from, .msg-leave-to { opacity: 0; transform: translateY(-4px); }

/* ── Bouton ───────────────────────────────────────────────── */
.btn-submit {
  background: #3b82f6; color: #fff; border: none;
  padding: 13px 24px; border-radius: 11px;
  font-family: 'DM Sans', sans-serif;
  font-size: 0.95rem; font-weight: 600;
  cursor: pointer; width: 100%; margin-top: 4px;
  display: flex; align-items: center; justify-content: center;
  transition: background 0.15s, transform 0.1s, box-shadow 0.15s;
  box-shadow: 0 3px 14px rgba(59,130,246,0.3);
  min-height: 46px;
}
.btn-submit:hover { background: #1d4ed8; box-shadow: 0 4px 20px rgba(59,130,246,0.42); }
.btn-submit:active { transform: scale(0.98); }
.btn-submit.loading { opacity: 0.8; cursor: not-allowed; }

.spinner {
  width: 18px; height: 18px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* ── Footer ───────────────────────────────────────────────── */
.signin-footer { text-align: center; }
.redirect { font-size: 0.85rem; color: #475569; }
.redirect a { color: #3b82f6; font-weight: 600; text-decoration: none; transition: color 0.13s; }
.redirect a:hover { color: #93c5fd; }

/* ── Responsive ───────────────────────────────────────────── */
@media (max-width: 700px) {
  .signin-deco { display: none; }
  .signin-panel { width: 100%; padding: 32px 24px; }
}
</style>