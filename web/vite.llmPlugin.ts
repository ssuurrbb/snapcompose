import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Connect, Plugin } from 'vite'

const CATALOG_LINES = [
  'book: Книга (книга, знание, учёба, чтение, обучение)',
  'phone: Телефон (телефон, смартфон, приложение, экран, mobile)',
  'puzzle: Пазлы (пазл, задача, решение, сборка, логика)',
  'headphones: Наушники (наушники, музыка, аудио, звук, подкаст)',
  'lamp: Лампа (лампа, идея, свет, озарение, креатив)',
  'vase: Ваза (ваза, цветы, тюльпаны, декор, красота)',
  'wallet: Кошелёк (кошелёк, деньги, оплата, финансы)',
  'folder: Папка (папка, документы, файлы, офис)',
  'pen: Ручка (ручка, письмо, заметки, контент)',
  'coin: Монета (монета, финансы, ценность, деньги)',
] as const

const VALID_IDS = new Set(CATALOG_LINES.map((line) => line.split(':')[0]))
const VALID_MODES = new Set(['assembled', 'offset', 'title'])

type Incoming = {
  metaphor?: string
  apiKey?: string
  baseUrl?: string
  model?: string
}

function buildMessages(metaphor: string) {
  const system = `Ты планировщик композиций иллюстраций.
Выбираешь ТОЛЬКО готовые объекты из каталога. Новые объекты придумывать нельзя.
Отвечай строго JSON-объектом без markdown:
{"objectIds":["lamp","book"],"mode":"assembled","rationale":"кратко почему"}

Правила:
- objectIds: 3–5 уникальных id строго из каталога
- mode: "assembled" | "offset" | "title"
  - assembled — плотная сцена
  - offset — объекты разнесены
  - title — акцент под заголовок/обложку
- rationale: 1 короткое предложение на русском
- Не описывай геометрию и не предлагай цвета вне системы`

  const user = `Каталог объектов:
${CATALOG_LINES.map((line) => `- ${line}`).join('\n')}

Метафора / заголовок:
"""${metaphor.trim()}"""

Верни JSON-план композиции.`

  return [
    { role: 'system', content: system },
    { role: 'user', content: user },
  ]
}

function extractJsonObject(text: string): unknown {
  const trimmed = text.trim()
  try {
    return JSON.parse(trimmed)
  } catch {
    const start = trimmed.indexOf('{')
    const end = trimmed.lastIndexOf('}')
    if (start >= 0 && end > start) {
      return JSON.parse(trimmed.slice(start, end + 1))
    }
    throw new Error('LLM вернул не-JSON')
  }
}

function sanitizePlan(raw: unknown) {
  if (!raw || typeof raw !== 'object') return null
  const data = raw as Record<string, unknown>
  const idsRaw = Array.isArray(data.objectIds) ? data.objectIds : []
  const objectIds = [
    ...new Set(
      idsRaw
        .filter((id): id is string => typeof id === 'string')
        .map((id) => id.trim().toLowerCase())
        .filter((id) => VALID_IDS.has(id)),
    ),
  ]
  if (objectIds.length < 2) return null
  const mode =
    typeof data.mode === 'string' && VALID_MODES.has(data.mode) ? data.mode : 'assembled'
  const rationale =
    typeof data.rationale === 'string' && data.rationale.trim()
      ? data.rationale.trim()
      : `Подобраны: ${objectIds.join(', ')}`
  return { objectIds: objectIds.slice(0, 5), mode, rationale, source: 'llm' as const }
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    req.on('data', (chunk: Buffer | string) => {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
    })
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    req.on('error', reject)
  })
}

function sendJson(res: ServerResponse, status: number, data: unknown) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.end(JSON.stringify(data))
}

async function callChatCompletions(opts: {
  baseUrl: string
  apiKey: string
  model: string
  metaphor: string
}) {
  const base = opts.baseUrl.replace(/\/$/, '')
  const url = `${base}/chat/completions`
  const messages = buildMessages(opts.metaphor)

  const attempt = async (withJsonMode: boolean) => {
    const body: Record<string, unknown> = {
      model: opts.model,
      temperature: 0.4,
      messages,
    }
    if (withJsonMode) body.response_format = { type: 'json_object' }

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${opts.apiKey}`,
      },
      body: JSON.stringify(body),
    })

    const raw = await res.text()
    let json: {
      error?: { message?: string }
      choices?: Array<{ message?: { content?: string } }>
    }
    try {
      json = JSON.parse(raw) as typeof json
    } catch {
      throw new Error(`LLM ответил не JSON (${res.status})`)
    }

    if (!res.ok) {
      throw new Error(json.error?.message || `LLM HTTP ${res.status}`)
    }

    const content = json.choices?.[0]?.message?.content
    if (!content) throw new Error('Пустой ответ LLM')
    return extractJsonObject(content)
  }

  try {
    return await attempt(true)
  } catch (err) {
    const msg = err instanceof Error ? err.message : ''
    if (/response_format|json_object|unsupported|JSON|parse/i.test(msg)) {
      return await attempt(false)
    }
    throw err
  }
}

function createHandler(): Connect.NextHandleFunction {
  return async (req, res, next) => {
    if (req.method === 'OPTIONS') {
      res.statusCode = 204
      res.setHeader('Access-Control-Allow-Origin', '*')
      res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
      res.end('')
      return
    }
    if (req.method !== 'POST') {
      next()
      return
    }

    try {
      const body = JSON.parse((await readBody(req)) || '{}') as Incoming
      const metaphor = body.metaphor?.trim()
      if (!metaphor) {
        sendJson(res, 400, { error: 'Нужна метафора' })
        return
      }

      const apiKey = (
        body.apiKey ||
        process.env.LLM_API_KEY ||
        process.env.VITE_LLM_API_KEY ||
        ''
      ).trim()
      if (!apiKey) {
        sendJson(res, 503, {
          error:
            'Нет API-ключа. Укажите ключ в панели LLM или в .env (LLM_API_KEY / VITE_LLM_API_KEY).',
        })
        return
      }

      const baseUrl = (
        body.baseUrl ||
        process.env.LLM_BASE_URL ||
        process.env.VITE_LLM_BASE_URL ||
        'https://api.openai.com/v1'
      ).trim()
      const model = (
        body.model ||
        process.env.LLM_MODEL ||
        process.env.VITE_LLM_MODEL ||
        'gpt-4o-mini'
      ).trim()

      const rawPlan = await callChatCompletions({ apiKey, baseUrl, model, metaphor })
      const plan = sanitizePlan(rawPlan)
      if (!plan) {
        sendJson(res, 502, {
          error: 'Модель вернула id вне каталога',
          catalog: [...VALID_IDS],
          raw: rawPlan,
        })
        return
      }

      sendJson(res, 200, { plan })
    } catch (err) {
      sendJson(res, 502, {
        error: err instanceof Error ? err.message : 'Ошибка LLM proxy',
      })
    }
  }
}

/** Dev/preview proxy: POST /api/llm/plan → OpenAI-compatible chat completions */
export function llmPlanPlugin(): Plugin {
  return {
    name: 'snapcompose-llm-plan',
    configureServer(server) {
      server.middlewares.use('/api/llm/plan', createHandler())
    },
    configurePreviewServer(server) {
      server.middlewares.use('/api/llm/plan', createHandler())
    },
  }
}
