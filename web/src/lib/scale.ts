import type { AssetSize, CanvasFormat } from '../data/catalog'

/**
 * Единый масштаб для всех объектов на холсте.
 * Габариты задаёт только пара Size (L/S) + формат кадра —
 * нельзя масштабировать объекты по отдельности (пропорции «как в библиотеке»).
 */
export function canonicalScale(size: AssetSize, format: CanvasFormat): number {
  // L-ассеты крупнее в исходнике; на холст кладём единый fit.
  const byFormat: Record<CanvasFormat, { L: number; S: number }> = {
    square: { L: 0.42, S: 0.72 },
    horizontal: { L: 0.4, S: 0.7 },
    vertical: { L: 0.36, S: 0.62 },
  }
  return byFormat[format][size]
}
