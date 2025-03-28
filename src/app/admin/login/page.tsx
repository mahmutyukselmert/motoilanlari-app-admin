"use client";

import { useState } from "react";
import { signInWithEmailAndPassword, getAuth } from "firebase/auth";
//import { auth } from "@/lib/firebaseConfig";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie"; // js-cookie kütüphanesini kullanıyoruz.
//import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
//import { db } from "@/lib/firebaseConfig";

export default function Login() {

    //const [uid, setUid] = useState<string | null>(null);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    const auth = getAuth();

    /*
    const formatPhoneNumber = (phone: string): string => {
        if (!phone.startsWith('+')) {
            return phone.startsWith('0') 
                ? '+90 ' + phone.substring(1) 
                : '+90 ' + phone;
        }
        return phone;
    };

    const handleSmsLogin = async () => {
        // Telefon numarasını uluslararası formata çevir
        const phoneNumber = formatPhoneNumber(email);
        
        console.log("Telefon numarası:", phoneNumber);

        // Telefon numarasına göre sorgulama
        const q = query(
            collection(db, "Users"), 
            where("phone", "==", phoneNumber)
        );
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            console.log("Telefon numarası ile kayıtlı kullanıcı bulunamadı!");
        } else {
            querySnapshot.forEach((doc) => {
                const userData = doc.data();
                console.log("Kullanıcı UID:", doc.id);  // UID burada doc.id olarak gelir
                setUid(doc.id);

                // Kullanıcı UID'sini çerezlere kaydet
                if (password == '733200') {
                    const token = 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJodHRwczovL2lkZW50aXR5dG9vbGtpdC5nb29nbGVhcGlzLmNvbS9nb29nbGUuaWRlbnRpdHkuaWRlbnRpdHl0b29sa2l0LnYxLklkZW50aXR5VG9vbGtpdCIsImlhdCI6MTc0MzEzNDEzNywiZXhwIjoxNzQzMTM3NzM3LCJpc3MiOiJmaXJlYmFzZS1hZG1pbnNkay0yMTNhd0Btb3RvaWxhbmxhcmktZjgzZDMuaWFtLmdzZXJ2aWNlYWNjb3VudC5jb20iLCJzdWIiOiJmaXJlYmFzZS1hZG1pbnNkay0yMTNhd0Btb3RvaWxhbmxhcmktZjgzZDMuaWFtLmdzZXJ2aWNlYWNjb3VudC5jb20iLCJ1aWQiOiJqU1lJOVg4T2pZWjNIa1VwNUpqazkzT0pLVGIyIn0.arzk9OVDRVSmCpTC_woGki_lZIqH8YhSk41jv-e0yLxO6o4wYbkE2wiaaCtELets0fZBdxS5XQXFsPIcTDhE-C3xeiuCCKTQhZ3MIrGK1lyWjWfGJKQYtrJa3g64HinyXu4FpUjSyt3hPvVWqcDX52nrYE8NVfuEgNyD4bCcczHv1dQGPneHSm4A0f4cvvOBICpSLUz8qh757pQxNMDTGhgVJpZ7-Vi6f3uKC-ImIelCpCuV_CXuw4Tw-xOw5hVH_QDKplTfOBtDAD6-H5ECB0DS6hFO-NJQnv6fpCjGt1DqYtXB0YcRunCO2luUpZkF1mfq3Q90elY3BPb4x7ScjQ';
                    const auth = getAuth();
                    signInWithCustomToken(auth, token)
                    .then((userCredential) => {
                        // Signed in
                        const user = userCredential.user;
                        console.log("Giriş başarılı!", user);
                        Cookies.set("authToken", token, { expires: 1 });
                        // ...
                    })
                    .catch((error) => {
                        const errorCode = error.code;
                        const errorMessage = error.message;
                        console.log("Giriş hatası:", errorCode, errorMessage);
                    });
                }
            });
        }
    }
    */

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
                <div id="recaptcha-container"></div>
            </div>
            <footer className="p-5">
                <b>Motoilanlari</b> Yönetim Paneli | <b>Powered by: </b>
                <a href={'https://mahmutyukselmert.github.io'} target={'_blank'}>Mahmut Yüksel MERT</a>
            </footer>
        </div>

    );
}
