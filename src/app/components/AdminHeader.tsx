"use client";

import {useEffect, useRef, useState} from "react";
import { auth } from "@/lib/firebaseConfig"; // Firebase Auth'u buradan al
import { onAuthStateChanged, signOut } from "firebase/auth";
import {usePathname, useRouter} from "next/navigation";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faList, faUser} from "@fortawesome/free-solid-svg-icons";

export default function AdminHeader({ toggleSidebar }: { toggleSidebar: () => void }) {
    const pathname = usePathname();
    const router = useRouter();

    const [userEmail, setUserEmail] = useState<string | null>(null);
    const [menuOpen, setMenuOpen] = useState(false); // Menü açık/kapalı durumunu tutacak state
    const menuRef = useRef<HTMLDivElement>(null); // Menü için referans
    const buttonRef = useRef<HTMLButtonElement>(null); // Buton için referans
    const menuAreaRef = useRef<HTMLDivElement>(null); // Menü dışı alanı kontrol etmek için referans

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setUserEmail(user?.email || null);
        });

        return () => unsubscribe();
    }, []);

    const handleLogout = async () => {
        try {
            await signOut(auth);
            document.cookie = "authToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"; // Çerezi sil
            document.location.reload();
            //router.push("/admin/login");
        } catch (error) {
            console.error("Çıkış hatası:", error);
        }
    };

    // Sayfa başlıklarını belirleme
    const pageTitles: Record<string, string> = {
        "/admin/dashboard": "Gösterge Paneli",
        "/admin/ads": "İlan Yönetimi",
        "/admin/users": "Kullanıcı Yönetimi",
        "/admin/change-password": "Şifremi Değiştir",
        "/admin/settings": "Ayarlar",
    };

    // Mevcut URL'ye göre başlığı belirleme
    const title = pageTitles[pathname] || "Admin Panel";

    // Menü dışına tıklanırsa menüyü kapatma
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                menuRef.current &&
                !menuRef.current.contains(event.target as Node) &&
                buttonRef.current &&
                !buttonRef.current.contains(event.target as Node)) {
                setMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    // Menü dışına fare gitse menüyü kapatma
    useEffect(() => {
        const handleMouseLeave = (event: MouseEvent) => {
            // Menü dışına fare gitmişse menüyü kapat
            if (menuAreaRef.current && !menuAreaRef.current.contains(event.target as Node)) {
                setMenuOpen(false);
            }
        };

        // Fare menü alanından çıkarsa menüyü kapat
        if (menuOpen) {
            document.addEventListener("mouseleave", handleMouseLeave);
        }

        return () => {
            document.removeEventListener("mouseleave", handleMouseLeave);
        };
    }, [menuOpen]);

    return (
        <header className="bg-gray-900 text-white px-6 py-4 flex items-center justify-between">
            <div className="flex items-center justify-between">
                {/* 📌 Mobilde Sidebar'ı Açma Butonu */}
                <button onClick={toggleSidebar} className="lg:hidden text-white mr-2">
                    <FontAwesomeIcon icon={faList} />
                </button>
                <h1 className="text-lg font-bold">{title}</h1>
            </div>
            <div className="absolute right-6 z-10">
                {userEmail ? (
                    <div ref={menuAreaRef}>
                        <button
                            ref={buttonRef}
                            onClick={() => setMenuOpen((prev) => !prev)} // Menü durumunu değiştir
                            className="bg-gray-700 px-2 py-1 rounded focus:outline-none"
                        >
                            <FontAwesomeIcon icon={faUser} className={'mr-1'} />
                            {window.innerWidth <= 768 ? userEmail?.split("@")[0] : 'Hoşgeldin, ' + userEmail}
                        </button>
                        {/* Menü */}
                        {menuOpen && (
                            <div
                                ref={menuRef}
                                className="absolute right-0 mt-2 w-48 bg-white text-black rounded shadow-md"
                            >
                                <button
                                    onClick={() => router.push("/admin/change-password")}
                                    className="block px-4 py-2 hover:bg-gray-200 w-full text-left"
                                >
                                    Şifremi Değiştir
                                </button>
                                <button
                                    onClick={handleLogout}
                                    className="block px-4 py-2 hover:bg-gray-200 w-full text-left"
                                >
                                    Çıkış Yap
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    <button
                        onClick={() => router.push("/admin/login")}
                        className="bg-blue-500 px-4 py-2 rounded"
                    >
                        Giriş Yap
                    </button>
                )}
            </div>
        </header>
    );
}
