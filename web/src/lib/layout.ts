import type { AssetRole, AssetSize, CanvasFormat, ObjectId } from '../data/catalog'
import { CANVAS_FORMATS } from '../data/catalog'
import { canonicalScale } from './scale'

export interface LayoutSlot {
  objectId: ObjectId
  role: AssetRole
  x: number
  y: number
  scale: number
  rotation: number
}

/** Простая автораскладка: фон сзади, главные ближе к центру; mode title — сдвиг вправо под текст. */
export function autoLayout(
  objectIds: ObjectId[],
  format: CanvasFormat,
  mode: 'assembled' | 'offset' | 'title' = 'assembled',
  size: AssetSize = 'L',
): LayoutSlot[] {
  const { width, height } = CANVAS_FORMATS[format]
  if (objectIds.length === 0) return []

  const mainCount = Math.max(1, Math.ceil(objectIds.length * 0.55))
  const mains = objectIds.slice(0, mainCount)
  const bgs = objectIds.slice(mainCount)

  const marginX = mode === 'title' ? width * 0.42 : width * 0.12
  const usableW = width - marginX - width * 0.08
  const baseY = height * 0.42
  // Один scale на всю сцену — относительные габариты из SVG не ломаем
  const scale = canonicalScale(size, format)

  const slots: LayoutSlot[] = []

  bgs.forEach((id, i) => {
    const t = bgs.length === 1 ? 0.35 : i / Math.max(1, bgs.length - 1)
    const spread = mode === 'offset' ? 1.15 : 0.9
    slots.push({
      objectId: id,
      role: 'background',
      x: marginX + t * usableW * spread - 40,
      y: baseY - 30 + (i % 2) * 40,
      scale,
      rotation: mode === 'offset' ? (i % 2 === 0 ? -6 : 6) : 0,
    })
  })

  mains.forEach((id, i) => {
    const t = mains.length === 1 ? 0.5 : i / Math.max(1, mains.length - 1)
    const spread = mode === 'offset' ? 1.05 : 0.75
    const xOff = mode === 'assembled' ? 20 : 0
    slots.push({
      objectId: id,
      role: 'main',
      x: marginX + t * usableW * spread + xOff,
      y: baseY + 20 + (i % 2) * 25,
      scale,
      rotation: 0,
    })
  })

  return slots
}
