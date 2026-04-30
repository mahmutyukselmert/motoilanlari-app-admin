//import { getDatabase, ref, child, get, update } from "firebase/database";

// Parametreler
//const chatId = "tt2M01KHn3R1OLuzfWyW";
//const ilanSahibiId = "0JCcuHHMMngWCRpz8yoQBNZgPmq1";
//const mesajMetni = "Bir test mesajı";

/*
async function mesajGonder() {
    const db = getDatabase();
    const dbRef = ref(db);

    try {
        const snapshot = await get(child(dbRef, `chats/${chatId}`));
        if (!snapshot.exists()) {
            console.error("Chat bulunamadı");
            return;
        }

        const sohbetler = snapshot.val(); // sohbet: chatId altında kullanıcıID → chatData

        const guncellemeler: any = {};
        const timestamp = Date.now();

        Object.entries(sohbetler).forEach(([userId, chatData]: [string, any]) => {
            const newMsgKey = Date.now().toString() + "_" + Math.floor(Math.random() * 10000);
            guncellemeler[`chats/${chatId}/${userId}/messages/${newMsgKey}`] = {
                message: mesajMetni,
                senderId: ilanSahibiId,
                seen: false,
                timestamp: timestamp,
            };
        });

        await update(dbRef, guncellemeler);
        console.log("Mesajlar gönderildi.");
    } catch (err) {
        console.error("Hata:", err);
    }
}
*/

//console.log("Mesaj gönderme işlemi tamamlandı.");

import MessageSender from "./MessageSender";

export default function Page({ params }: { params: { adId: string } }) {
  return <MessageSender adId={params.adId} />;
}