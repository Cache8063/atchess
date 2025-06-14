import { createRouter, createWebHistory } from 'vue-router'
import Home from './views/Home.vue'
import Game from './views/Game.vue'
import Analysis from './views/Analysis.vue'
import Profile from './views/Profile.vue'
import Login from './views/Login.vue'
import { useUserStore } from './stores/user'

const routes = [
  {
    path: '/',
    name: 'home',
    component: Home
  },
  {
    path: '/game/:id?',
    name: 'game',
    component: Game
  },
  {
    path: '/analysis',
    name: 'analysis',
    component: Analysis
  },
  {
    path: '/profile/:handle?',
    name: 'profile',
    component: Profile,
    meta: { requiresAuth: true }
  },
  {
    path: '/auth/login',
    name: 'login',
    component: Login
  },
  {
    path: '/auth/callback',
    name: 'auth-callback',
    component: () => import('./views/AuthCallback.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const userStore = useUserStore()
  
  if (to.meta.requiresAuth && !userStore.isAuthenticated) {
    next('/auth/login')
  } else {
    next()
  }
})

export default router