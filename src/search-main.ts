import { createApp } from 'vue'
import { createPinia } from 'pinia'
import SearchWindow from './views/SearchWindow.vue'
import './styles/main.css'

const app = createApp(SearchWindow)

app.use(createPinia())

app.mount('#app')
