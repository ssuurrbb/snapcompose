import type { ObjectId } from '../data/catalog'

export type LayoutMode = 'assembled' | 'offset' | 'title'

export interface MetaphorPlan {
  objectIds: ObjectId[]
  rationale: string
  mode: LayoutMode
  source: 'llm' | 'local'
}

export interface LlmSettings {
  apiKey: string
  baseUrl: string
  model: string
  enabled: boolean
}
