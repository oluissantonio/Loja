/**
 * Preparação das fotos antes do envio ao Supabase Storage.
 * Fotos de celular costumam ter vários MB: aqui elas são reduzidas para no
 * máximo 1600 px e convertidas para WebP (ou JPEG), ficando bem mais leves.
 */

export const IMAGE_ACCEPT = 'image/jpeg,image/png,image/webp,image/avif,image/heic,image/heif'
/** Tamanho máximo do arquivo ORIGINAL escolhido pelo usuário. */
export const MAX_INPUT_BYTES = 20 * 1024 * 1024
/** Limite do bucket product-images (igual ao definido na migração). */
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024
const MAX_SIDE = 1600

export class ImageError extends Error {
  name = 'ImageError'
}

const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/heic', 'image/heif']

export function validateImageFile(file: File) {
  const type = file.type || ''
  const byExt = /\.(jpe?g|png|webp|avif|heic|heif)$/i.test(file.name)
  if (!ALLOWED.includes(type) && !byExt) {
    throw new ImageError('Formato não aceito. Use uma foto JPG, PNG, WebP ou AVIF.')
  }
  if (file.size > MAX_INPUT_BYTES) {
    throw new ImageError(`A foto tem ${(file.size / 1024 / 1024).toFixed(1)} MB. O máximo é 20 MB.`)
  }
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => { URL.revokeObjectURL(url); resolve(img) }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new ImageError('Não foi possível abrir esta foto. Se for HEIC (iPhone), tire um print dela ou salve como JPG e tente de novo.'))
    }
    img.src = url
  })
}

function toBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality))
}

/** Reduz e comprime a foto. Devolve o arquivo pronto e a extensão. */
export async function prepareImage(file: File): Promise<{ blob: Blob; ext: string; type: string }> {
  validateImageFile(file)
  const img = await loadImage(file)
  const scale = Math.min(1, MAX_SIDE / Math.max(img.naturalWidth, img.naturalHeight))
  const w = Math.max(1, Math.round(img.naturalWidth * scale))
  const h = Math.max(1, Math.round(img.naturalHeight * scale))

  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new ImageError('Seu navegador não conseguiu processar a foto.')
  ctx.fillStyle = '#ffffff' // fundo branco para PNG com transparência ao virar JPEG
  ctx.fillRect(0, 0, w, h)
  ctx.drawImage(img, 0, 0, w, h)

  for (const [type, ext] of [['image/webp', 'webp'], ['image/jpeg', 'jpg']] as const) {
    for (const q of [0.85, 0.7, 0.55]) {
      const blob = await toBlob(canvas, type, q)
      if (blob && blob.type === type && blob.size <= MAX_UPLOAD_BYTES) return { blob, ext, type }
    }
  }
  throw new ImageError('A foto continua grande demais mesmo depois de reduzida. Tente outra foto.')
}
