import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const allowedApiIps: string[] = [];

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Eğer API'ye istek atılıyorsa (örneğin /api/createAdmin)
    if (pathname.startsWith("/api/")) {
        const clientIp = request.headers.get("x-forwarded-for") || "";

        // IP adresi izinli IP'ler arasında mı?
        if (!clientIp || !allowedApiIps.includes(clientIp)) {
            // İzin verilmiş IP adresi değilse, hata mesajı döndür
            return NextResponse.json({
                error: "IP adresiniz bu API'ye erişim için izinli değil. IP Adresiniz: " + clientIp,
            }, { status: 403 });
        }
    }

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
    matcher: ["/admin/:path*", "/api/:path*"], // Hem admin sayfalarını hem de /api/createAdmin API'sini kontrol et
};
