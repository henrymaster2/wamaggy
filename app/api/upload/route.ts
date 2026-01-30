import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      );
    }

    // ✅ Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'Only image files are allowed' },
        { status: 400 }
      );
    }

    // ✅ Generate safe unique filename
    const ext = file.type.split('/')[1];
    const filename = `${crypto.randomUUID()}.${ext}`;

    // ✅ Ensure upload directory exists
    const uploadDir = path.join(process.cwd(), 'public/uploads/food');
    await mkdir(uploadDir, { recursive: true });

    // ✅ Convert File → Buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // ✅ Save file
    const filePath = path.join(uploadDir, filename);
    await writeFile(filePath, buffer);

    // ✅ Public URL (THIS goes to DB)
    const imageUrl = `/uploads/food/${filename}`;

    return NextResponse.json({ imageUrl }, { status: 200 });
  } catch (error) {
    console.error('UPLOAD ERROR:', error);
    return NextResponse.json(
      { error: 'Failed to upload image' },
      { status: 500 }
    );
  }
}
