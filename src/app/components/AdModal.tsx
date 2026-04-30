import React, { useEffect, useState } from "react";
import Image from 'next/image';
import { db } from "@/lib/firebaseConfig";
import { doc, getDoc, Timestamp, updateDoc, deleteDoc } from "firebase/firestore";
import { getDatabase, ref as dbRef, remove, get } from "firebase/database";
import { faCopy, faTimes } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { getStorage, ref, deleteObject } from "firebase/storage";
import Link from "next/link";


interface ModalProps {
    isOpen: boolean;
    closeModal: () => void;
    adId: string; // Modal'a sadece id'yi geçiyoruz, detayı burada çekiyoruz
}

interface User {
    name?: string;
    displayName?: string;
    email?: string;
    phone?: string;
    phoneNumber?: string;
    createdAt?: Timestamp;
}

interface Ad {
    id: string;
    title: string;
    price: number;
    photoUrls: string[];
    createdAt: Timestamp;
    status: "publish" | "pending" | "rejected" | "draft";
    brand: string;
    city: string;
    modelYear: number;
    enginePower: number;
    km: number;
    description: string;
    userId: string;
    phoneNumber: string;
    email: string;
    userName: string;
    transmission: string;
    fuelType: string;
    hasTradeIn: boolean;
    hasDamage: boolean;
    isNumberView: boolean;
    deletedAt?: Timestamp;
}

