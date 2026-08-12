import { NextResponse, connection } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { validateSubmission } from '@/lib/feedback/validate'
import { checkRateLimit } from '@/lib/feedback/rate-limit'
import { processImages } from '@/lib/feedback/images'
import { MAX_IMAGES } from '@/lib/types/feedback'

// Service-role client: the only writer to feedback tables. RLS grants no
// client role INSERT, so every submission — anonymous or authenticated —
// funnels through this one validated, rate-limited path.
function serviceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}

function clientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  // Left-most entry is the original client; the rest are proxies.
  return forwarded?.split(',')[0]?.trim() || 'unknown'
}

function str(form: FormData, key: string): string {
  const value = form.get(key)
  return typeof value === 'string' ? value : ''
}

function nullableStr(form: FormData, key: string): string | null {
  const value = str(form, key).trim()
  return value === '' ? null : value
}

export async function POST(request: Request) {
  // Reads auth cookies below. Deferred to request time so PPR does not
  // prerender this route. Outside the try/catch so the prerender-abort signal
  // propagates to React rather than being swallowed as a 500.
  await connection()

  try {
    const service = serviceClient()

    const { allowed } = await checkRateLimit(service, clientIp(request))
    if (!allowed) {
      return NextResponse.json(
        { error: 'You have sent several reports recently. Please try again later.' },
        { status: 429 }
      )
    }

    const form = await request.formData()

    const result = validateSubmission({
      type: str(form, 'type'),
      category: str(form, 'category'),
      title: str(form, 'title'),
      description: str(form, 'description'),
      email: str(form, 'email'),
    })

    if (!result.ok) {
      return NextResponse.json({ errors: result.errors }, { status: 400 })
    }

    // Logged-in users are identified from their session cookie, never from a
    // client-supplied id.
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const email = result.value.email ?? user?.email ?? null

    const { data: row, error: insertError } = await service
      .from('feedback')
      .insert({
        ...result.value,
        email,
        user_id: user?.id ?? null,
        page_path: nullableStr(form, 'page_path'),
        entity_type: nullableStr(form, 'entity_type'),
        entity_slug: nullableStr(form, 'entity_slug'),
        entity_title: nullableStr(form, 'entity_title'),
        user_agent: request.headers.get('user-agent'),
      })
      .select(
        'id, type, category, title, description, page_path, entity_type, entity_slug, entity_title, created_at'
      )
      .single()

    if (insertError || !row) throw insertError ?? new Error('Insert returned no row')

    // Partial-failure rule: the row is already committed and is never rolled
    // back for an image problem. A report that arrives without its screenshot
    // beats a report lost to a failed upload.
    const files = form.getAll('images').filter((f): f is File => f instanceof File)
    let imagesFailed = false
    const imageNames: string[] = []

    if (files.length > 0) {
      try {
        const processed = await processImages(files.slice(0, MAX_IMAGES))

        for (const image of processed) {
          const path = `${row.id}/${image.name}`
          const { error: uploadError } = await service.storage
            .from('feedback')
            .upload(path, image.buffer, { contentType: 'image/webp', upsert: true })

          if (uploadError) throw uploadError

          const { error: rowError } = await service
            .from('feedback_images')
            .insert({ feedback_id: row.id, path })

          if (rowError) throw rowError

          imageNames.push(image.name)
        }

        if (processed.length < files.length) imagesFailed = true
      } catch (error) {
        console.error(`Attachment handling failed for feedback ${row.id}:`, error)
        imagesFailed = true
      }
    }

    return NextResponse.json({ feedback: row, imageNames, imagesFailed }, { status: 201 })
  } catch (error) {
    console.error('Failed to submit feedback:', error)
    return NextResponse.json(
      { error: 'Something went wrong sending your report. Please try again.' },
      { status: 500 }
    )
  }
}
