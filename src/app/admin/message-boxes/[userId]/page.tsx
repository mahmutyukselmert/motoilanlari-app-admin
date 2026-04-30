"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getDatabase, ref, child, get } from "firebase/database";
import Image from "next/image";
import Link from "next/link";

interface MessageBox {
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

export default function UserMessagesPage() {
    const params = useParams();
    const userId = params.userId as string;

    const [chats, setChats] = useState<MessageBox[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchChats = async () => {
            setLoading(true);
            const db = getDatabase();
            const dbRef = ref(db);

            try {
                const snapshot = await get(child(dbRef, `messageBoxes/${userId}`));
                if (snapshot.exists()) {
                    const data = snapshot.val();
                    const chatList: MessageBox[] = Object.keys(data).map((chatId) => ({
                        chatId,
                        ...data[chatId]
                    }));
                    chatList.sort((a, b) => b.timestamp - a.timestamp);
                    setChats(chatList);
                } else {
                    setChats([]);
                }
            } catch (err) {
                console.error("Chat kutuları alınamadı:", err);
            } finally {
                setLoading(false);
            }
        };

        if (userId) fetchChats();
    }, [userId]);

    return (
        <div className="p-4">
            <h2 className="text-xl font-bold mb-4">Kullanıcı ID: {userId}</h2>
            {loading ? (
                <p>Yükleniyor...</p>
            ) : chats.length === 0 ? (
                <p>Bu kullanıcıya ait mesaj kutusu yok.</p>
            ) : (
                <ul className="space-y-4">
                    {chats.map((chat) => (
                        <li key={chat.chatId} className="border p-4 rounded shadow-sm flex items-center gap-4">
                            <Image src={chat.adPhoto} alt={chat.adTitle} width={80} height={80} className="rounded" />
                            <div className="flex-1">
                                <p><strong>İlan:</strong> <Link href={`/admin/ads/${chat.adId}`} className="text-blue-600">{chat.adTitle}</Link></p>
                                <p><strong>Son Mesaj:</strong> {chat.lastMessage}</p>
                                <p><strong>Okunmamış:</strong> {chat.unreadCount}</p>
                                <p><strong>Chat ID:</strong> {chat.chatId}</p>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
