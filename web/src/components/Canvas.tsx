import { useRef } from 'react'
import { CANVAS_FORMATS, type CanvasFormat } from '../data/catalog'
import { planeColor } from '../data/palettes'
import { recolorSvgMarkup } from '../lib/svg'
import type { SceneItem } from '../types'

interface Props {
  format: CanvasFormat
  schemeId: string
  items: SceneItem[]
  selectedUid: string | null
  onSelect: (uid: string | null) => void
  onMove: (uid: string, x: number, y: number) => void
}

export function Canvas({ format, schemeId, items, selectedUid, onSelect, onMove }: Props) {
  const { width, height } = CANVAS_FORMATS[format]
  const bg = planeColor(schemeId)
  const drag = useRef<{ uid: string; ox: number; oy: number; startX: number; startY: number } | null>(
    null,
  )
  const svgRef = useRef<SVGSVGElement>(null)

  const clientToSvg = (clientX: number, clientY: number) => {
    const svg = svgRef.current
    if (!svg) return { x: 0, y: 0 }
    const pt = svg.createSVGPoint()
    pt.x = clientX
    pt.y = clientY
    const ctm = svg.getScreenCTM()
    if (!ctm) return { x: 0, y: 0 }
    const local = pt.matrixTransform(ctm.inverse())
    return { x: local.x, y: local.y }
  }

  return (
    <div className="canvas-wrap">
      <svg
        ref={svgRef}
        className="canvas"
        viewBox={`0 0 ${width} ${height}`}
        width="100%"
        role="img"
        aria-label="Холст композиции"
        onPointerDown={(e) => {
          if (e.target === e.currentTarget || (e.target as Element).getAttribute('data-bg')) {
            onSelect(null)
          }
        }}
      >
        <rect data-bg="1" width={width} height={height} fill={bg} />
        {items.map((item) => {
          const body = recolorSvgMarkup(item.body, schemeId)
          const selected = item.uid === selectedUid
          const cx = (item.width * item.scale) / 2
          const cy = (item.height * item.scale) / 2
          return (
            <g
              key={item.uid}
              className={selected ? 'scene-item selected' : 'scene-item'}
              transform={`translate(${item.x} ${item.y}) rotate(${item.rotation} ${cx} ${cy}) scale(${item.scale})`}
              onPointerDown={(e) => {
                e.stopPropagation()
                onSelect(item.uid)
                const p = clientToSvg(e.clientX, e.clientY)
                drag.current = {
                  uid: item.uid,
                  ox: item.x,
                  oy: item.y,
                  startX: p.x,
                  startY: p.y,
                }
                ;(e.currentTarget as Element).setPointerCapture(e.pointerId)
              }}
              onPointerMove={(e) => {
                if (!drag.current || drag.current.uid !== item.uid) return
                const p = clientToSvg(e.clientX, e.clientY)
                onMove(
                  item.uid,
                  drag.current.ox + (p.x - drag.current.startX),
                  drag.current.oy + (p.y - drag.current.startY),
                )
              }}
              onPointerUp={() => {
                drag.current = null
              }}
              dangerouslySetInnerHTML={{ __html: body }}
            />
          )
        })}
      </svg>
    </div>
  )
}
