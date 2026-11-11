import { useMemo, useState } from 'react'
import { Canvas } from './components/Canvas'
import {
  CANVAS_FORMATS,
  CATALOG,
  type AssetSize,
  type CanvasFormat,
} from './data/catalog'
import { COLOR_SCHEMES, planeColor } from './data/palettes'
import { useComposition } from './hooks/useComposition'
import {
  loadLlmSettings,
  saveLlmSettings,
  type LlmSettings,
} from './lib/metaphor'
import { buildExportSvg, downloadText, loadPlaneInner, recolorSvgMarkup } from './lib/svg'

export default function App() {
  const c = useComposition()
  const [names, setNames] = useState('книга, лампа, наушники')
  const [metaphor, setMetaphor] = useState('Идея мобильного обучения')
  const [llm, setLlm] = useState<LlmSettings>(() => loadLlmSettings())
  const selected = useMemo(
    () => c.state.items.find((it) => it.uid === c.state.selectedUid) ?? null,
    [c.state.items, c.state.selectedUid],
  )

  const patchLlm = (patch: Partial<LlmSettings>) => {
    setLlm((prev) => {
      const next = { ...prev, ...patch }
      saveLlmSettings(next)
      return next
    })
  }

  const exportSvg = async () => {
    const { width, height } = CANVAS_FORMATS[c.state.format]
    let planeMarkup: string | undefined
    try {
      planeMarkup = await loadPlaneInner(c.state.schemeId, c.state.format)
    } catch {
      planeMarkup = undefined
    }
    const svg = buildExportSvg({
      width,
      height,
      background: planeColor(c.state.schemeId),
      planeMarkup,
      items: c.state.items.map((it) => ({
        id: `${it.objectId}-${it.role}`,
        x: it.x,
        y: it.y,
        scale: it.scale,
        rotation: it.rotation,
        width: it.width,
        height: it.height,
        markup: recolorSvgMarkup(it.body, c.state.schemeId),
      })),
    })
    downloadText(`composition-${c.state.format}-${c.state.schemeId}.svg`, svg)
  }

  return (
    <div className="app">
      <header className="top">
        <div className="brand">
          <p className="brand-mark">Snapcompose</p>
          <h1>Конструктор иллюстраций из готовой SVG-библиотеки</h1>
          <p className="lede">Метафора или имена → сборка сцены → изображение SVG.</p>
          <ul className="terms">
            <li>
              <strong>Метафора</strong> — идея своими словами, по ней подбираются изображения
            </li>
            <li>
              <strong>SVG</strong> — изображение, которое можно скачать и потом править
            </li>
            <li>
              <strong>LLM</strong> — нейросеть: читает идею и помогает подобрать изображения
            </li>
          </ul>
        </div>
        <div className="top-actions">
          <button
            type="button"
            className="btn primary"
            onClick={exportSvg}
            disabled={!c.state.items.length}
            title="SVG — изображение, которое можно потом править"
          >
            Скачать SVG
          </button>
          <button type="button" className="btn" onClick={c.clear} disabled={!c.state.items.length}>
            Очистить
          </button>
        </div>
      </header>

      <div className="workspace">
        <aside className="panel">
          <section>
            <h2>Сценарий 1 — метафора</h2>
            <p className="hint">Идея своими словами: программа сама подберёт изображения.</p>
            <textarea
              value={metaphor}
              onChange={(e) => setMetaphor(e.target.value)}
              rows={3}
              placeholder="Например: финансы в одном приложении"
            />
            <button
              type="button"
              className="btn primary block"
              disabled={c.busy}
              onClick={() => c.composeFromMetaphor(metaphor)}
            >
              Собрать по метафоре
            </button>
          </section>

          <details className="llm-details">
            <summary>Нейросеть (LLM)</summary>
            <div className="llm-details-body">
              <p className="hint">
                Читает вашу идею и подбирает изображения. Если выключить или не указывать ключ,
                программа подберёт их сама.
              </p>
              <label className="check">
                <input
                  type="checkbox"
                  checked={llm.enabled}
                  onChange={(e) => patchLlm({ enabled: e.target.checked })}
                />
                Использовать нейросеть
              </label>
              <label>
                API key
                <input
                  type="password"
                  value={llm.apiKey}
                  onChange={(e) => patchLlm({ apiKey: e.target.value })}
                  placeholder="sk-…"
                  autoComplete="off"
                />
              </label>
              <label>
                Base URL
                <input
                  value={llm.baseUrl}
                  onChange={(e) => patchLlm({ baseUrl: e.target.value })}
                  placeholder="https://api.openai.com/v1"
                />
              </label>
              <label>
                Model
                <input
                  value={llm.model}
                  onChange={(e) => patchLlm({ model: e.target.value })}
                  placeholder="gpt-4o-mini"
                />
              </label>
            </div>
          </details>

          <section>
            <h2>Сценарий 2 — имена</h2>
            <input
              value={names}
              onChange={(e) => setNames(e.target.value)}
              placeholder="книга, лампа, телефон"
            />
            <button
              type="button"
              className="btn block"
              disabled={c.busy}
              onClick={() => c.composeFromNames(names)}
            >
              Собрать по именам
            </button>
          </section>

          <section>
            <h2>Формат / размер / палитра</h2>
            <div className="row">
              {(Object.keys(CANVAS_FORMATS) as CanvasFormat[]).map((f) => (
                <button
                  key={f}
                  type="button"
                  className={c.state.format === f ? 'chip on' : 'chip'}
                  onClick={() => c.setFormat(f)}
                >
                  {CANVAS_FORMATS[f].label}
                </button>
              ))}
            </div>
            <div className="row">
              {(['L', 'S'] as AssetSize[]).map((s) => (
                <button
                  key={s}
                  type="button"
                  className={c.state.size === s ? 'chip on' : 'chip'}
                  disabled={c.busy}
                  onClick={() => c.setGlobalSize(s)}
                >
                  Size {s}
                </button>
              ))}
            </div>
            <div className="row palettes">
              {COLOR_SCHEMES.map((scheme) => (
                <button
                  key={scheme.id}
                  type="button"
                  className={c.state.schemeId === scheme.id ? 'palette on' : 'palette'}
                  title={scheme.name}
                  onClick={() => c.setSchemeId(scheme.id)}
                >
                  {scheme.colors.slice(0, 4).map((col) => (
                    <span key={col.hex} style={{ background: col.hex }} />
                  ))}
                  <em>{scheme.name}</em>
                </button>
              ))}
            </div>
          </section>

          <section>
            <h2>Библиотека</h2>
            <div className="lib">
              {CATALOG.map((obj) => (
                <button
                  key={obj.id}
                  type="button"
                  className="lib-item"
                  disabled={c.busy}
                  onClick={() => c.addObject(obj.id, 'main')}
                  title={obj.tags.join(', ')}
                >
                  {obj.nameRu}
                </button>
              ))}
            </div>
          </section>
        </aside>

        <main className="stage">
          <Canvas
            format={c.state.format}
            schemeId={c.state.schemeId}
            items={c.state.items}
            selectedUid={c.state.selectedUid}
            onSelect={c.select}
            onMove={(uid, x, y) => c.updateItem(uid, { x, y })}
          />
          <div className="status" aria-live="polite">
            {c.busy ? 'Загрузка…' : c.status || 'Добавьте объекты или соберите сцену по метафоре / именам'}
          </div>
        </main>

        <aside className="panel slim">
          <section>
            <h2>Выбранный объект</h2>
            {selected ? (
              <>
                <p className="meta">
                  {CATALOG.find((o) => o.id === selected.objectId)?.nameRu} · {selected.role} ·{' '}
                  {selected.size}
                </p>
                <label>
                  Размер на холсте
                  <input
                    type="range"
                    min={0.15}
                    max={1.2}
                    step={0.01}
                    value={selected.scale}
                    onChange={(e) => c.updateItem(selected.uid, { scale: Number(e.target.value) })}
                  />
                </label>
                <label>
                  Поворот
                  <input
                    type="range"
                    min={-30}
                    max={30}
                    step={1}
                    value={selected.rotation}
                    onChange={(e) =>
                      c.updateItem(selected.uid, { rotation: Number(e.target.value) })
                    }
                  />
                </label>
                <div className="stack">
                  <button type="button" className="btn block" onClick={c.toggleSelectedRole} disabled={c.busy}>
                    Main ↔ Background
                  </button>
                  <button type="button" className="btn block" onClick={c.duplicateSelected}>
                    Дублировать
                  </button>
                  <button type="button" className="btn block" onClick={c.bringForward}>
                    Выше слоем
                  </button>
                  <button type="button" className="btn block" onClick={c.sendBackward}>
                    Ниже слоем
                  </button>
                  <button type="button" className="btn danger block" onClick={c.removeSelected}>
                    Удалить
                  </button>
                </div>
              </>
            ) : (
              <p className="meta">Кликните объект на холсте</p>
            )}
          </section>
          <section>
            <h2>Ограничения</h2>
            <ul className="rules">
              <li>Size L/S — детализация; масштаб на холсте можно менять</li>
              <li>Цвета только из выбранной схемы</li>
              <li>Экспорт — редактируемый SVG</li>
            </ul>
          </section>
        </aside>
      </div>
    </div>
  )
}
