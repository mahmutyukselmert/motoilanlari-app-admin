"use client";

import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";

export default function Dashboard() {
    const [totalUsers, setTotalUsers] = useState(0);
    const [totalAds, setTotalAds] = useState(0);
    const [pendingAds, setPendingAds] = useState(0);

    useEffect(() => {
        const fetchCounts = async () => {
            const usersSnapshot = await getDocs(collection(db, "Users"));
            setTotalUsers(usersSnapshot.size);

            const adsSnapshot = await getDocs(collection(db, "Ads"));
            setTotalAds(adsSnapshot.size);

            const pendingSnapshot = await getDocs(
                collection(db, "Ads")
            );
            const pendingCount = pendingSnapshot.docs.filter(doc => doc.data().status === "pending").length;
            setPendingAds(pendingCount);
        };

        fetchCounts();
    }, []);

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded shadow text-center">
                <h3 className="text-xl font-bold">Toplam Kullanıcı</h3>
                <p className="text-2xl">{totalUsers}</p>
            </div>
            <div className="bg-white p-6 rounded shadow text-center">
                <h3 className="text-xl font-bold">Toplam İlan</h3>
                <p className="text-2xl">{totalAds}</p>
            </div>
            <div className="bg-white p-6 rounded shadow text-center">
                <h3 className="text-xl font-bold">Onay Bekleyen İlan</h3>
                <p className="text-2xl">{pendingAds}</p>
            </div>
        </div>
    );
}
