import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary (Add these to your Render Env Variables)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 });

    // Convert file to base64 for Cloudinary
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Image = `data:${file.type};base64,${buffer.toString('base64')}`;

    // ✅ Upload to Cloudinary instead of local folder
    const response = await cloudinary.uploader.upload(base64Image, {
      folder: 'restaurant_food',
    });

    // ✅ This URL is permanent and won't disappear!
    return NextResponse.json({ imageUrl: response.secure_url }, { status: 200 });

  } catch (error) {
    console.error('UPLOAD ERROR:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}