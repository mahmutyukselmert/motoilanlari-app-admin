"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebaseConfig";
import { User, onAuthStateChanged } from "firebase/auth";
import AdminHeader from "@/app/components/AdminHeader";
import AdminSidebar from "@/app/components/AdminSidebar";
import AdminFooter from "@/app/components/AdminFooter";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<User | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(false); // Sidebar durumu

    const router = useRouter();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (!currentUser) {
                console.log("Kullanıcı giriş yapmamış");
                router.push("/admin/login"); // Kullanıcı giriş yapmadıysa login sayfasına yönlendir
            } else {
                setUser(currentUser);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [router]);

    if (loading) {
        return <div className="flex justify-center items-center min-h-screen">Yükleniyor...</div>;
    }

    // Eğer kullanıcı yoksa sadece login sayfasını render et
    if (!user) {
        return <>{children}</>;
    }

    // Eğer kullanıcı varsa, layout (sidebar ve header) ile sayfa içeriği render edilsin
    return (
        <div className="flex min-h-screen relative">
            {/* Sidebar (Mobil açılıp kapanan) */}
            <AdminSidebar isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
            <div className="flex flex-col flex-1 relative">
                <AdminHeader toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
                <main className="px-6 py-6 min-h-screen">
                    {children}
                </main>
                <AdminFooter />
            </div>
        </div>
    );
}
