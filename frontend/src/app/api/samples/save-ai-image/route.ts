import { NextRequest, NextResponse } from "next/server";
import { db } from '@/db';
import { sampleImageAi } from '@/db/schema';
import { createClient } from '@supabase/supabase-js';
import { revalidateTag, revalidatePath } from 'next/cache';
import { CACHE_TAGS } from '@/lib/cache';
import { eq } from 'drizzle-orm';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl!, supabaseKey!);

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const originalSampleImageId = formData.get('originalSampleImageId') as string;
    const imageBase64 = formData.get('imageBase64') as string;
    
    if (!originalSampleImageId || !imageBase64) {
      return NextResponse.json({ success: false, error: 'Missing originalSampleImageId or imageBase64' }, { status: 400 });
    }

    // Convert base64 to buffer
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    
    // Upload to Supabase Storage
    const fileName = `ai-${Date.now()}-${Math.random().toString(36).substring(2)}.jpg`;
    const { data, error: uploadError } = await supabase.storage
      .from('sample-images')
      .upload(fileName, buffer, {
        contentType: 'image/jpeg',
        upsert: false,
      });
    
    if (uploadError) {
      return NextResponse.json({ success: false, error: uploadError.message }, { status: 500 });
    }
    
    const imageUrl = `${supabaseUrl}/storage/v1/object/public/sample-images/${data.path}`;

    // Check if a record already exists for this originalSampleImageId
    const existingRecord = await db
      .select()
      .from(sampleImageAi)
      .where(eq(sampleImageAi.originalSampleImageId, originalSampleImageId))
      .limit(1);

    let aiImageRecord;

    if (existingRecord.length > 0) {
      // Delete old image from storage if it exists
      const oldImageUrl = existingRecord[0].imageUrl;
      if (oldImageUrl) {
        const oldBucketPath = oldImageUrl.split('/storage/v1/object/public/sample-images/')[1];
        if (oldBucketPath) {
          await supabase.storage
            .from('sample-images')
            .remove([oldBucketPath])
            .catch((error) => {
              console.error('Failed to delete old AI image from storage:', error);
              // Continue even if deletion fails
            });
        }
      }

      // Update existing record
      const [updatedRecord] = await db
        .update(sampleImageAi)
        .set({
          imageUrl,
          createdAt: new Date(), // Update timestamp
        })
        .where(eq(sampleImageAi.originalSampleImageId, originalSampleImageId))
        .returning();

      aiImageRecord = updatedRecord;
    } else {
      // Insert new record
      const [newRecord] = await db
        .insert(sampleImageAi)
        .values({
          id: crypto.randomUUID(),
          originalSampleImageId,
          imageUrl,
        })
        .returning();

      aiImageRecord = newRecord;
    }

    // Revalidate cache
    revalidateTag(CACHE_TAGS.samples);
    revalidateTag(`sample-image-${originalSampleImageId}`);
    revalidatePath('/organizations');

    return NextResponse.json({ success: true, aiImage: aiImageRecord });
  } catch (error: any) {
    console.error('Error saving AI image:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

