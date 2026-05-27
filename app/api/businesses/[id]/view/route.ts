import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { checkRateLimit, getClientIP } from '@/lib/security'
import { createHash } from 'crypto'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const businessId = id

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(businessId)) {
      return NextResponse.json({ success: true }) // Silent fail
    }

    const ip = getClientIP(request)

    // Rate limit: 1 view per IP per business per 30 min
    const rateKey = `biz-view:${ip}:${businessId}`
    const rateCheck = await checkRateLimit(rateKey, 1, 1800)
    if (!rateCheck.allowed) {
      return NextResponse.json({ success: true }) // Silent, don't count duplicate
    }

    // Hash IP for privacy (don't store raw IP)
    const ipHash = createHash('sha256').update(ip + businessId).digest('hex').slice(0, 16)

    // Get referrer and user agent
    const referrer = request.headers.get('referer') || null
    const userAgent = request.headers.get('user-agent') || null

    const supabase = createServiceClient()

    // Insert view event + increment counter in parallel
    await Promise.all([
      supabase.from('business_views').insert({
        business_id: businessId,
        ip_hash: ipHash,
        referrer,
        user_agent: userAgent,
      }),
      supabase.rpc('increment_business_views', { biz_id: businessId }).then(async (res) => {
        // Fallback if RPC doesn't exist: manual increment
        if (res.error) {
          const { data: biz } = await supabase
            .from('businesses')
            .select('total_views')
            .eq('id', businessId)
            .single()
          if (biz) {
            await supabase
              .from('businesses')
              .update({ total_views: (biz.total_views || 0) + 1 })
              .eq('id', businessId)
          }
        }
      }),
    ])

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ success: true }) // Silent fail, never break UX
  }
}

