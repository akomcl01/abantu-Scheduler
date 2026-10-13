import { issueSignedToken } from '@vercel/blob'
import { handleUploadPresigned, type HandleUploadPresignedBody } from '@vercel/blob/client'

// Goal-of-the-week videos go from the phone straight to Vercel Blob. This route only hands out a short-lived
// signed upload URL, and only for video files under goals/<week>/ up to the size limit (MAX_CLIP_MB in src/lib/goals.ts).
// It uses the presigned flow because the store signs in with the project's OIDC identity (BLOB_STORE_ID), not a
// BLOB_READ_WRITE_TOKEN.
const MAX_BYTES = 100 * 1024 * 1024
const PATH = /^goals\/\d{4}-\d{2}-\d{2}\/[\w-]+\.[a-z0-9]{2,5}$/i

export async function POST(request: Request): Promise<Response> {
  try {
    const body = (await request.json()) as HandleUploadPresignedBody
    const json = await handleUploadPresigned({
      request,
      body,
      getSignedToken: async (pathname) => {
        if (!PATH.test(pathname)) throw new Error('Unexpected file name')
        const token = await issueSignedToken({ pathname, operations: ['put'], maximumSizeInBytes: MAX_BYTES, allowedContentTypes: ['video/*'] })
        return { token, urlOptions: { addRandomSuffix: true, allowedContentTypes: ['video/*'], maximumSizeInBytes: MAX_BYTES } }
      },
    })
    return Response.json(json)
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 400 })
  }
}
