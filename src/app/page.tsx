"use client";  // Tarayıcıda çalışan bir bileşen olarak işaretle

import { useEffect } from "react";

export default function Home() {
    useEffect(() => {
        // Sayfa tarayıcıda yüklenmişse yönlendirme yapılır
        window.location.href = "/admin/login";
    }, []);

    return null; // Sayfa içeriği render edilmez
}
