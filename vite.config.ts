import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // На GitHub Pages сайт лежит не в корне домена, а в папке с именем репозитория.
  // Назовёшь репозиторий иначе — поменяй строку ниже, иначе стили и скрипты
  // будут искаться не там и страница откроется пустой.
  base: '/rok-gruppa/',
})
