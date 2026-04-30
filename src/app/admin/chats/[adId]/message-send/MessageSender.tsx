"use client";

import { useEffect } from "react";
import { getDatabase, ref, get, set, push } from "firebase/database";
import app from "@/lib/firebaseConfig";
import { useParams } from "next/navigation";

const MESSAGE_TEXT = "Katılımınız için teşekkürler. Instagram hesabımız @ismail.muhammed16 üzerinden paylaşım yaptık. Kazanan belli oldu. Sonuçları oradan görebilsiniz.";
const SENDER_ID = "0JCcuHHMMngWCRpz8yoQBNZgPmq1";

export default function MessageSendPage() {
    const params = useParams();
    const adId = params?.adId as string;

    return false;

    useEffect(() => {
        if (!adId) return;

        const sendMessageToAll = async () => {
            const db = getDatabase(app);
            const chatsRef = ref(db, `chats/${adId}`);

            try {
                const snapshot = await get(chatsRef);
                if (!snapshot.exists()) {
                    console.log("Chat verisi yok.");
                    return;
                }

                const data = snapshot.val();
                const now = Date.now();

                for (const chatId in data) {
                    const messagesRef = ref(db, `chats/${adId}/${chatId}/messages`);
                    const newMessageRef = push(messagesRef);
                    await set(newMessageRef, {
                        message: MESSAGE_TEXT,
                        senderId: SENDER_ID,
                        seen: false,
                        timestamp: now,
                    });
                    console.log(`Mesaj gönderildi → ${chatId}`);
                }

                alert("Tüm kişilere test mesajı gönderildi.");
            } catch (error) {
                console.error("Mesaj gönderilemedi:", error);
            }
        };

        sendMessageToAll();
    }, [adId]);

    return (
        <div className="p-8">
            <h1 className="text-xl font-bold">Mesajlar gönderiliyor...</h1>
        </div>
    );
}