# Snapcompose

Веб-конструктор иллюстраций для тестового «Очень» / Снэпбилд.

Собирает композиции **только** из готовой SVG-библиотеки (10 объектов × L/S × main/background).  
Новые объекты не генерируются. Экспорт — редактируемый SVG.

## Запуск

```bash
cd web
npm install
npm run dev
```

Открой URL из терминала (обычно http://localhost:5173).

## Что умеет

1. **Сценарий 1** — метафора/заголовок → подбор объектов из каталога → автораскладка  
2. **Сценарий 2** — имена компонентов (`книга, лампа, наушники`) → компоновка  
3. Ручное добавление из библиотеки, drag, масштаб, поворот, слои  
4. Main ↔ Background, Size L/S, 3 цветовые схемы с перекраской  
5. Форматы: квадрат / горизонталь / вертикаль  
6. Скачать итоговый SVG

## Архитектура (кратко)

| Слой | Где | Зачем |
|------|-----|--------|
| Каталог | `src/data/catalog.ts` | id, имена, теги для метафор |
| Палитры | `src/data/palettes.ts` | 3 схемы + карта перекраски от scheme-1 |
| SVG loader | `src/lib/svg.ts` | загрузка, кэш, recolor, export |
| Layout | `src/lib/layout.ts` | эвристики assembled / offset / title |
| Metaphor | `src/lib/metaphor.ts` | LLM → план; fallback локальный; только id каталога |
| LLM proxy | `vite.llmPlugin.ts` | `POST /api/llm/plan` (OpenAI-compatible) |
| Ассеты | `public/library/**` | исходные векторы (копия из `../assets`) |

Сценарий 1: `planFromMetaphor` вызывает LLM через proxy, затем `sanitizePlan` отбрасывает любые id вне каталога. Если ключа нет или API упал — локальная эвристика.

## LLM (сценарий 1)

1. Скопируй `.env.example` → `.env`
2. Укажи `LLM_API_KEY` (или вставь ключ в панели «LLM для метафор»)
3. По умолчанию: `https://api.openai.com/v1` + `gpt-4o-mini`
4. Подойдут OpenRouter / Groq и другие OpenAI-compatible endpoint’ы — поменяй Base URL и Model

Ключ из UI хранится в `sessionStorage` и уходит только на same-origin proxy (не в клиентский бандл напрямую к провайдеру).

## AI-инструменты при разработке

- Cursor (агент) — сборка приложения и нормализация ассетов из Figma-экспорта
- OpenAI-compatible LLM API — анализ метафор и подбор объектов каталога

## Скрипты

- `npm run dev` — разработка (+ LLM proxy)  
- `npm run build` — production-сборка  
- `npm run preview` — превью сборки (+ LLM proxy)  
