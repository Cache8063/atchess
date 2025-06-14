import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createAtdashAuth } from '@atdash/auth' // Will be @cache8063/atdash-auth when published
import App from './App.vue'
import router from './router'
import './style.css'

const app = createApp(App)
const pinia = createPinia()

// Configure authentication
app.use(createAtdashAuth({
  appId: 'chess',
  appName: 'AT Chess',
  debug: true
}))

app.use(pinia)
app.use(router)

app.mount('#app')