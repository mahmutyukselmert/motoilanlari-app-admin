import { NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebaseAdmin";

export async function PATCH(req: Request) {
    try {
        const { email, password } = await req.json();

        // Firebase Authentication'da kullanıcıyı al
        const user = await adminAuth.getUserByEmail(email);

        //console.log(email);
        //console.log(password);

        // Şifreyi güncelle
        await adminAuth.updateUser(user.uid, { password: password });

        return NextResponse.json({ message: "Şifre başarıyla güncellendi." }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: `Şifre güncellenirken hata oluştu: ${error}` }, { status: 500 });
    }
}
