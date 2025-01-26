import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";

export async function DELETE(req: Request) {
    try {
        const { email } = await req.json();

        // Admin rolünü Firestore'dan sil
        const adminRef = adminDb.collection("Admins").doc(email);
        const adminSnap = await adminRef.get();

        if (!adminSnap.exists) {
            return NextResponse.json({ error: "Admin bulunamadı." }, { status: 404 });
        }

        // Firestore'dan admin rolünü kaldır
        await adminRef.delete();

        // Firebase Authentication'dan kullanıcıyı sil
        //await adminAuth.deleteUser((await adminAuth.getUserByEmail(email)).uid);

        return NextResponse.json({ message: "Admin yetkisi başarıyla kaldırıldı." }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: `Admin yetkisi kaldırılırken hata oluştu: ${error}` }, { status: 500 });
    }
}
