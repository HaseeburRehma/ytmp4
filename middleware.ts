import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  // Handle socket.io requests
  if (request.nextUrl.pathname.startsWith("/socket.io")) {
    return NextResponse.rewrite(new URL("/api/socket", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/socket.io/:path*"],
}
