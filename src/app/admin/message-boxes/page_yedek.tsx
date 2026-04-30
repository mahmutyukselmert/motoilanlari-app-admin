"use client";

import { useEffect, useState } from "react";
import { getDatabase, ref, get, child } from "firebase/database";
import Image from 'next/image';
import Link from "next/link";

interface MessageBoxes {
    adId: string;
    adPhoto: string;
    adTitle: string;
    chatId: string;
    lastMessage: string;
    otherUserId: string;
    otherUserName: string;
    timestamp: number;
    unreadCount: number;
}

export default function AdminMessageBoxesPage() {
    const [messageBoxes, setMessageBoxes] = useState<MessageBoxes[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMessageBoxes = async () => {
            setLoading(true);
            const db = getDatabase();
            const dbRef = ref(db);
            const allBoxes: MessageBoxes[] = [];

            try {
                const snapshot = await get(child(dbRef, 'messageBoxes'));
                if (snapshot.exists()) {
                    const data = snapshot.val();

                    for (const userId in data) {
                        const userChats = data[userId];
                        for (const chatId in userChats) {
                            allBoxes.push({
                                chatId,
                                ...userChats[chatId]
                            });
                        }
                        if (allBoxes.length >= 100) break;
                    }

                    // Timestamp'e göre sırala (yeniden eskiye)
                    allBoxes.sort((a, b) => b.timestamp - a.timestamp);
                    setMessageBoxes(allBoxes);
                } else {
                    setMessageBoxes([]);
                }
            } catch (err) {
                console.error("Veri alınırken hata:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchMessageBoxes();
    }, []);

    return (
        <div className="relative overflow-hidden">
            <h1 className="text-2xl font-bold mb-4">Mesaj Kutuları</h1>
            {loading ? (
                <p>Yükleniyor...</p>
            ) : messageBoxes.length === 0 ? (
                <p>Mesaj kutusu bulunamadı.</p>
            ) : (
                <ul className="space-y-4">
                    {messageBoxes.map((box, index) => (
                        <li key={box.chatId + index} className="p-4 border rounded shadow-sm flex items-center gap-4">
                            <Image
                                src={box.adPhoto}
                                alt={box.adTitle}
                                width={80}
                                height={80}
                                className="rounded object-cover"
                            />
                            <div className="flex-1">
                                <p><strong>İlan Başlığı:</strong> {box.adTitle} - İlan ID: 
                                    <Link href={`/admin/ads/${box.adId}`}>{box.adId}</Link>
                                </p>
                                <p><strong>Kullanıcı:</strong> {box.otherUserName}</p>
                                <p><strong>Son Mesaj:</strong> {box.lastMessage}</p>
                                <p><strong>Okunmamış:</strong> {box.unreadCount}</p>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
