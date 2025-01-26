"use client";

import {useState} from "react";
import { auth } from "@/lib/firebaseConfig";
import {reauthenticateWithCredential, EmailAuthProvider, updatePassword} from "firebase/auth";
import { useRouter } from "next/navigation";

export default function Page() {
    const [oldPassword, setOldPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const router = useRouter();

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();

        if (newPassword !== confirmPassword) {
            setError("Yeni şifreler eşleşmiyor.");
            return;
        }

        setLoading(true);
        setError("");
        setSuccess("");

        try {
            const user = auth.currentUser;
            if (!user) {
                setError("Kullanıcı girişi yapılmamış.");
                return;
            }

            // Eski şifreyi doğrulamak için reauthenticateWithCredential kullanıyoruz
            const credential = EmailAuthProvider.credential(user.email!, oldPassword);
            await reauthenticateWithCredential(user, credential);

            // Şifreyi güncelleme
            await updatePassword(user, newPassword);
            setSuccess("Şifreniz başarıyla değiştirildi.");
            setOldPassword("");
            setNewPassword("");
            setConfirmPassword("");

            // Başarı ile şifre değiştirme sonrası başka bir sayfaya yönlendirebilirsiniz (örneğin dashboard)
            router.push("/admin/dashboard");

        } catch (err) {
            setError("Hata oluştu: " + (err instanceof Error ? err.message : "Bilinmeyen bir hata"));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-md mx-auto mt-10 p-4 border border-gray-300 rounded-lg shadow-lg">
            <h2 className="text-2xl font-semibold text-center mb-4">Şifreyi Değiştir</h2>
            {error && <div className="text-red-500 mb-4">{error}</div>}
            {success && <div className="text-green-500 mb-4">{success}</div>}
            <form onSubmit={handleChangePassword}>
                <div className="mb-4">
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                        E-Posta
                    </label>
                    <input
                        type="text"
                        id="email"
                        value={auth.currentUser?.email || ""}
                        disabled={true}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <div className="mb-4">
                    <label htmlFor="oldPassword" className="block text-sm font-medium text-gray-700">
                        Eski Şifre
                    </label>
                    <input
                        type="password"
                        id="oldPassword"
                        value={oldPassword}
                        onChange={(e) => setOldPassword(e.target.value)}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                    />
                </div>
                <div className="mb-4">
                    <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
                        Yeni Şifre
                    </label>
                    <input
                        type="password"
                        id="newPassword"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                    />
                </div>
                <div className="mb-4">
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                        Yeni Şifreyi Tekrar Girin
                    </label>
                    <input
                        type="password"
                        id="confirmPassword"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                    />
                </div>
                <button
                    type="submit"
                    className={`w-full py-2 px-4 bg-blue-500 text-white rounded-md ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
                    disabled={loading}
                >
                    {loading ? "Yükleniyor..." : "Şifreyi Değiştir"}
                </button>
            </form>
        </div>
    );
}
