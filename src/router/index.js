import { createRouter, createWebHistory } from 'vue-router'
import LoginPage from '@/frontend/pages/Login.vue'
import SigninPage from '@/frontend/pages/SignIn.vue'
import ChatGlobale from '@/frontend/pages/ChatGlobale.vue'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: LoginPage,
  },
  {
    path: '/signin',
    name: 'Signin',
    component: SigninPage,
  },
  {
    path: '/',
    redirect: '/login',

  },
  {
    path: '/chat',
    name: 'ChatGlobale',
    component: ChatGlobale
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router