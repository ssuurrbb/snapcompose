export type ColorRole = 'plane' | 'object'

export interface PaletteColor {
  hex: string
  role: ColorRole
  note?: string
}

export interface ColorScheme {
  id: string
  name: string
  colors: PaletteColor[]
}

/** Исходные SVG нарисованы в scheme-1 — от неё строим карту перекраски. */
export const COLOR_SCHEMES: ColorScheme[] = [
  {
    id: 'scheme-1',
    name: 'Сиреневая',
    colors: [
      { hex: '#D7CDF5', role: 'plane', note: 'плоскость фона' },
      { hex: '#F9ECB0', role: 'object' },
      { hex: '#AA9BF0', role: 'object' },
      { hex: '#F9A3AA', role: 'object' },
      { hex: '#7864D7', role: 'object' },
      { hex: '#FFE3E1', role: 'object' },
      { hex: '#181817', role: 'object', note: 'контур' },
      { hex: '#FFFFFF', role: 'object', note: 'белый' },
    ],
  },
  {
    id: 'scheme-2',
    name: 'Персиковая',
    colors: [
      { hex: '#FDD7B9', role: 'plane', note: 'плоскость фона' },
      { hex: '#F9ECB0', role: 'object' },
      { hex: '#FAC896', role: 'object' },
      { hex: '#80DADA', role: 'object' },
      { hex: '#D27532', role: 'object' },
      { hex: '#BEEBEB', role: 'object' },
      { hex: '#181817', role: 'object', note: 'контур' },
      { hex: '#FFFFFF', role: 'object', note: 'белый' },
    ],
  },
  {
    id: 'scheme-3',
    name: 'Бирюзово-розовая',
    colors: [
      { hex: '#BEEBEB', role: 'plane', note: 'плоскость фона' },
      { hex: '#FFD4F2', role: 'object' },
      { hex: '#80DADA', role: 'object' },
      { hex: '#6D7BFC', role: 'object' },
      { hex: '#5ABEBE', role: 'object' },
      { hex: '#B6C6FE', role: 'object' },
      { hex: '#181817', role: 'object', note: 'контур' },
      { hex: '#FFFFFF', role: 'object', note: 'белый' },
    ],
  },
]

export const BASE_SCHEME_ID = 'scheme-1'

export function getScheme(id: string): ColorScheme {
  return COLOR_SCHEMES.find((s) => s.id === id) ?? COLOR_SCHEMES[0]
}

export function planeColor(schemeId: string): string {
  const scheme = getScheme(schemeId)
  return scheme.colors.find((c) => c.role === 'plane')?.hex ?? '#D7CDF5'
}

/** Карта: цвет из базовой схемы → цвет целевой (по индексу). */
export function buildRecolorMap(targetSchemeId: string): Map<string, string> {
  const base = getScheme(BASE_SCHEME_ID)
  const target = getScheme(targetSchemeId)
  const map = new Map<string, string>()
  const n = Math.min(base.colors.length, target.colors.length)
  for (let i = 0; i < n; i++) {
    map.set(base.colors[i].hex.toUpperCase(), target.colors[i].hex.toUpperCase())
  }
  return map
}
