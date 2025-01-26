import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    const token = request.cookies.get("authToken"); // Çerezde authToken varsa giriş yapmıştır
    // Kullanıcı giriş yapmışsa ve login sayfasına gidiyorsa, dashboard'a yönlendir
    if (token && pathname === "/admin/login") {
        return NextResponse.redirect(new URL("/admin/dashboard", request.url));
    }

    // Kullanıcı giriş yapmamışsa ve admin sayfalarına erişmeye çalışıyorsa, login'e yönlendir
    if (!token && pathname.startsWith("/admin") && pathname !== "/admin/login") {
        return NextResponse.redirect(new URL("/admin/login", request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/admin/:path*"],
};
