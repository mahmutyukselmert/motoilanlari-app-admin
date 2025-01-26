import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebaseAdmin";

export async function POST(req: Request) {
    try {
        const { email, password } = await req.json();

        try {
            // Kullanıcıyı oluştur
            await adminAuth.createUser({
                email,
                password,
                emailVerified: true,
                disabled: false,
            });
        } catch (error) {
            // Hata nesnesi "unknown" türünde olduğu için türü belirliyoruz
            const firebaseError = error as { code: string };  // error'ı doğru türde belirtiyoruz

            // Hata koduna göre işlem yapıyoruz
            if (firebaseError.code === "auth/email-already-exists") {
                // Kullanıcı zaten mevcut, işlem yapabiliriz
                // user = await adminAuth.getUserByEmail(email);
            } else {
                throw error; // Diğer hatalar için tekrar fırlatıyoruz
            }
        }

        // Kullanıcının provider'ını kontrol et
        //if (user.providerData.some((provider) => provider.providerId === 'google.com')) {
            //return NextResponse.json({ error: "Bu kullanıcı Google ile kayıt olmuş! Bu eposta adresine admin yetkisi verilemez." }, { status: 400 });
        //}

        // Firestore'da admin yetkisini kontrol et
        const adminRef = adminDb.collection("Admins").doc(email);
        const adminSnap = await adminRef.get();

        if (!adminSnap.exists || !adminSnap.data()?.role) {
            // Eğer admin bilgisi yoksa veya rol atanmadıysa ekleyelim
            await adminRef.set({ role: "admin" }, { merge: true });
            return NextResponse.json({ message: "Admin yetkisi eklendi!" }, { status: 200 });
        }

        return NextResponse.json({ message: "Kullanıcı zaten admin." }, { status: 200 });

    } catch (error) {
        return NextResponse.json({ error: `Admin oluşturulamadı: ${error}` }, { status: 500 });
    }
}
