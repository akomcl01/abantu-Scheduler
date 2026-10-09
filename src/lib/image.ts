/** Shrink a picked image to a JPEG data URL small enough to keep in the app's saved data. */
export async function compressImage(file: File, maxSide = 1280, quality = 0.8): Promise<string> {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height))
  const w = Math.round(bitmap.width * scale)
  const h = Math.round(bitmap.height * scale)
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, w, h)
  let q = quality
  let url = canvas.toDataURL('image/jpeg', q)
  while (url.length > 450_000 && q > 0.4) { q -= 0.1; url = canvas.toDataURL('image/jpeg', q) }
  return url
}
