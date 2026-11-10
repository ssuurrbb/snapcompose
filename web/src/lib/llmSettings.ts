import type { LlmSettings } from './metaphorTypes'

const STORAGE_KEY = 'snapcompose.llmSettings'

const DEFAULTS: LlmSettings = {
  apiKey: '',
  baseUrl: 'https://api.openai.com/v1',
  model: 'gpt-4o-mini',
  enabled: true,
}

function envDefaults(): Partial<LlmSettings> {
  return {
    apiKey: import.meta.env.VITE_LLM_API_KEY?.trim() || '',
    baseUrl: import.meta.env.VITE_LLM_BASE_URL?.trim() || DEFAULTS.baseUrl,
    model: import.meta.env.VITE_LLM_MODEL?.trim() || DEFAULTS.model,
  }
}

export function loadLlmSettings(): LlmSettings {
  const fromEnv = envDefaults()
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...DEFAULTS, ...fromEnv, apiKey: fromEnv.apiKey || DEFAULTS.apiKey }
    const parsed = JSON.parse(raw) as Partial<LlmSettings>
    return {
      apiKey: typeof parsed.apiKey === 'string' ? parsed.apiKey : fromEnv.apiKey || '',
      baseUrl:
        typeof parsed.baseUrl === 'string' && parsed.baseUrl
          ? parsed.baseUrl
          : fromEnv.baseUrl || DEFAULTS.baseUrl,
      model:
        typeof parsed.model === 'string' && parsed.model
          ? parsed.model
          : fromEnv.model || DEFAULTS.model,
      enabled: typeof parsed.enabled === 'boolean' ? parsed.enabled : true,
    }
  } catch {
    return { ...DEFAULTS, ...fromEnv }
  }
}

export function saveLlmSettings(settings: LlmSettings) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
}
