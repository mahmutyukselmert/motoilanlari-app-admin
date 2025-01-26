import React, { useEffect, useState } from "react";
import Image from 'next/image';
import { db } from "@/lib/firebaseConfig";
import { doc, getDoc, Timestamp } from "firebase/firestore";
import {faTimes} from "@fortawesome/free-solid-svg-icons";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";

interface ModalProps {
    isOpen: boolean;
    closeModal: () => void;
    adId: string; // Modal'a sadece id'yi geçiyoruz, detayı burada çekiyoruz
}

interface User {
    name?: string;
    email?: string;
    phone?: string;
    phoneNumber?: string;
    createdAt?: Timestamp;
}

interface Ad {
    photoUrls: string[];
    title: string;
    brand: string;
    modelYear: number;
    model: string;
    transmission: string;
    enginePower: number;
    km: number;
    price: number;
    fuelType: string;
    city: string;
    hasTradeIn: boolean;
    hasDamage: boolean;
    description: string;
    isNumberView: boolean;
    createdAt: Timestamp;
    userId: string;
}

const Modal: React.FC<ModalProps> = ({ isOpen, closeModal, adId }) => {
    const [adDetails, setAdDetails] = useState<Ad | null>(null);
    const [userDetails, setUserDetails] = useState<User | null>(null);

    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    // Ad detaylarını fetch et
    useEffect(() => {
        if (isOpen && adId) {
            const fetchAdDetails = async () => {
                try {
                    const adRef = doc(db, "Ads", adId);
                    const adDoc = await getDoc(adRef);
                    if (adDoc.exists()) {
                        const adData = adDoc.data() as Ad;
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
                    }
                } catch (error) {
                    console.error("İlan detayları alınırken hata oluştu:", error);
                }
            };

            fetchAdDetails();
        }
    }, [isOpen, adId]);

    // Eğer adDetails mevcutsa ilk fotoğrafı seç
    useEffect(() => {
        if (adDetails && adDetails.photoUrls.length > 0) {
            setSelectedImage(adDetails.photoUrls[0]);
        }
    }, [adDetails]);

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

    return (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white md:rounded-lg shadow-lg w-full h-full max-w-7xl overflow-y-auto">
                <div className="bg-gray-600 px-4 py-2 text-white flex justify-between items-center content-center mb-2">
                    <h2 className="text-xl font-bold">{adDetails.title}</h2>
                    <button
                        onClick={closeModal}
                        className="bg-red-500 text-xl text-white px-3 py-1 rounded-lg hover:bg-red-600"
                    >
                        <FontAwesomeIcon icon={faTimes}></FontAwesomeIcon>
                    </button>
                </div>
                <div className="flex flex-col md:flex-row px-4 py-2 mt-2">
                    {/* Sol taraf büyük görsel */}
                    <div className="md:w-2/4 md:pr-3 sm:w-full sm:pr-0 pb-3">
                        <div>
                            <Image
                                src={selectedImage || adDetails.photoUrls[0]} // Eğer selectedImage varsa onu göster, yoksa ilk görseli göster
                                alt={adDetails.title}
                                width={400}
                                height={200}
                                layout="intrinsic"
                                className="w-full h-full object-cover rounded-lg"
                            />
                        </div>
                        {/* Küçük görseller */}
                        <div className="flex mt-4 gap-3 overflow-x-auto">
                            {adDetails.photoUrls.map((url: string, index: number) => (
                                <Image
                                    key={index}
                                    src={url}
                                    alt={`${adDetails.title} ${index}`}
                                    width={400}
                                    height={200}
                                    layout="intrinsic"
                                    className="w-1/4 h-auto object-cover rounded-lg cursor-pointer"
                                    title={'Büyütmek için üzerine tıklayın.'}
                                    onClick={() => handleImageClick(url)} // Tıklama ile görseli seç
                                />
                            ))}
                        </div>
                    </div>

                    {/* Sağ tarafta ilan detayları */}
                    <div className="md:w-1/3 sm:w-full">
                        {/* Kullanıcı bilgilerini buraya ekle */}
                        {userDetails && (
                            <div className="mb-4">
                                <p><strong>Ad:</strong> {userDetails.name}</p>
                                <p><strong>E-posta:</strong> {userDetails.email}</p>
                                {userDetails.phoneNumber && (
                                    <p><strong>Telefon:</strong> {userDetails.phoneNumber}</p>
                                )}
                                {userDetails.phone && (
                                    <p><strong>Telefon:</strong> {userDetails.phone}</p>
                                )}
                                {userDetails.createdAt && typeof userDetails.createdAt !== 'string' && (
                                    <p><strong>Kayıt Tarihi</strong> {formatDate(userDetails.createdAt)}</p>
                                )}
                            </div>
                        )}
                        {/* İlan bilgileri */}
                        <p className={'mb-1'}><strong>Marka:</strong> {adDetails.brand}</p>
                        <p className={'mb-1'}><strong>Model:</strong> {adDetails.model}</p>
                        <p className={'mb-1'}><strong>Fiyat:</strong> {formatPrice(adDetails.price)} TL</p>
                        <p className={'mb-1'}><strong>Model Yılı:</strong> {adDetails.modelYear}</p>
                        <p className={'mb-1'}><strong>Yakıt
                            Türü:</strong> {adDetails.fuelType == 'benzin' ? 'Benzin' : 'Elektrik'}</p>
                        <p className={'mb-1'}><strong>Vites
                            Türü:</strong> {adDetails.transmission == 'manuel' ? 'Manuel' : 'Otomatik'}</p>
                        <p className={'mb-1'}><strong>Motor Gücü (Cc):</strong> {adDetails.enginePower} </p>
                        <p className={'mb-1'}><strong>Km:</strong> {adDetails.km} km</p>
                        <p className={'mb-1'}><strong>Hasar Kaydı:</strong> {adDetails.hasDamage ? 'Var' : 'Yok'}</p>
                        <p className={'mb-1'}><strong>Takas:</strong> {adDetails.hasTradeIn ? 'Var' : 'Yok'}</p>
                        <p className={'mb-1'}><strong>Şehir:</strong> {adDetails.city}</p>
                        <p className={'mb-1'}><strong>Telefon Numarası Görünürlük Durumu:</strong> {adDetails.isNumberView == false ? 'Gizli' : 'Açık' }</p>
                        <p className={'mb-1'}><strong>Açıklama:</strong> {adDetails.description}</p>
                    </div>
                </div>
                <div className="mt-4 px-4 py-2 flex justify-end">
                    <button
                        onClick={closeModal}
                        className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600"
                    >
                        Kapat
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Modal;
