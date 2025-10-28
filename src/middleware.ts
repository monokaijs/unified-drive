import {NextResponse} from "next/server";
import type {NextRequest} from "next/server";

export async function middleware(request: NextRequest) {
  const {pathname} = request.nextUrl;

  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    pathname === "/setup"
  ) {
    return NextResponse.next();
  }

  try {
    const baseUrl = request.nextUrl.origin;
    const response = await fetch(`${baseUrl}/api/setup/status`, {
      headers: {
        cookie: request.headers.get("cookie") || "",
      },
    });

    if (response.ok) {
      const data = await response.json();

      if (!data.data?.isSetupComplete) {
        return NextResponse.redirect(new URL("/setup", request.url));
      }
    }
  } catch (error) {
    console.error("Error checking setup status:", error);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api).*)",
  ],
};

