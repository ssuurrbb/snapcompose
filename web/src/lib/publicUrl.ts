/** Путь от корня сайта с учётом Vite `base` (`/` локально, `/snapcompose/` на домене). */
export function publicUrl(path: string): string {
  const base = import.meta.env.BASE_URL || '/'
  const suffix = path.replace(/^\/+/, '')
  return `${base}${suffix}`
}