const Modal: React.FC<ModalProps> = ({ isOpen, closeModal, adId }) => {
    const [adDetails, setAdDetails] = useState<Ad | null>(null);
    const [userDetails, setUserDetails] = useState<User | null>(null);

    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    console.log("Modal açıldı, adId:", adId);
    console.log("Modal açık Kullanıcı bilgileri: ", userDetails);

    // Ad detaylarını fetch et
    useEffect(() => {
        if (isOpen && adId) {
            const fetchAdDetails = async () => {
                try {
                    const adRef = doc(db, "Ads", adId);
                    const adDoc = await getDoc(adRef);
                    if (adDoc.exists()) {
                        const adData = adDoc.data() as Ad;
                        adData.id = adId;
                        setAdDetails(adData);

                        // İlanı paylaşan kullanıcının bilgilerini fetch et
                        const userRef = doc(db, "Users", adData.userId); // adData.userId, ilanı paylaşan kullanıcının ID'si
                        const userDoc = await getDoc(userRef);
                        if (userDoc.exists()) {
                            setUserDetails(userDoc.data());
                        } else {
                            console.error("Kullanıcı bilgileri bulunamadı");
                        }
                    } else {
                        console.error("İlan bulunamadı");
                        closeModal(); // İlan bulunamadığında modalı kapat
                    }
                } catch (error) {
                    console.error("İlan detayları alınırken hata oluştu:", error);
                }
            };

            fetchAdDetails();
        }
    }, [isOpen, adId, closeModal]);

    // Eğer adDetails mevcutsa ilk fotoğrafı seç
    useEffect(() => {
        setSelectedImage('/placeholder.jpg');
        if (adDetails && adDetails.photoUrls?.length >= 1) {
            if (adDetails.photoUrls[0] != null && adDetails.photoUrls[0].length > 10) {
                setSelectedImage(adDetails.photoUrls[0]);
            }
        }
    }, [adDetails]);

    // Geçersiz URL kontrolü için yardımcı fonksiyon
    const getValidImageUrl = (url: string | null | undefined): string => {
        if (!url) return '/placeholder.jpg';
        // file:// ile başlayan URL'leri veya geçersiz URL'leri kontrol et
        if (url.startsWith('file://') || url.includes('/data/user/0/')) {
            return '/placeholder.jpg';
        }
        return url;
    };

    const handleCopyAdLink = () => {
        try {
            // Construct the correct URL for the ad
            const baseUrl = window.location.origin;
            const adUrl = `${baseUrl}/admin/ads/${adId}`;

            // Fallback copy method using a temporary input element
            const tempInput = document.createElement('input');
            tempInput.value = adUrl;
            document.body.appendChild(tempInput);
            tempInput.select();
            document.execCommand('copy');
            document.body.removeChild(tempInput);

            //alert('İlan linki kopyalandı!');
        } catch (error) {
            console.error('Kopyalama hatası:', error);
            alert('Kopyalama işlemi başarısız oldu!');
        }
    };

    if (!isOpen || !adDetails) return null; // Modal açık değilse veya adDetails yüklenmemişse render etmiyoruz

    const handleImageClick = (url: string) => {
        setSelectedImage(url);
    };

    // Fiyatı formatla
    const formatPrice = (price: number) => {
        return price.toLocaleString('tr-TR');
    };

    const formatDate = (timestamp: Timestamp) => {
        const date = timestamp.toDate(); // Firebase Timestamp'i JavaScript Date'e dönüştür
        return date.toLocaleDateString("tr-TR", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "numeric",
            minute: "numeric",
        }); // Tarihi formatla
    };

    const handleDeleteAd = async (adId: string) => {
        try {
            console.log("İlan silme işlemi başlatılıyor...");
            console.log("İlan ID:", adId);
            const adRef = doc(db, "Ads", adId);
            const adDoc = await getDoc(adRef);

            if (adDoc.exists()) {
                const adData = adDoc.data();

                // İlanı geçici sil
                await updateDoc(adRef, {
                    deletedAt: Timestamp.now()
                });

                // Silinecek tüm fotoğraf URL'lerini topla
                const photoUrls: string[] = [];

                // photoUrls array'ini kontrol et ve ekle
                if (adData.photoUrls && Array.isArray(adData.photoUrls) && adData.photoUrls.length > 0) {
                    photoUrls.push(...adData.photoUrls);
                }

                // thumbnailUrl'i kontrol et ve ekle
                if (adData.thumbnailUrl && typeof adData.thumbnailUrl === 'string') {
                    photoUrls.push(adData.thumbnailUrl);
                }

                console.log(`Toplam ${photoUrls.length} fotoğraf silinecek`);

                if (photoUrls.length === 0) {
                    // Fotoğraf yoksa doğrudan ilanı sil
                    console.log("Silinecek fotoğraf bulunmadı, ilan doğrudan siliniyor...");
                    await deleteDoc(adRef);
                    closeModal();
                    return;
                }

                // Tüm fotoğraflar silinene kadar beklemek için Promise.all kullanıyoruz
                const deletePromises = photoUrls.map(async (url: string) => {
                    if (!url || typeof url !== 'string' || url.trim() === '' || url.startsWith('file://')) {
                        console.log("Geçersiz URL, atlanıyor:", url);
                        return Promise.resolve(); // Geçersiz URL'leri atla
                    }

                    console.log("Silinecek fotoğraf URL'si:", url);
                    const storage = getStorage();

                    try {
                        const desertRef = ref(storage, url);
                        console.log("Fotoğraf silme işlemi başlatılıyor...: " + desertRef.fullPath);
                        await deleteObject(desertRef);
                        console.log("Fotoğraf silme işlemi tamamlandı.");
                        return Promise.resolve();
                    } catch (error) {
                        console.error("Fotoğraf silme hatası:", error);
                        return Promise.resolve(); // Hata olsa bile devam et
                    }
                });

                // Tüm fotoğraflar silinene kadar bekle
                await Promise.all(deletePromises);
                console.log("Tüm fotoğraflar silindi, şimdi ilan mesajları siliniyor...");

                // İlana ait chat yani mesaj verisini de komple sil
                const realtimeDb = getDatabase(); // Realtime DB instance
                const chatNodeRef = dbRef(realtimeDb, `chats/${adId}`);
                const chatSnapshot = await get(chatNodeRef);

                if (chatSnapshot.exists()) {
                    const chatData = chatSnapshot.val();

                    const deletePromises: Promise<void>[] = [];

                    Object.keys(chatData).forEach((key) => {
                        const [senderId, receiverId] = key.split("_");

                        if (senderId && receiverId) {
                            const senderMsgBoxRef = dbRef(realtimeDb, `messageBoxes/${senderId}/${adId}`);
                            deletePromises.push(remove(senderMsgBoxRef));

                            const receiverMsgBoxRef = dbRef(realtimeDb, `messageBoxes/${receiverId}/${adId}`);
                            deletePromises.push(remove(receiverMsgBoxRef));
                        }
                    });

                    deletePromises.push(remove(chatNodeRef));

                    await Promise.all(deletePromises);
                    console.log(`chats/${adId} ve ilgili tüm messageBoxes silindi.`);
                } else {
                    console.log(`chats/${adId} verisi bulunamadı.`);
                }

                // İlan ile ilgili her şey silindi artık ilanı tamamen silelim
                await deleteDoc(adRef);
                console.log("İlan başarıyla silindi.");

            } else {
                //console.error("İlan bulunamadı!");
                closeModal(); // İlan bulunamadığında modalı kapat
            }

            closeModal();
        } catch (error) {
            console.error("İlan silme hatası:", error);
        }
    };

    console.log(userDetails);

    return (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex justify-center items-center w-full z-50">
            <div className="bg-white md:rounded-lg shadow-lg w-full h-full overflow-y-auto">
                <div className="bg-gray-600 px-4 py-2 text-white flex justify-between items-center content-center mb-2">
                    <h2 className="text-xl font-bold">{adDetails.title}</h2>
                    <div>
                        <button
                            onClick={handleCopyAdLink}
                            className="text-xl text-white px-3 py-1 rounded-lg mr-1 hover:bg-gray-700"
                            title="İlan linkini kopyala"
                        >
                            <FontAwesomeIcon icon={faCopy} />
                        </button>
                        <button
                            onClick={closeModal}
                            className="bg-red-500 text-xl text-white px-3 py-1 rounded-lg hover:bg-red-600"
                        >
                            <FontAwesomeIcon icon={faTimes}></FontAwesomeIcon>
                        </button>
                    </div>
                </div>
                <div className="flex flex-col md:flex-row px-4 py-2 mt-2">
                    {/* Sol taraf büyük görsel */}
                    <div className="md:w-2/4 md:pr-3 sm:w-full sm:pr-0 pb-3">
                        <div>
                            <Image
                                src={getValidImageUrl(selectedImage)}
                                alt={adDetails.title}
                                width={400}
                                height={200}
                                className="w-full h-auto object-contain rounded-lg shadow-lg"
                            />
                        </div>
                        {/* Küçük görseller */}
                        <div className="flex mt-4 gap-3 overflow-x-auto">
                            {adDetails.photoUrls.map((url: string, index: number) => (
                                <Image
                                    key={index}
                                    src={getValidImageUrl(url)}
                                    alt={`${adDetails.title} ${index}`}
                                    width={400}
                                    height={200}
                                    className={`w-16 h-16 object-cover rounded ${selectedImage === url ? 'border-2 border-blue-500' : ''}`}
                                    onClick={() => handleImageClick(url)}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Sağ tarafta ilan detayları */}
                    <div className="md:w-1/3 sm:w-full">
                        {/* Kullanıcı bilgilerini buraya ekle */
                            
                        }
                        {userDetails && (
                            <div className="mb-4">
                                <p><strong>Ad:</strong> {userDetails.name || userDetails.displayName || '-' }</p>
                                <p><strong>E-posta:</strong> {userDetails.email}</p>
                                {userDetails.phoneNumber && (
                                    <p><strong>Telefon:</strong> {userDetails.phoneNumber}</p>
                                )}
                                {userDetails.phone && (
                                    <p><strong>Telefon:</strong> {userDetails.phone}</p>
                                )}
                                {userDetails.createdAt && typeof userDetails.createdAt !== 'string' && (
                                    <p><strong>Kayıt Tarihi:</strong> {formatDate(userDetails.createdAt)}</p>
                                )}
                                <p>
                                    <strong>Kullanıcı ID:</strong> 
                                    <Link href={`/admin/ads/?user=${adDetails.userId}`} onClick={closeModal} className="text-blue-500">
                                        {adDetails.userId}
                                    </Link>
                                </p>
                            </div>
                        )}

                        {/* İlan bilgileri */}
                        <p className={'mb-1'}>
                            <strong>Yayınlanma Tarihi:</strong> {adDetails.createdAt ? formatDate(adDetails.createdAt) : 'Yayınlanmamış'}
                        </p>
                        <p className={'mb-1'}><strong>Marka:</strong> {adDetails.brand}</p>
                        <p className={'mb-1'}><strong>Model:</strong> {adDetails.modelYear}</p>
                        <p className={'mb-1'}><strong>Fiyat:</strong> {formatPrice(adDetails.price)} TL</p>
                        <p className={'mb-1'}><strong>Model Yılı:</strong> {adDetails.modelYear}</p>
                        <p className={'mb-1'}><strong>Yakıt Türü:</strong> {adDetails.fuelType == 'benzin' ? 'Benzin' : 'Elektrik'}</p>
                        <p className={'mb-1'}><strong>Vites Türü:</strong> {adDetails.transmission == 'manuel' ? 'Manuel' : 'Otomatik'}</p>
                        <p className={'mb-1'}><strong>Motor Gücü (Cc):</strong> {adDetails.enginePower} </p>
                        <p className={'mb-1'}><strong>Km:</strong> {adDetails.km} km</p>
                        <p className={'mb-1'}><strong>Hasar Kaydı:</strong> {adDetails.hasDamage ? 'Var' : 'Yok'}</p>
                        <p className={'mb-1'}><strong>Takas:</strong> {adDetails.hasTradeIn ? 'Var' : 'Yok'}</p>
                        <p className={'mb-1'}><strong>Şehir:</strong> {adDetails.city}</p>
                        <p className={'mb-1'}><strong>Telefon Numarası Görünürlük Durumu:</strong> {adDetails.isNumberView == false ? 'Gizli' : 'Açık'}</p>
                        <p className={'mb-1'}><strong>İlan ID:</strong> {adDetails.id}</p>
                        <p className={'mb-1'}><strong>Açıklama:</strong> {adDetails.description}</p>

                        <p className={'mb-1'}>
                            <strong>Durum: </strong>
                            <span
                                className={`px-1 py-1 text-xs rounded text-white ${adDetails.status === "publish" ? "bg-green-500" : adDetails.status === "pending" ? "bg-yellow-500" : adDetails.status === "draft" ? "bg-gray-500" : "bg-red-500"}`}>
                                {adDetails.status === "publish" ? "Yayında" : adDetails.status === "pending" ? "Bekliyor" : adDetails.status === "draft" ? "Taslak" : "Reddedildi"}
                            </span>
                        </p>

                        {adDetails.deletedAt ? (
                            <p className={'mb-1'}><strong>İlan Silme Tarihi:</strong>
                                {adDetails.deletedAt ? formatDate(adDetails.deletedAt) : 'Yok'}
                            </p>
                        ) : null}

                    </div>
                </div>
                <div className="mt-4 px-4 py-2 flex justify-between">
                    <button
                        onClick={() =>
                            confirm('İlanı silmek istediğinize emin misiniz? Bu işlem geri alınamaz!') && handleDeleteAd(adDetails.id)
                        }
                        className="bg-red-500 text-white px-4 py-2 rounded-md mr-2 hover:bg-red-600"
                    >
                        İlanı Sil
                    </button>
                    <button
                        onClick={closeModal}
                        className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600"
                    >
                        Kapat
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Modal;
