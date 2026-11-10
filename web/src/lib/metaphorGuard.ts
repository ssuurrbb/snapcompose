import { CATALOG, type ObjectId } from '../data/catalog'
import type { LayoutMode, MetaphorPlan } from './metaphorTypes'

const VALID_IDS = new Set<string>(CATALOG.map((o) => o.id))
const VALID_MODES = new Set<LayoutMode>(['assembled', 'offset', 'title'])

export function sanitizePlan(
  raw: unknown,
  source: MetaphorPlan['source'],
  fallbackRationale?: string,
): MetaphorPlan | null {
  if (!raw || typeof raw !== 'object') return null
  const data = raw as Record<string, unknown>

  const idsRaw = Array.isArray(data.objectIds) ? data.objectIds : []
  const objectIds = [
    ...new Set(
      idsRaw
        .filter((id): id is string => typeof id === 'string')
        .map((id) => id.trim().toLowerCase())
        .filter((id): id is ObjectId => VALID_IDS.has(id)),
    ),
  ]

  if (objectIds.length < 2) return null

  const mode =
    typeof data.mode === 'string' && VALID_MODES.has(data.mode as LayoutMode)
      ? (data.mode as LayoutMode)
      : 'assembled'

  const rationale =
    typeof data.rationale === 'string' && data.rationale.trim()
      ? data.rationale.trim()
      : fallbackRationale ??
        `Подобраны: ${objectIds
          .map((id) => CATALOG.find((o) => o.id === id)?.nameRu ?? id)
          .join(', ')}`

  return {
    objectIds: objectIds.slice(0, 5),
    mode,
    rationale,
    source,
  }
}
