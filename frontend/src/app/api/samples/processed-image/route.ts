import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { sampleImage, image } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { createClient } from '@supabase/supabase-js';
import crypto from 'node:crypto'
import sizeOf from 'image-size'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const sampleImageId = formData.get('sampleImageId') as string;
    const file = formData.get('file') as File;
    if (!sampleImageId || !file) {
      return NextResponse.json({ success: false, error: 'Missing sampleImageId or file' }, { status: 400 });
    }

    // Upload file to Supabase Storage
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}-processed.jpg`;
    const { data, error: uploadError } = await supabase.storage
      .from('sample-images')
      .upload(fileName, buffer, {
        contentType: file.type || 'image/jpeg',
        upsert: false,
      });
    if (uploadError) {
      return NextResponse.json({ success: false, error: uploadError.message }, { status: 500 });
    }
    const imageUrl = `${supabaseUrl}/storage/v1/object/public/sample-images/${data.path}`;

    // Insert new image record
    const [imageRecord] = await db
      .insert(image)
      .values({
        id: crypto.randomUUID(),
        imageUrl,
      })
      .returning();

    // Extract image dimensions for metadata
    const dims = sizeOf(buffer)
    const metadata = {
      type: file.type || dims.type || 'image/jpeg',
      width: dims.width || 0,
      height: dims.height || 0,
    }

    // Update sampleImage to point to new image and mark as AI-generated, with dimensions metadata
    await db
      .update(sampleImage)
      .set({ imageId: imageRecord.id, isAiGenerated: true, metadata })
      .where(eq(sampleImage.id, sampleImageId));

    return NextResponse.json({ success: true, imageUrl, metadata });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
} 

export async function GET() {
  return NextResponse.json({ ok: true });
}