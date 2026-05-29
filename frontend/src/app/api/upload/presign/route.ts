import { NextResponse } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { r2 } from "@/lib/r2-storage";

export async function POST(req: Request) {
  try {
    const { filename, contentType, folder = "uploads" } = await req.json();

    if (!filename || !contentType) {
      return NextResponse.json(
        { error: "Filename and contentType are required" },
        { status: 400 }
      );
    }

    const bucketName = process.env.R2_BUCKET_NAME || "documents";
    const safeFolder = String(folder).replace(/[^a-zA-Z0-9_-]/g, "").toLowerCase() || "uploads";
    const objectKey = `${safeFolder}/${Date.now()}-${filename.replace(/[^a-zA-Z0-9.-]/g, "_")}`;

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: objectKey,
      ContentType: contentType,
    });

    // URL expires in 15 minutes (900 seconds)
    const presignedUrl = await getSignedUrl(r2, command, { expiresIn: 900 });

    const publicUrl = `${process.env.NEXT_PUBLIC_R2_PUBLIC_URL}/${objectKey}`;

    return NextResponse.json({
      presignedUrl,
      publicUrl,
      objectKey,
    });
  } catch (error: any) {
    console.error("Presign error:", error);
    return NextResponse.json(
      { error: "Failed to generate upload URL" },
      { status: 500 }
    );
  }
}
