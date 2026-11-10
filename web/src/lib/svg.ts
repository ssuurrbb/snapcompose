import { buildRecolorMap } from '../data/palettes'

const svgCache = new Map<string, string>()

export async function loadSvg(url: string): Promise<string> {
  const cached = svgCache.get(url)
  if (cached) return cached
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Не удалось загрузить ${url}`)
  const text = await res.text()
  svgCache.set(url, text)
  return text
}

export function extractInnerSvg(svgText: string): {
  viewBox: string
  width: number
  height: number
  body: string
} {
  const doc = new DOMParser().parseFromString(svgText, 'image/svg+xml')
  const svg = doc.querySelector('svg')
  if (!svg) throw new Error('Некорректный SVG')

  const viewBox =
    svg.getAttribute('viewBox') ||
    `0 0 ${svg.getAttribute('width') || 100} ${svg.getAttribute('height') || 100}`
  const [, , vbW, vbH] = viewBox.split(/[\s,]+/).map(Number)
  const width = Number(svg.getAttribute('width')) || vbW || 100
  const height = Number(svg.getAttribute('height')) || vbH || 100
  const body = svg.innerHTML
  return { viewBox, width, height, body }
}

function normalizeHex(value: string): string | null {
  const v = value.trim()
  if (/^#[0-9a-fA-F]{6}$/.test(v)) return v.toUpperCase()
  if (/^#[0-9a-fA-F]{3}$/.test(v)) {
    const r = v[1],
      g = v[2],
      b = v[3]
    return `#${r}${r}${g}${g}${b}${b}`.toUpperCase()
  }
  return null
}

export function recolorSvgMarkup(markup: string, targetSchemeId: string): string {
  if (targetSchemeId === 'scheme-1') return markup
  const map = buildRecolorMap(targetSchemeId)

  return markup.replace(
    /(fill|stroke)="(#[0-9a-fA-F]{3,6})"/gi,
    (full, attr: string, color: string) => {
      const hex = normalizeHex(color)
      if (!hex) return full
      const next = map.get(hex)
      return next ? `${attr}="${next}"` : full
    },
  )
}

export interface SceneItemExport {
  id: string
  x: number
  y: number
  scale: number
  rotation: number
  markup: string
  width: number
  height: number
}

export function buildExportSvg(opts: {
  width: number
  height: number
  background: string
  items: SceneItemExport[]
}): string {
  const layers = opts.items
    .map((item) => {
      const cx = item.width / 2
      const cy = item.height / 2
      const transform = `translate(${item.x} ${item.y}) rotate(${item.rotation} ${cx * item.scale} ${cy * item.scale}) scale(${item.scale})`
      return `<g data-id="${item.id}" transform="${transform}">${item.markup}</g>`
    })
    .join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${opts.width}" height="${opts.height}" viewBox="0 0 ${opts.width} ${opts.height}" fill="none">
  <rect width="${opts.width}" height="${opts.height}" fill="${opts.background}"/>
${layers}
</svg>`
}

export function downloadText(filename: string, content: string, mime = 'image/svg+xml') {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
