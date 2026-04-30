"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getDatabase, ref, child, get } from "firebase/database";
import Image from "next/image";
import Link from "next/link";

interface Message {
    timestamp: number;
    message: string;
    senderId: string;
    seen: boolean;
}

interface MessageBox {
    chatId: string;
    adId: string;
    adTitle: string;
    adPhoto: string | null;
    messages: Message[];
    lastTimestamp: number;
}

export default function UserMessagesPage() {
    const params = useParams();
    const adId = params.adId as string;

    const [chats, setChats] = useState<MessageBox[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchChats = async () => {
            setLoading(true);
            const db = getDatabase();
            const dbRef = ref(db);

            let totalMessageCount = 0;

            try {
                const snapshot = await get(child(dbRef, `chats/${adId}`));
                if (!snapshot.exists()) {
                    setChats([]);
                    return;
                }

                const data = snapshot.val();
                const chatList: MessageBox[] = (
                    await Promise.all(
                        Object.entries(data).map(async ([chatId, chatData]: [string, any]) => {
                            const messagesObj = chatData.messages || {};
                            const messages = Object.values(messagesObj) as Message[];

                            if (!messages || messages.length === 0) return null;

                            // Mesajları yeniden → eskiye sırala
                            messages.sort((a, b) => b.timestamp - a.timestamp);

                            const lastTimestamp = messages[0]?.timestamp || 0;

                            // İki tarih aralığı belirle (örnek olarak temmuz ayı)
                            const startDate = new Date("2025-07-28T00:00:00").getTime();
                            const endDate = new Date("2025-07-28T01:34:00").getTime();

                            // O tarih aralığındaki mesajları filtrele
                            const filteredMessages = messages.filter(
                                (msg) => msg.timestamp >= startDate && msg.timestamp <= endDate
                            );

                            const messageCount = filteredMessages.length; 

                            totalMessageCount += messageCount;

                            return {
                                chatId,
                                adId: chatData.adId,
                                adTitle: chatData.adTitle,
                                adPhoto: chatData.adPhoto,
                                messages,
                                lastTimestamp,
                                messageCount
                            };
                        })
                    )
                ).filter(Boolean); // null olanları sil
                // Chat kutularını son mesaja göre sırala (yeniden → eskiye)
                chatList.sort((a, b) => b.lastTimestamp - a.lastTimestamp);

                setChats(chatList);
            } catch (err) {
                console.error("Chat alınamadı:", err);
            } finally {
                setLoading(false);
            }
        };

        if (adId) fetchChats();
    }, [adId]);

    console.log("Toplam mesaj sayısı:", chats.reduce((acc, chat) => acc + chat.messageCount, 0));

    return (
        <ul className="space-y-4">
            {chats.map((chat) => (
                <li key={chat.chatId} className="border p-4 rounded shadow-sm">
                    <div className="flex items-center gap-4">

                        {chat?.adPhoto && <Image src={chat.adPhoto} alt={chat.adTitle} width={80} height={80} className="rounded" />}

                        <div className="flex-1">
                            <p><strong>İlan:</strong> <Link href={`/admin/ads/${chat.adId}`} className="text-blue-600">{chat.adTitle}</Link></p>
                            <p><strong>Chat ID:</strong> {chat.chatId}</p>
                            <p><strong>Bu ayki mesaj sayısı:</strong> {chat.messageCount}</p>
                        </div>
                    </div>

                    <div className="mt-3">
                        <p className="font-bold text-sm mb-2">Mesajlar (yeniden → eskiye):</p>
                        <ul className="pl-4 list-disc space-y-1">
                            {chat.messages.map((msg, i) => (
                                <li key={i}>
                                    <span className="text-gray-600 text-sm">
                                        [{new Date(msg.timestamp).toLocaleString()}]
                                    </span>{" "}
                                    {msg.message}
                                </li>
                            ))}
                        </ul>
                    </div>
                </li>
            ))}
        </ul>
    );
}
