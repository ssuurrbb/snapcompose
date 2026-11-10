export type ObjectId =
  | 'book'
  | 'phone'
  | 'puzzle'
  | 'headphones'
  | 'lamp'
  | 'vase'
  | 'wallet'
  | 'folder'
  | 'pen'
  | 'coin'

export type AssetSize = 'L' | 'S'
export type AssetRole = 'main' | 'background'
export type CanvasFormat = 'square' | 'horizontal' | 'vertical'

export interface CatalogObject {
  id: ObjectId
  nameRu: string
  nameEn: string
  tags: string[]
}

export const CATALOG: CatalogObject[] = [
  { id: 'book', nameRu: 'Книга', nameEn: 'book', tags: ['книга', 'знание', 'учёба', 'чтение', 'обучение', 'education'] },
  { id: 'phone', nameRu: 'Телефон', nameEn: 'phone', tags: ['телефон', 'смартфон', 'приложение', 'экран', 'mobile', 'app'] },
  { id: 'puzzle', nameRu: 'Пазлы', nameEn: 'puzzle', tags: ['пазл', 'задача', 'решение', 'сборка', 'логика'] },
  { id: 'headphones', nameRu: 'Наушники', nameEn: 'headphones', tags: ['наушники', 'музыка', 'аудио', 'звук', 'подкаст'] },
  { id: 'lamp', nameRu: 'Лампа', nameEn: 'lamp', tags: ['лампа', 'идея', 'свет', 'озарение', 'креатив', 'insight'] },
  { id: 'vase', nameRu: 'Ваза', nameEn: 'vase', tags: ['ваза', 'цветы', 'тюльпаны', 'декор', 'красота'] },
  { id: 'wallet', nameRu: 'Кошелёк', nameEn: 'wallet', tags: ['кошелёк', 'деньги', 'оплата', 'финансы', 'payment'] },
  { id: 'folder', nameRu: 'Папка', nameEn: 'folder', tags: ['папка', 'документы', 'файлы', 'офис', 'docs'] },
  { id: 'pen', nameRu: 'Ручка', nameEn: 'pen', tags: ['ручка', 'письмо', 'заметки', 'контент', 'write'] },
  { id: 'coin', nameRu: 'Монета', nameEn: 'coin', tags: ['монета', 'финансы', 'ценность', 'деньги', 'profit'] },
]

export const CANVAS_FORMATS: Record<
  CanvasFormat,
  { label: string; width: number; height: number }
> = {
  square: { label: 'Квадрат', width: 1000, height: 1000 },
  horizontal: { label: 'Горизонталь', width: 1200, height: 630 },
  vertical: { label: 'Вертикаль', width: 800, height: 1200 },
}

export function assetUrl(id: ObjectId, size: AssetSize, role: AssetRole): string {
  return `/library/${size}/${role}/${id}.svg`
}

export function findObjectsByQuery(query: string): CatalogObject[] {
  const parts = query
    .toLowerCase()
    .split(/[,;\n]+|\s+и\s+|\s+/i)
    .map((p) => p.trim())
    .filter(Boolean)

  const found: CatalogObject[] = []
  const seen = new Set<ObjectId>()

  for (const part of parts) {
    const match = CATALOG.find(
      (obj) =>
        obj.id === part ||
        obj.nameEn === part ||
        obj.nameRu.toLowerCase() === part ||
        obj.tags.some((t) => t === part || part.includes(t) || t.includes(part)),
    )
    if (match && !seen.has(match.id)) {
      seen.add(match.id)
      found.push(match)
    }
  }
  return found
}
