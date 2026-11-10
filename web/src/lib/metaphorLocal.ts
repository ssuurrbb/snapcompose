import { CATALOG, type ObjectId } from '../data/catalog'
import type { MetaphorPlan } from './metaphorTypes'

/** Локальный маппер метафора → объекты каталога (fallback без API). */
export function planFromMetaphorLocal(text: string): MetaphorPlan {
  const q = text.toLowerCase().trim()
  if (!q) {
    return {
      objectIds: ['lamp', 'book', 'phone'],
      rationale: 'Пустой ввод — дефолтный набор',
      mode: 'assembled',
      source: 'local',
    }
  }

  const scores = new Map<ObjectId, number>()
  for (const obj of CATALOG) {
    let score = 0
    for (const tag of obj.tags) {
      if (q.includes(tag)) score += 3
    }
    if (q.includes(obj.nameRu.toLowerCase()) || q.includes(obj.id)) score += 5
    if (/идея|креатив|инсайт|озарение|стартап/.test(q) && obj.id === 'lamp') score += 2
    if (/учёб|образован|курс|знани/.test(q) && (obj.id === 'book' || obj.id === 'pen')) score += 2
    if (/деньг|финанс|оплат|монет|бюджет/.test(q) && (obj.id === 'coin' || obj.id === 'wallet'))
      score += 2
    if (/музык|подкаст|аудио|звук/.test(q) && obj.id === 'headphones') score += 2
    if (/приложен|мобил|ux|интерфейс|экран/.test(q) && (obj.id === 'phone' || obj.id === 'puzzle'))
      score += 2
    if (/документ|офис|файл|папк/.test(q) && (obj.id === 'folder' || obj.id === 'pen')) score += 2
    if (/красот|декор|жизн|баланс/.test(q) && obj.id === 'vase') score += 2
    if (/решен|задач|сборк|продукт/.test(q) && obj.id === 'puzzle') score += 2
    if (score > 0) scores.set(obj.id, score)
  }

  const ranked = [...scores.entries()].sort((a, b) => b[1] - a[1]).map(([id]) => id)
  let objectIds = ranked.slice(0, 5)

  if (objectIds.length < 3) {
    const fallback: ObjectId[] = ['lamp', 'book', 'phone', 'headphones', 'puzzle']
    for (const id of fallback) {
      if (!objectIds.includes(id)) objectIds.push(id)
      if (objectIds.length >= 4) break
    }
  }

  const mode: MetaphorPlan['mode'] = /заголов|баннер|облож|title|hero/.test(q)
    ? 'title'
    : /смещ|разнес|offset/.test(q)
      ? 'offset'
      : 'assembled'

  const names = objectIds
    .map((id) => CATALOG.find((o) => o.id === id)?.nameRu ?? id)
    .join(', ')

  return {
    objectIds,
    rationale: `Локальный подбор: ${names}`,
    mode,
    source: 'local',
  }
}
