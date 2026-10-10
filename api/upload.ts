import { handleUpload, type HandleUploadBody } from '@vercel/blob/client'

// Goal-of-the-week videos go from the phone straight to Vercel Blob. This route only hands out a short-lived
// upload token, and only for video files under goals/<week>/ up to the size limit (MAX_CLIP_MB in src/lib/goals.ts).
const MAX_BYTES = 100 * 1024 * 1024
const PATH = /^goals\/\d{4}-\d{2}-\d{2}\/[\w-]+\.[a-z0-9]{2,5}$/i

export async function POST(request: Request): Promise<Response> {
  try {
    const body = (await request.json()) as HandleUploadBody
    const json = await handleUpload({
      request,
      body,
      onBeforeGenerateToken: async (pathname) => {
        if (!PATH.test(pathname)) throw new Error('Unexpected file name')
        return { allowedContentTypes: ['video/*'], maximumSizeInBytes: MAX_BYTES, addRandomSuffix: true }
      },
    })
    return Response.json(json)
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 400 })
  }
}
