import { NextResponse } from "next/server";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { r2 } from "@/lib/r2-storage";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const fileUrl = searchParams.get("url");

    if (!fileUrl) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    // Extract object key from file_url
    // Format: ${NEXT_PUBLIC_R2_PUBLIC_URL}/{objectKey}
    // We want: {objectKey}
    const publicBase = process.env.NEXT_PUBLIC_R2_PUBLIC_URL;
    let objectKey: string | null = null;

    if (publicBase && fileUrl.startsWith(`${publicBase}/`)) {
      objectKey = fileUrl.slice(publicBase.length + 1);
    } else {
      const urlParts = fileUrl.split("/");
      const knownFolders = ["uploads", "materials", "thumbnails"];
      const folderIndex = urlParts.findIndex((part) => knownFolders.includes(part));
      if (folderIndex !== -1) {
        objectKey = urlParts.slice(folderIndex).join("/");
      }
    }

    if (!objectKey) {
      // Fallback if structure is different
      return NextResponse.redirect(fileUrl);
    }
    const bucketName = process.env.R2_BUCKET_NAME || "ganesha-documents";

    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: objectKey,
    });

    // Generate a temporary signed URL (valid for 5 minutes)
    const signedUrl = await getSignedUrl(r2, command, { expiresIn: 300 });

    // Proxy the object through Next.js so browser PDF viewers can fetch it without cross-origin issues.
    const objectResponse = await fetch(signedUrl);
    if (!objectResponse.ok) {
      return NextResponse.json({ error: "Failed to fetch file from storage" }, { status: 502 });
    }

    const headers = new Headers();
    const contentType = objectResponse.headers.get("content-type");
    if (contentType) headers.set("content-type", contentType);

    const contentDisposition = objectResponse.headers.get("content-disposition");
    if (contentDisposition) headers.set("content-disposition", contentDisposition);

    const contentLength = objectResponse.headers.get("content-length");
    if (contentLength) headers.set("content-length", contentLength);

    return new NextResponse(objectResponse.body, {
      status: objectResponse.status,
      headers,
    });
  } catch (error: any) {
    console.error("View proxy error:", error);
    return NextResponse.json({ error: "Failed to generate view URL" }, { status: 500 });
  }
}
