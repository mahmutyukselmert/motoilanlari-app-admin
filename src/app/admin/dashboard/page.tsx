"use client";

import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faMotorcycle, 
    faCalendarDay, 
    faHourglassHalf, 
    faCheckCircle, 
    faPencilAlt, 
    faBan,
    faUserPlus
} from "@fortawesome/free-solid-svg-icons";
import Link from "next/link";

type AdStatus = 'pending' | 'publish' | 'draft' | 'rejected';

type AdStats = {
    total: number;
    pending: number;
    publish: number;
    draft: number;
    rejected: number;
    todayad: number;
};

type UserStats = {
    total: number;
    today: number;
};

export default function Dashboard() {
    const [userStats, setUserStats] = useState<UserStats>({
        total: 0,
        today: 0
    });
    const [adStats, setAdStats] = useState<AdStats>({
        total: 0,
        pending: 0,
        publish: 0,
        draft: 0,
        rejected: 0,
        todayad: 0
    });

    useEffect(() => {
        const fetchCounts = async () => {
            // Get today's date with time set to 00:00:00
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            // Fetch users count
            const usersSnapshot = await getDocs(collection(db, "Users"));
            const userStatsData: UserStats = {
                total: usersSnapshot.size,
                today: 0
            };
            
            // Count users created today
            usersSnapshot.docs.forEach(doc => {
                const userData = doc.data();
                if (userData.createdAt) {
                    const createdDate = userData.createdAt.toDate();
                    createdDate.setHours(0, 0, 0, 0); // Reset time part for comparison
                    
                    if (createdDate.getTime() === today.getTime()) {
                        userStatsData.today++;
                    }
                }
            });
            
            setUserStats(userStatsData);

            // Fetch ads and count by status
            const adsSnapshot = await getDocs(collection(db, "Ads"));
            const stats: AdStats = {
                total: adsSnapshot.size,
                pending: 0,
                publish: 0,
                draft: 0,
                rejected: 0,
                todayad: 0
            };

            // Count ads by status
            adsSnapshot.docs.forEach(doc => {
                const adData = doc.data();
                const status = adData.status as AdStatus;
                
                // Count by status
                if (status && ['pending', 'publish', 'draft', 'rejected'].includes(status)) {
                    stats[status]++;
                }
                
                // Check if ad was created today
                if (adData.createdAt) {
                    const createdDate = adData.createdAt.toDate();
                    createdDate.setHours(0, 0, 0, 0); // Reset time part for comparison
                    
                    if (createdDate.getTime() === today.getTime()) {
                        stats.todayad++;
                    }
                }
            });

            setAdStats(stats);
        };

        fetchCounts();
    }, []);

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            
            <Link href="/admin/ads?status=pending" className="block">
                <div className="bg-white p-6 rounded shadow text-center hover:bg-gray-50 transition-colors cursor-pointer">
                    <div className="flex justify-center mb-2 text-yellow-500">
                        <FontAwesomeIcon icon={faHourglassHalf} size="2x" />
                    </div>
                    <h3 className="text-xl font-bold">Onay Bekleyen İlan</h3>
                    <p className="text-2xl">{adStats.pending}</p>
                </div>
            </Link>
            
            <div className="bg-white p-6 rounded shadow text-center">
                <div className="flex justify-center mb-2 text-blue-400">
                    <FontAwesomeIcon icon={faUserPlus} size="2x" />
                </div>
                <h3 className="text-xl font-bold">Bugün Kayıt Olan</h3>
                <p className="text-2xl">{userStats.today}</p>
            </div>
            
            <Link href="/admin/ads" className="block">
                <div className="bg-white p-6 rounded shadow text-center hover:bg-gray-50 transition-colors cursor-pointer">
                    <div className="flex justify-center mb-2 text-green-500">
                        <FontAwesomeIcon icon={faMotorcycle} size="2x" />
                    </div>
                    <h3 className="text-xl font-bold">Toplam İlan</h3>
                    <p className="text-2xl">{adStats.total}</p>
                </div>
            </Link>
            
            <Link href="/admin/ads" className="block">
                <div className="bg-white p-6 rounded shadow text-center hover:bg-gray-50 transition-colors cursor-pointer">
                    <div className="flex justify-center mb-2 text-purple-500">
                        <FontAwesomeIcon icon={faCalendarDay} size="2x" />
                    </div>
                    <h3 className="text-xl font-bold">Bugün Yayınlanan</h3>
                    <p className="text-2xl">{adStats.todayad}</p>
                </div>
            </Link>
            
            <Link href="/admin/ads?status=publish" className="block">
                <div className="bg-white p-6 rounded shadow text-center hover:bg-gray-50 transition-colors cursor-pointer">
                    <div className="flex justify-center mb-2 text-green-600">
                        <FontAwesomeIcon icon={faCheckCircle} size="2x" />
                    </div>
                    <h3 className="text-xl font-bold">Yayınlanan İlan</h3>
                    <p className="text-2xl">{adStats.publish}</p>
                </div>
            </Link>
            
            <Link href="/admin/ads?status=draft" className="block">
                <div className="bg-white p-6 rounded shadow text-center hover:bg-gray-50 transition-colors cursor-pointer">
                    <div className="flex justify-center mb-2 text-gray-500">
                        <FontAwesomeIcon icon={faPencilAlt} size="2x" />
                    </div>
                    <h3 className="text-xl font-bold">Taslak İlan</h3>
                    <p className="text-2xl">{adStats.draft}</p>
                </div>
            </Link>
            
            <Link href="/admin/ads?status=rejected" className="block">
                <div className="bg-white p-6 rounded shadow text-center hover:bg-gray-50 transition-colors cursor-pointer">
                    <div className="flex justify-center mb-2 text-red-500">
                        <FontAwesomeIcon icon={faBan} size="2x" />
                    </div>
                    <h3 className="text-xl font-bold">Reddedilen İlan</h3>
                    <p className="text-2xl">{adStats.rejected}</p>
                </div>
            </Link>
        </div>
    );
}
