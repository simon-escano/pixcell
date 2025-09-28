import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { sampleImage } from '@/db/schema'
import { getUser } from '@/lib/auth'
import { eq } from 'drizzle-orm'
import { profile } from '@/db/schema'

export async function POST(req: NextRequest) {
  try {
    const { sampleId } = await req.json()
    if (!sampleId) {
      return NextResponse.json({ error: 'Missing sampleId' }, { status: 400 })
    }

    const currentUser = await getUser()
    const prof = await db.select({ id: profile.id }).from(profile).where(eq(profile.userId, currentUser.id)).limit(1)
    const uploaderProfileId = prof[0]?.id

    const [row] = await db
      .insert(sampleImage)
      .values({ sampleId, uploadedBy: uploaderProfileId ?? null, metadata: {}, isAiGenerated: true })
      .returning({ id: sampleImage.id })

    return NextResponse.json({ sampleImageId: row.id })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}


