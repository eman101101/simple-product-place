import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import './style.css'
import App from './App.vue'
import Home from './components/Home.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { 
      path: '/home',
      name: 'Home',
      component: Home
    }
  ]
})

const app = createApp(App)
app.use(router)
app.mount('#app')