"use client";

import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebaseConfig";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie"; // js-cookie kütüphanesini kullanıyoruz.

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    const handleLogin = async () => {
        setLoading(true);
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const token = await userCredential.user.getIdToken(); // Firebase token'ı al
            Cookies.set("authToken", token, { expires: 1 }); // Token'ı çereze kaydet (1 gün geçerli)

            router.push("/admin/dashboard"); // Başarıyla giriş yaptıysa admin paneline yönlendir
        } catch (err) {
            console.log(err);
            setError("Giriş hatası. Lütfen bilgilerinizi kontrol edin.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex justify-center items-center min-h-screen flex-col">
            <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-md">
                <h2 className="text-xl font-semibold mb-4">Admin Giriş</h2>
                {error && <p className="text-red-500 mb-4">{error}</p>}
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="E-posta"
                    className="w-full p-3 mb-4 border border-gray-300 rounded"
                />
                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Şifre"
                    className="w-full p-3 mb-4 border border-gray-300 rounded"
                />
                <button
                    onClick={handleLogin}
                    disabled={loading}
                    className="w-full py-3 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                    {loading ? "Yükleniyor..." : "Giriş Yap"}
                </button>
            </div>
            <footer className="p-5">
                <b>Motoilanlari</b> Yönetim Paneli | <b>Powered by: </b>
                <a href={'https://mahmutyukselmert.github.io'} target={'_blank'}>Mahmut Yüksel MERT</a>
            </footer>
        </div>

    );
}
