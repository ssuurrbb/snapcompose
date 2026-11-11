import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { llmPlanPlugin } from './vite.llmPlugin.ts'

function deployBase(): string {
  const raw = process.env.VITE_BASE?.trim() || '/'
  if (raw === '/') return '/'
  const withLead = raw.startsWith('/') ? raw : `/${raw}`
  return withLead.endsWith('/') ? withLead : `${withLead}/`
}

// https://vite.dev/config/
export default defineConfig({
  base: deployBase(),
  plugins: [react(), llmPlanPlugin()],
})
