/**
 * Next.js API Route — Proxy to FastAPI backend.
 * Route: /api/proxy/[...path]
 */
import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

async function handler(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const pathStr = path.join("/");
  const search = req.nextUrl.search;
  const targetUrl = `${BACKEND_URL}/api/v1/${pathStr}${search}`;

  console.log(`[Proxy] ${req.method} → ${targetUrl}`);

  const body =
    req.method !== "GET" && req.method !== "HEAD"
      ? await req.text()
      : undefined;

  const headers: Record<string, string> = {
    "Content-Type": req.headers.get("Content-Type") || "application/json",
  };

  const authHeader = req.headers.get("Authorization");
  if (authHeader) {
    headers["Authorization"] = authHeader;
  }

  try {
    const backendResponse = await fetch(targetUrl, {
      method: req.method,
      headers,
      body,
      redirect: "manual",
    });

    const responseBody = await backendResponse.text();
    console.log(`[Proxy] Response ${backendResponse.status} from FastAPI`);

    return new NextResponse(responseBody, {
      status: backendResponse.status,
      headers: {
        "Content-Type":
          backendResponse.headers.get("Content-Type") ?? "application/json",
      },
    });
  } catch (err: any) {
    // This fires when FastAPI is not running (ECONNREFUSED)
    console.error("[Proxy] Failed to reach FastAPI:", err.message);
    return NextResponse.json(
      {
        detail: `Cannot reach backend server at ${BACKEND_URL}. Is your FastAPI (uvicorn) running? Error: ${err.message}`,
      },
      { status: 502 }
    );
  }
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
