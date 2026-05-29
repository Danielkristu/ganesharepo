import { NextResponse, type NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("ganesha_token")?.value;

  // Protect Admin Routes
  if (request.nextUrl.pathname.startsWith("/dashboard") || request.nextUrl.pathname.startsWith("/admin")) {
    if (!token) {
      return NextResponse.redirect(new URL("/login?error=unauthorized", request.url));
    }
    
    try {
      // Decode the JWT payload without verifying the signature
      // (The backend FastAPI Gatekeeper handles true verification and authorization)
      const base64Url = token.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split("")
          .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join("")
      );
      
      const payload = JSON.parse(jsonPayload);
      
      if (payload.role !== "admin") {
        return NextResponse.redirect(new URL("/login?error=forbidden", request.url));
      }
    } catch (err) {
      // If parsing fails, force them to login again
      return NextResponse.redirect(new URL("/login?error=invalid_token", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard", "/dashboard/:path*", "/admin", "/admin/:path*"],
};
