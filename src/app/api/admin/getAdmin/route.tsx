import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";

export async function GET() {
    try {
        // Adminlerin bulunduğu "Admins" koleksiyonundaki tüm dokümanları al
        const adminRef = adminDb.collection("Admins");
        const snapshot = await adminRef.get();

        if (snapshot.empty) {
            return NextResponse.json({ message: "Hiç admin bulunamadı." }, { status: 404 });
        }

        // Adminleri e-posta bilgileriyle birlikte döndürelim
        const admins = snapshot.docs.map(doc => ({
            email: doc.id, // Doküman ID'si, adminin e-posta adresi
            ...doc.data()  // Admin bilgileri
        }));

        return NextResponse.json(admins, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: `Adminler alınırken hata oluştu: ${error}` }, { status: 500 });
    }
}
