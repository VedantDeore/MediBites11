import { v2 as cloudinary } from "cloudinary";

// Configure cloudinary with environment variables
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || '',
  api_key: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY || '',
  api_secret: process.env.NEXT_PUBLIC_CLOUDINARY_API_SECRET || ''
});

export async function POST(request: Request) {
  try {
    // Verify Cloudinary configuration
    if (!process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ||
        !process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY ||
        !process.env.NEXT_PUBLIC_CLOUDINARY_API_SECRET) {
      return Response.json(
        { error: "Cloudinary configuration is missing" },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return Response.json(
        { error: "No file uploaded" },
        { status: 400 }
      );
    }

    // Convert file to base64
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64String = `data:${file.type};base64,${buffer.toString('base64')}`;

    // Upload to Cloudinary with explicit configuration
    const result = await cloudinary.uploader.upload(base64String, {
      resource_type: "auto",
      cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
      api_key: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
      api_secret: process.env.NEXT_PUBLIC_CLOUDINARY_API_SECRET
    });

    return Response.json({
      success: true,
      url: result.secure_url
    });

  } catch (error) {
    console.error('Upload error:', error);
    return Response.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
} 