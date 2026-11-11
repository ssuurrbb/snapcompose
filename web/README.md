# Snapcompose — веб-приложение

Основная документация для сдачи: [`../README.md`](../README.md).

## Запуск

```bash
npm install
npm run dev
```

Открой URL из терминала (обычно http://localhost:5173).

## LLM (сценарий 1)

1. Скопируй `.env.example` → `.env`
2. Укажи `LLM_API_KEY` (или вставь ключ в панели «LLM для метафор»)
3. По умолчанию: `https://api.openai.com/v1` + `gpt-4o-mini`
4. Подойдут OpenRouter / Groq и другие OpenAI-compatible endpoint’ы — поменяй Base URL и Model  
   (для демо удобен Groq: `https://api.groq.com/openai/v1`, модель вроде `openai/gpt-oss-20b`)

Ключ из UI хранится в `sessionStorage` и уходит только на same-origin proxy (не в клиентский бандл напрямую к провайдеру).

Без ключа сценарий 1 работает через локальную эвристику.

## Скрипты

- `npm run dev` — разработка (+ LLM proxy)
- `npm run build` — production-сборка
- `npm run preview` — превью сборки (+ LLM proxy)
- `npm run lint` — oxlint
