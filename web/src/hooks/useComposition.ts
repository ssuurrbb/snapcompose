import { useCallback, useState } from 'react'
import {
  assetUrl,
  CATALOG,
  type AssetRole,
  type AssetSize,
  type CanvasFormat,
  type ObjectId,
  findObjectsByQuery,
} from '../data/catalog'
import { autoLayout } from '../lib/layout'
import { planFromMetaphor } from '../lib/metaphor'
import { canonicalScale } from '../lib/scale'
import { extractInnerSvg, loadSvg } from '../lib/svg'
import type { CompositionState, SceneItem } from '../types'

function uid() {
  return `item-${Math.random().toString(36).slice(2, 9)}`
}

async function makeItem(
  objectId: ObjectId,
  opts: {
    role: AssetRole
    size: AssetSize
    x: number
    y: number
    scale: number
    rotation: number
  },
): Promise<SceneItem> {
  const text = await loadSvg(assetUrl(objectId, opts.size, opts.role))
  const { width, height, body } = extractInnerSvg(text)
  return {
    uid: uid(),
    objectId,
    role: opts.role,
    size: opts.size,
    x: opts.x,
    y: opts.y,
    scale: opts.scale,
    rotation: opts.rotation,
    width,
    height,
    body,
  }
}

const initial: CompositionState = {
  format: 'horizontal',
  schemeId: 'scheme-1',
  size: 'L',
  items: [],
  selectedUid: null,
}

