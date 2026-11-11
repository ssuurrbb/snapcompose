import { loadLlmSettings } from './llmSettings'
import { publicUrl } from './publicUrl'
import { sanitizePlan } from './metaphorGuard'
import { planFromMetaphorLocal } from './metaphorLocal'
import type { LlmSettings, MetaphorPlan } from './metaphorTypes'

export type { MetaphorPlan, LlmSettings } from './metaphorTypes'
export { planFromMetaphorLocal } from './metaphorLocal'
export { loadLlmSettings, saveLlmSettings } from './llmSettings'

async function planFromLlm(text: string, settings: LlmSettings): Promise<MetaphorPlan> {
  const res = await fetch(publicUrl('/api/llm/plan'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      metaphor: text,
      apiKey: settings.apiKey || undefined,
      baseUrl: settings.baseUrl || undefined,
      model: settings.model || undefined,
    }),
  })

  const payload = (await res.json().catch(() => ({}))) as {
    error?: string
    plan?: unknown
  }

  if (!res.ok) {
    throw new Error(payload.error || `LLM HTTP ${res.status}`)
  }

  const plan = sanitizePlan(payload.plan, 'llm')
  if (!plan) throw new Error('LLM вернул план вне каталога')
  return plan
}

/**
 * Сценарий 1: метафора → план композиции.
 * Сначала LLM (если включён и доступен), иначе локальная эвристика.
 * Guardrail: в сцену попадают только id из CATALOG.
 */
export async function planFromMetaphor(text: string): Promise<MetaphorPlan> {
  const settings = loadLlmSettings()
  const local = planFromMetaphorLocal(text)

  if (!settings.enabled) return local

  try {
    const llm = await planFromLlm(text, settings)
    return {
      ...llm,
      rationale: `LLM: ${llm.rationale}`,
    }
  } catch (err) {
    const reason = err instanceof Error ? err.message : 'LLM недоступен'
    return {
      ...local,
      rationale: `${local.rationale} (fallback: ${reason})`,
    }
  }
}
