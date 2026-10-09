/**
 * Shrink a picked image to a data URL small enough to keep in the app's saved data.
 * `alpha` keeps transparency (WebP, or PNG where the browser can't encode WebP) so cut-out cards stay cut out.
 */
export async function compressImage(file: File, maxSide = 1280, quality = 0.8, alpha = false): Promise<string> {
  const bitmap = await createImageBitmap(file)
  let scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  const draw = () => {
    canvas.width = Math.round(bitmap.width * scale)
    canvas.height = Math.round(bitmap.height * scale)
    canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  }
  draw()
  const type = alpha ? 'image/webp' : 'image/jpeg'
  let q = quality
  let url = canvas.toDataURL(type, q)
  while (url.length > 450_000 && q > 0.4) { q -= 0.1; url = canvas.toDataURL(type, q) }
  // PNG fallback ignores quality, so shrink instead.
  while (url.length > 450_000 && scale > 0.2) { scale *= 0.8; draw(); url = canvas.toDataURL(type, q) }
  return url
}