export function useComposition() {
  const [state, setState] = useState<CompositionState>(initial)
  const [status, setStatus] = useState<string>('')
  const [busy, setBusy] = useState(false)

  const setFormat = (format: CanvasFormat) => {
    setState((s) => {
      const scale = canonicalScale(s.size, format)
      return {
        ...s,
        format,
        items: s.items.map((it) => ({ ...it, scale })),
      }
    })
  }
  const setSchemeId = (schemeId: string) => setState((s) => ({ ...s, schemeId }))
  const select = (selectedUid: string | null) => setState((s) => ({ ...s, selectedUid }))

  const updateItem = useCallback((itemUid: string, patch: Partial<SceneItem>) => {
    setState((s) => ({
      ...s,
      items: s.items.map((it) => (it.uid === itemUid ? { ...it, ...patch } : it)),
    }))
  }, [])

  const removeSelected = () => {
    setState((s) => ({
      ...s,
      items: s.items.filter((it) => it.uid !== s.selectedUid),
      selectedUid: null,
    }))
  }

  const duplicateSelected = () => {
    setState((s) => {
      const src = s.items.find((it) => it.uid === s.selectedUid)
      if (!src) return s
      const copy: SceneItem = { ...src, uid: uid(), x: src.x + 40, y: src.y + 40 }
      return { ...s, items: [...s.items, copy], selectedUid: copy.uid }
    })
  }

  const bringForward = () => {
    setState((s) => {
      const i = s.items.findIndex((it) => it.uid === s.selectedUid)
      if (i < 0 || i === s.items.length - 1) return s
      const items = [...s.items]
      ;[items[i], items[i + 1]] = [items[i + 1], items[i]]
      return { ...s, items }
    })
  }

  const sendBackward = () => {
    setState((s) => {
      const i = s.items.findIndex((it) => it.uid === s.selectedUid)
      if (i <= 0) return s
      const items = [...s.items]
      ;[items[i - 1], items[i]] = [items[i], items[i - 1]]
      return { ...s, items }
    })
  }

  const addObject = async (objectId: ObjectId, role: AssetRole = 'main') => {
    setBusy(true)
    try {
      const scale = canonicalScale(state.size, state.format)
      const item = await makeItem(objectId, {
        role,
        size: state.size,
        x: 180 + state.items.length * 30,
        y: 220 + (state.items.length % 3) * 20,
        scale,
        rotation: 0,
      })
      setState((s) => ({ ...s, items: [...s.items, item], selectedUid: item.uid }))
      setStatus(`Добавлено: ${CATALOG.find((o) => o.id === objectId)?.nameRu}`)
    } catch (e) {
      setStatus(e instanceof Error ? e.message : 'Ошибка загрузки')
    } finally {
      setBusy(false)
    }
  }

  const reloadItemAsset = async (
    item: SceneItem,
    size: AssetSize,
    role: AssetRole,
    format: CanvasFormat,
  ) => {
    const text = await loadSvg(assetUrl(item.objectId, size, role))
    const { width, height, body } = extractInnerSvg(text)
    return {
      ...item,
      size,
      role,
      width,
      height,
      body,
      scale: canonicalScale(size, format),
    }
  }

  const setGlobalSize = async (size: AssetSize) => {
    setBusy(true)
    try {
      const items = await Promise.all(
        state.items.map((it) => reloadItemAsset(it, size, it.role, state.format)),
      )
      setState((s) => ({ ...s, size, items }))
      setStatus(`Детализация ассетов: ${size}`)
    } catch (e) {
      setStatus(e instanceof Error ? e.message : 'Ошибка смены размера')
    } finally {
      setBusy(false)
    }
  }

  const toggleSelectedRole = async () => {
    const cur = state.items.find((it) => it.uid === state.selectedUid)
    if (!cur) return
    setBusy(true)
    try {
      const role: AssetRole = cur.role === 'main' ? 'background' : 'main'
      const next = await reloadItemAsset(cur, cur.size, role, state.format)
      setState((s) => ({
        ...s,
        items: s.items.map((it) => (it.uid === cur.uid ? next : it)),
      }))
      setStatus(`Роль: ${role === 'main' ? 'главный' : 'фоновый'}`)
    } catch (e) {
      setStatus(e instanceof Error ? e.message : 'Ошибка смены роли')
    } finally {
      setBusy(false)
    }
  }

  const applySlots = async (
    slots: ReturnType<typeof autoLayout>,
    size: AssetSize,
  ) => {
    const items = await Promise.all(
      slots.map((slot) =>
        makeItem(slot.objectId, {
          role: slot.role,
          size,
          x: slot.x,
          y: slot.y,
          scale: slot.scale,
          rotation: slot.rotation,
        }),
      ),
    )
    setState((s) => ({ ...s, items, selectedUid: null, size }))
  }

  const composeFromNames = async (query: string) => {
    setBusy(true)
    try {
      const found = findObjectsByQuery(query)
      if (found.length === 0) {
        setStatus('Ничего не найдено. Пример: книга, лампа, наушники')
        return
      }
      const slots = autoLayout(
        found.map((f) => f.id),
        state.format,
        'assembled',
        state.size,
      )
      await applySlots(slots, state.size)
      setStatus(`Собрано по именам: ${found.map((f) => f.nameRu).join(', ')}`)
    } catch (e) {
      setStatus(e instanceof Error ? e.message : 'Ошибка сборки')
    } finally {
      setBusy(false)
    }
  }

  const composeFromMetaphor = async (text: string) => {
    setBusy(true)
    try {
      const plan = await planFromMetaphor(text)
      const slots = autoLayout(plan.objectIds, state.format, plan.mode, state.size)
      await applySlots(slots, state.size)
      setStatus(plan.rationale)
    } catch (e) {
      setStatus(e instanceof Error ? e.message : 'Ошибка метафоры')
    } finally {
      setBusy(false)
    }
  }

  const clear = () => setState((s) => ({ ...s, items: [], selectedUid: null }))

  return {
    state,
    status,
    busy,
    setFormat,
    setSchemeId,
    setGlobalSize,
    select,
    updateItem,
    removeSelected,
    duplicateSelected,
    bringForward,
    sendBackward,
    addObject,
    toggleSelectedRole,
    composeFromNames,
    composeFromMetaphor,
    clear,
  }
}
