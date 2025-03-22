"use client";

import { useEffect, useState } from "react";
import Image from 'next/image';
import { db } from "@/lib/firebaseConfig";
import {collection, getDocs, query, updateDoc, doc, orderBy, limit, startAfter, Timestamp} from "firebase/firestore";

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {faSearch, faChevronDown} from '@fortawesome/free-solid-svg-icons';

import Modal from "./AdModal";

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

    const updateStatus = async (id: string, newStatus: "publish" | "pending" | "rejected" | "draft") => {
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
                      className={`px-2 py-1 rounded text-white ${ad.status === "publish" ? "bg-green-500" : ad.status === "pending" ? "bg-yellow-500" : ad.status === "draft" ? "bg-gray-500" : "bg-red-500"}`}>
                    {ad.status === "publish" ? "Yayında" : ad.status === "pending" ? "Bekliyor" : ad.status === "draft" ? "Taslak" : "Reddedildi"}
                  </span>
                            </td>
                            <td className="px-2 py-1 border">
                                <div className="relative inline-block text-left">
                                    <div>
                                        <button type="button" 
                                            onClick={() => {
                                                // Dropdown menü açma/kapama
                                                const dropdowns = document.querySelectorAll('.status-dropdown');
                                                dropdowns.forEach(dropdown => {
                                                    if (dropdown.id !== `dropdown-${ad.id}`) {
                                                        dropdown.classList.add('hidden');
                                                    }
                                                });
                                                document.getElementById(`dropdown-${ad.id}`)?.classList.toggle('hidden');
                                            }}
                                            className="inline-flex justify-center w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none"
                                            id={`dropdown-button-${ad.id}`}
                                            aria-expanded="true" aria-haspopup="true">
                                            Durum Değiştir
                                            <FontAwesomeIcon icon={faChevronDown} className="ml-2 h-5 w-5" />
                                        </button>
                                    </div>
                                    <div className="status-dropdown hidden origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10" 
                                        role="menu" aria-orientation="vertical" 
                                        id={`dropdown-${ad.id}`}>
                                        <div className="py-1" role="none">
                                            {ad.status !== "publish" && (
                                                <button
                                                    onClick={() => {
                                                        updateStatus(ad.id, "publish");
                                                        document.getElementById(`dropdown-${ad.id}`)?.classList.add('hidden');
                                                    }}
                                                    className="text-left block w-full px-4 py-2 text-sm text-green-700 hover:bg-green-100 hover:text-green-900"
                                                    role="menuitem">
                                                    Yayına Al
                                                </button>
                                            )}
                                            {ad.status !== "pending" && (
                                                <button
                                                    onClick={() => {
                                                        updateStatus(ad.id, "pending");
                                                        document.getElementById(`dropdown-${ad.id}`)?.classList.add('hidden');
                                                    }}
                                                    className="text-left block w-full px-4 py-2 text-sm text-yellow-700 hover:bg-yellow-100 hover:text-yellow-900"
                                                    role="menuitem">
                                                    {ad.status === "publish" ? "Yayından Kaldır" : "İncelemeye Al"}
                                                </button>
                                            )}
                                            {ad.status !== "rejected" && (
                                                <button
                                                    onClick={() => {
                                                        updateStatus(ad.id, "rejected");
                                                        document.getElementById(`dropdown-${ad.id}`)?.classList.add('hidden');
                                                    }}
                                                    className="text-left block w-full px-4 py-2 text-sm text-red-700 hover:bg-red-100 hover:text-red-900"
                                                    role="menuitem">
                                                    Reddet
                                                </button>
                                            )}
                                            {ad.status !== "draft" && (
                                                <button
                                                    onClick={() => {
                                                        updateStatus(ad.id, "draft");
                                                        document.getElementById(`dropdown-${ad.id}`)?.classList.add('hidden');
                                                    }}
                                                    className="text-left block w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                                                    role="menuitem">
                                                    Taslak Olarak İşaretle
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
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
                                    <span
                                        className={`px-2 py-1 rounded text-white ${ad.status === "publish" ? "bg-green-500" : ad.status === "pending" ? "bg-yellow-500" : ad.status === "draft" ? "bg-gray-500" : "bg-red-500"}`}>
                                        {ad.status === "publish" ? "Yayında" : ad.status === "pending" ? "Bekliyor" : ad.status === "draft" ? "Taslak" : "Reddedildi"}
                                    </span>
                                </div>
                            </div>
                            <div className="flex justify-between items-center mt-4">
                    <span className={`px-2 py-1 rounded text-white ${ad.status === "publish" ? "bg-green-500" : ad.status === "pending" ? "bg-yellow-500" : ad.status === "draft" ? "bg-gray-500" : "bg-red-500"}`}>
                        {ad.status === "publish" ? "Yayında" : ad.status === "pending" ? "Bekliyor" : ad.status === "draft" ? "Taslak" : "Reddedildi"}
                    </span>
                                <div className="flex space-x-2">
                                    <div className="relative inline-block text-left">
                                        <div>
                                            <button type="button" 
                                                onClick={() => {
                                                    // Dropdown menü açma/kapama
                                                    const dropdowns = document.querySelectorAll('.status-dropdown-mobile');
                                                    dropdowns.forEach(dropdown => {
                                                        if (dropdown.id !== `dropdown-mobile-${ad.id}`) {
                                                            dropdown.classList.add('hidden');
                                                        }
                                                    });
                                                    document.getElementById(`dropdown-mobile-${ad.id}`)?.classList.toggle('hidden');
                                                }}
                                                className="inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-3 py-1 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none"
                                                id={`dropdown-button-mobile-${ad.id}`}
                                                aria-expanded="true" aria-haspopup="true">
                                                Durum
                                                <FontAwesomeIcon icon={faChevronDown} className="ml-1 h-4 w-4" />
                                            </button>
                                        </div>
                                        <div className="status-dropdown-mobile hidden origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10" 
                                            role="menu" aria-orientation="vertical" 
                                            id={`dropdown-mobile-${ad.id}`}>
                                            <div className="py-1" role="none">
                                                {ad.status !== "publish" && (
                                                    <button
                                                        onClick={() => {
                                                            updateStatus(ad.id, "publish");
                                                            document.getElementById(`dropdown-mobile-${ad.id}`)?.classList.add('hidden');
                                                        }}
                                                        className="text-left block w-full px-4 py-2 text-sm text-green-700 hover:bg-green-100 hover:text-green-900"
                                                        role="menuitem">
                                                        Yayına Al
                                                    </button>
                                                )}
                                                {ad.status !== "pending" && (
                                                    <button
                                                        onClick={() => {
                                                            updateStatus(ad.id, "pending");
                                                            document.getElementById(`dropdown-mobile-${ad.id}`)?.classList.add('hidden');
                                                        }}
                                                        className="text-left block w-full px-4 py-2 text-sm text-yellow-700 hover:bg-yellow-100 hover:text-yellow-900"
                                                        role="menuitem">
                                                        {ad.status === "publish" ? "Yayından Kaldır" : "İncelemeye Al"}
                                                    </button>
                                                )}
                                                {ad.status !== "rejected" && (
                                                    <button
                                                        onClick={() => {
                                                            updateStatus(ad.id, "rejected");
                                                            document.getElementById(`dropdown-mobile-${ad.id}`)?.classList.add('hidden');
                                                        }}
                                                        className="text-left block w-full px-4 py-2 text-sm text-red-700 hover:bg-red-100 hover:text-red-900"
                                                        role="menuitem">
                                                        Reddet
                                                    </button>
                                                )}
                                                {ad.status !== "draft" && (
                                                    <button
                                                        onClick={() => {
                                                            updateStatus(ad.id, "draft");
                                                            document.getElementById(`dropdown-mobile-${ad.id}`)?.classList.add('hidden');
                                                        }}
                                                        className="text-left block w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                                                        role="menuitem">
                                                        Taslak Olarak İşaretle
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
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
