import type { AssetRole, AssetSize, CanvasFormat, ObjectId } from './data/catalog'

export interface SceneItem {
  uid: string
  objectId: ObjectId
  role: AssetRole
  size: AssetSize
  x: number
  y: number
  scale: number
  rotation: number
  /** Intrinsic SVG size (viewBox), for transform origin */
  width: number
  height: number
  /** Inner SVG markup (without outer <svg>), already role/size specific; recolored on render */
  body: string
}

export interface CompositionState {
  format: CanvasFormat
  schemeId: string
  size: AssetSize
  items: SceneItem[]
  selectedUid: string | null
}
