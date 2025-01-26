"use client";

import { useEffect, useState } from "react";
import Image from 'next/image';
import { db } from "@/lib/firebaseConfig";
import {collection, getDocs, query, updateDoc, doc, orderBy, limit, startAfter, Timestamp} from "firebase/firestore";

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {faSearch} from '@fortawesome/free-solid-svg-icons';

import Modal from "./AdModal";

interface Ad {
    id: string;
    title: string;
    price: number;
    photoUrls: string[];
    createdAt: Timestamp;
    status: "publish" | "pending";
    brand: string;
    city: string;
    modelYear: number;
    enginePower: number;
    km: number;
    description: string;
}

export default function AdsList() {
    const [ads, setAds] = useState<Ad[]>([]);
    const [loading, setLoading] = useState(true);

    const [lastDoc, setLastDoc] = useState<unknown>(null); // Son belgeyi tutar (cursor)
    const [hasMore, setHasMore] = useState(true); // Daha fazla veri olup olmadığını kontrol eder
    const pageSize = 6; // Sayfa başına kaç ilan çekileceği

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedAdId, setSelectedAdId] = useState<string>("");

    const openModal = (adId: string) => {
        setSelectedAdId(adId);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
    };

    // **İlk ilanları getir**
    useEffect(() => {
        const fetchAds = async () => {
            setLoading(true);
            try {
                const adsRef = collection(db, "Ads");
                const adsQuery = query(adsRef, orderBy("createdAt", "desc"), limit(pageSize));

                const querySnapshot = await getDocs(adsQuery);
                const adsData = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                })) as Ad[];

                setAds(adsData);
                setLastDoc(querySnapshot.docs[querySnapshot.docs.length - 1]); // Son belgeyi sakla
                setHasMore(querySnapshot.docs.length === pageSize); // Eğer tam sayfa dolduysa, daha fazla veri var demektir
            } catch (error) {
                console.error("İlanları çekerken hata oluştu:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchAds();
    }, []);

    // **Daha fazla ilan yükleme fonksiyonu**
    const loadMoreAds = async () => {
        if (!lastDoc) return;

        setLoading(true);
        try {
            const adsRef = collection(db, "Ads");
            const adsQuery = query(adsRef, orderBy("createdAt", "desc"), startAfter(lastDoc), limit(pageSize));

            const querySnapshot = await getDocs(adsQuery);
            const newAds = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            })) as Ad[];

            setAds((prevAds) => [...prevAds, ...newAds]); // Önceki listeye ekle
            setLastDoc(querySnapshot.docs[querySnapshot.docs.length - 1]); // Yeni son belgeyi sakla
            setHasMore(querySnapshot.docs.length === pageSize);
        } catch (error) {
            console.error("İlanları yüklerken hata oluştu:", error);
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (id: string, newStatus: "publish" | "pending") => {
        try {
            const adRef = doc(db, "Ads", id);
            await updateDoc(adRef, { status: newStatus });

            // UI güncelleme
            setAds((prevAds) =>
                prevAds.map((ad) => (ad.id === id ? { ...ad, status: newStatus } : ad))
            );
        } catch (error) {
            console.error("Durum güncellenirken hata oluştu:", error);
        }
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

    if (loading) return <p className="text-center">İlanlar yükleniyor...</p>;

    return (
        <div className="p-0">
            <h1 className="text-2xl font-bold mb-4">İlanlar</h1>
            <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-200 hidden md:table">
                    <thead>
                    <tr className="bg-gray-100">
                        <th className="px-4 py-2 border">Foto</th>
                        <th className="px-4 py-2 border">Başlık</th>
                        <th className="px-4 py-2 border">Fiyat</th>
                        <th className="px-4 py-2 border">Eklendi</th>
                        <th className="px-4 py-2 border">Durum</th>
                        <th className="px-4 py-2 border">İşlem</th>
                        <th className="px-4 py-2 border">Detaylar</th>
                    </tr>
                    </thead>
                    <tbody>
                    {ads.map((ad) => (
                        <tr key={ad.id} className="text-center">
                            <td className="px-1 py-1 border text-center justify-center flex">
                                <Image src={ad.photoUrls[0]} alt={ad.title} className="w-16 h-16 object-cover rounded" height={200} width={200} />
                            </td>
                            <td className="px-4 py-2 border">{ad.title}</td>
                            <td className="px-4 py-2 border">{ad.price} TL</td>
                            <td className="px-4 py-2 border">
                                {/* createdAt değerini formatlayarak gösteriyoruz */}
                                {formatDate(ad.createdAt)}
                            </td>
                            <td className="px-4 py-2 border">
                  <span
                      className={`px-2 py-1 rounded text-white ${ad.status === "publish" ? "bg-green-500" : "bg-yellow-500"}`}>
                    {ad.status === "publish" ? "Yayında" : "Bekliyor"}
                  </span>
                            </td>
                            <td className="px-2 py-1 border">
                                {ad.status === "pending" ? (
                                    <button
                                        onClick={() => updateStatus(ad.id, "publish")}
                                        className="bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600"
                                    >
                                        Yayına Al
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => updateStatus(ad.id, "pending")}
                                        className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                                    >
                                        Yayından Kaldır
                                    </button>
                                )}
                            </td>
                            <td className="px-4 py-2 border">
                                <button
                                    onClick={() => openModal(ad.id)}
                                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                                >
                                    <FontAwesomeIcon icon={faSearch}></FontAwesomeIcon>
                                </button>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>

                {/* Küçük ekranlarda kart görünümü */}
                <div className="md:hidden space-y-4">
                    {ads.map((ad) => (
                        <div key={ad.id} className="bg-gray-100 p-4 rounded shadow">
                            <div className="flex items-center space-x-4">
                                <Image src={ad.photoUrls[0]} alt={ad.title} className="w-20 h-20 object-cover rounded" width={125} height={125} />
                                <div className="flex-1">
                                    <h3 className="text-lg font-bold">{ad.title}</h3>
                                    <p className="text-gray-700">{ad.price} TL</p>
                                    <p className="text-sm text-gray-500">{formatDate(ad.createdAt)}</p>
                                </div>
                            </div>
                            <div className="flex justify-between items-center mt-4">
                    <span className={`px-2 py-1 rounded text-white ${ad.status === "publish" ? "bg-green-500" : "bg-yellow-500"}`}>
                        {ad.status === "publish" ? "Yayında" : "Bekliyor"}
                    </span>
                                <div className="flex space-x-2">
                                    {ad.status === "pending" ? (
                                        <button
                                            onClick={() => updateStatus(ad.id, "publish")}
                                            className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
                                        >
                                            Yayına Al
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => updateStatus(ad.id, "pending")}
                                            className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                                        >
                                            Kaldır
                                        </button>
                                    )}
                                    <button
                                        onClick={() => openModal(ad.id)}
                                        className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                                    >
                                        <FontAwesomeIcon icon={faSearch} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

            </div>
            {/* Daha fazla yükleme butonu */}
            {hasMore && !loading && (
                <button onClick={loadMoreAds} className="bg-gray-800 text-white px-4 py-2 rounded mt-4 w-full hover:bg-gray-700">
                    Daha Fazla Yükle
                </button>
            )}
            {loading && <p className="text-center mt-4">Yükleniyor...</p>}
            <Modal isOpen={isModalOpen} closeModal={closeModal} adId={selectedAdId} />
        </div>
    );
}
