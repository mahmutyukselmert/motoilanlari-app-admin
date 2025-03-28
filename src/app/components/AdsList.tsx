"use client";

import { useEffect, useState, useCallback } from "react";
import Image from 'next/image';
import { db } from "@/lib/firebaseConfig";
import {collection, getDocs, query, updateDoc, doc, orderBy, limit, startAfter, Timestamp, where} from "firebase/firestore";

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {faSearch, faChevronDown, faSort, faSortUp, faSortDown, faEdit} from '@fortawesome/free-solid-svg-icons';

import Modal from "./AdModal";
import { useRouter, useSearchParams } from 'next/navigation';

interface Ad {
    id: string;
    title: string;
    price: number;
    photoUrls: string[];
    createdAt: Timestamp;
    status: "publish" | "pending" | "rejected" | "draft";
    brand: string;
    model: string;
    city: string;
    modelYear: number;
    enginePower: number;
    km: number;
    description: string;
    thumbnailUrl: string | null;
}

type SortField = "createdAt" | "price";
type SortDirection = "asc" | "desc";

export default function AdsList() {
    const [ads, setAds] = useState<Ad[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("");
    const [sortField, setSortField] = useState<SortField>("createdAt");
    const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
    const [isMobile, setIsMobile] = useState<boolean>(false);

    const [lastDoc, setLastDoc] = useState<unknown>(null); // Son belgeyi tutar (cursor)
    const [hasMore, setHasMore] = useState(true); // Daha fazla veri olup olmadığını kontrol eder
    const pageSize = isMobile ? 10 : 20; // Mobil cihazlarda 10, masaüstünde 20 ilan

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedAdId, setSelectedAdId] = useState<string>("");

    const router = useRouter();
    const searchParams = useSearchParams();

    // URL'den status parametresini al ve filtre olarak ayarla
    useEffect(() => {
        const statusParam = searchParams.get('status');
        if (statusParam) {
            setStatusFilter(statusParam);
        }
    }, [searchParams]);

    // Cihaz tipini kontrol et
    useEffect(() => {
        const checkDevice = () => {
            setIsMobile(window.innerWidth < 768);
        };
        
        // İlk yüklemede kontrol et
        checkDevice();
        
        // Ekran boyutu değiştiğinde kontrol et
        window.addEventListener('resize', checkDevice);
        
        // Cleanup
        return () => {
            window.removeEventListener('resize', checkDevice);
        };
    }, []);

    const openModal = (adId: string) => {
        setSelectedAdId(adId);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
    };

    // **İlanları getir**
    const fetchAds = useCallback(async () => {
        setLoading(true);
        try {
            const adsRef = collection(db, "Ads");
            let adsQuery = query(adsRef);
            
            // Status filtresi ekle
            if (statusFilter) {
                adsQuery = query(adsQuery, where("status", "==", statusFilter));
            }
            
            // Sıralama ekle
            adsQuery = query(adsQuery, orderBy(sortField, sortDirection), limit(pageSize));

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
    }, [statusFilter, sortField, sortDirection, pageSize]);
    
    useEffect(() => {
        fetchAds();
    }, [fetchAds]);

    // **Daha fazla ilan yükleme fonksiyonu**
    const loadMoreAds = async () => {
        if (!lastDoc) return;

        setLoading(true);
        try {
            const adsRef = collection(db, "Ads");
            let adsQuery = query(adsRef);
            
            // Status filtresi ekle
            if (statusFilter) {
                adsQuery = query(adsQuery, where("status", "==", statusFilter));
            }
            
            // Sıralama ve pagination ekle
            adsQuery = query(adsQuery, orderBy(sortField, sortDirection), startAfter(lastDoc), limit(pageSize));

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

    // Sıralama fonksiyonu
    const handleSort = (field: SortField) => {
        if (field === sortField) {
            // Aynı alan için yön değiştir
            setSortDirection(sortDirection === "asc" ? "desc" : "asc");
        } else {
            // Farklı alan için varsayılan desc
            setSortField(field);
            setSortDirection("desc");
        }
        setLastDoc(null); // Sıralama değiştiğinde cursor'u sıfırla
    };

    // Arama fonksiyonu - anlık olarak ekrandaki ilanlarda arama yapar
    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
    };

    // Enter tuşuna basıldığında tüm veritabanında arama yap
    const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            searchInDatabase(searchTerm);
        }
    };

    // Arama butonuna basıldığında tüm veritabanında arama yap
    const handleSearchButtonClick = () => {
        searchInDatabase(searchTerm);
    };

    // Veritabanında arama yapma fonksiyonu
    const searchInDatabase = async (term: string) => {
        if (term.trim() === "") {
            // Arama terimi boşsa normal sorguya dön
            setLastDoc(null);
            fetchAds();
            return;
        }

        setLoading(true);
        try {
            const adsRef = collection(db, "Ads");
            let adsQuery = query(adsRef);
            
            // Status filtresi ekle
            if (statusFilter) {
                adsQuery = query(adsQuery, where("status", "==", statusFilter));
            }
            
            // Sıralama ekle
            adsQuery = query(adsQuery, orderBy(sortField, sortDirection));

            const querySnapshot = await getDocs(adsQuery);
            const allAds = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            })) as Ad[];

            // Client-side filtreleme (Firebase tam metin araması sınırlı olduğu için)
            const searchLower = term.toLowerCase();
            const filteredResults = allAds.filter(ad => {
                return (
                    ad.title.toLowerCase().includes(searchLower) ||
                    ad.brand.toLowerCase().includes(searchLower) ||
                    ad.city.toLowerCase().includes(searchLower) ||
                    ad.description.toLowerCase().includes(searchLower)
                );
            });

            setAds(filteredResults);
            setHasMore(false); // Arama yaparken "daha fazla yükle" özelliğini devre dışı bırak
        } catch (error) {
            console.error("Arama yaparken hata oluştu:", error);
        } finally {
            setLoading(false);
        }
    };

    // Filtrelenmiş ilanlar - anlık arama için client-side filtreleme
    const filteredAds = ads.filter(ad => {
        if (searchTerm === "") return true;
        
        const searchLower = searchTerm.toLowerCase();
        // Arama için kullanılacak birleşik metin - başlık, marka ve model bilgilerini içerir
        const searchableText = (
            ad.title.toLowerCase() + " " + 
            ad.brand.toLowerCase() + " " + 
            (ad.model ? ad.model.toLowerCase() : "") + " " +
            ad.city.toLowerCase() + " " +
            ad.description.toLowerCase()
        );
        
        return searchableText.includes(searchLower);
    });

    // Client-side sıralama fonksiyonu - data-price attribute'unu kullanarak
    const sortedAds = [...filteredAds].sort((a, b) => {
        if (sortField === "price") {
            // Price için sıralama
            const priceA = a.price;
            const priceB = b.price;
            
            if (sortDirection === "asc") {
                return priceA - priceB;
            } else {
                return priceB - priceA;
            }
        } else if (sortField === "createdAt") {
            // Tarih için sıralama
            const dateA = a.createdAt.toDate().getTime();
            const dateB = b.createdAt.toDate().getTime();
            
            if (sortDirection === "asc") {
                return dateA - dateB;
            } else {
                return dateB - dateA;
            }
        }
        return 0;
    });

    // Status filtre fonksiyonu
    const handleStatusFilter = (status: string) => {
        setStatusFilter(status);
        setLastDoc(null); // Filtre değiştiğinde cursor'u sıfırla
        
        // URL'i güncelle
        if (status) {
            router.push(`/admin/ads?status=${status}`);
        } else {
            router.push('/admin/ads');
        }
    };

    // Sıralama ikonu
    const getSortIcon = (field: SortField) => {
        if (field !== sortField) return <FontAwesomeIcon icon={faSort} className="ml-1" />;
        return sortDirection === "asc" ? 
            <FontAwesomeIcon icon={faSortUp} className="ml-1 text-blue-500" /> : 
            <FontAwesomeIcon icon={faSortDown} className="ml-1 text-blue-500" />;
    };

    // Geçersiz URL kontrolü için yardımcı fonksiyon
    const getValidImageUrl = (url: string | null | undefined): string => {
        if (!url) return '/placeholder.jpg';
        // file:// ile başlayan URL'leri veya geçersiz URL'leri kontrol et
        if (url.startsWith('file://') || url.includes('/data/user/0/')) {
            return '/placeholder.jpg';
        }
        return url;
    };

    if (loading && ads.length === 0) return <p className="text-center">İlanlar yükleniyor...</p>;

    // URL'leri kontrol etmek için
    /*
    filteredAds.forEach(ad => {
        console.log('Ad ID:', ad.id);
        console.log('thumbnailUrl:', ad.thumbnailUrl);
        console.log('photoUrls:', JSON.stringify(ad.photoUrls));
    });
    */

    return (
        <div className="p-0">
            <h1 className="text-2xl font-bold mb-4">İlanlar</h1>
            
            {/* Filtreleme ve Arama Alanı */}
            <div className="mb-4 flex flex-col md:flex-row gap-3">

                {/* Arama Kutusu */}
                <div className="relative flex-1 px-1">
                    <input
                        type="text"
                        placeholder="İlan başlığı, marka, şehir veya açıklama ara..."
                        className="w-full px-4 py-2 border border-gray-300 rounded shadow focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={searchTerm}
                        onChange={handleSearch}
                        onKeyDown={handleSearchKeyDown}
                    />
                    <button
                        type="button"
                        className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-700 hover:text-blue-500 cursor-pointer"
                        onClick={handleSearchButtonClick}
                        title="Tüm veritabanında ara"
                    >
                        <FontAwesomeIcon icon={faSearch} />
                    </button>
                </div>

                {/* Status Filtresi */}
                <div className="relative inline-block w-full md:w-48">
                    <select 
                        className="block appearance-none w-full bg-white border border-gray-300 hover:border-gray-400 px-4 py-2 pr-8 rounded cursor-pointer shadow leading-tight focus:outline-none focus:shadow-outline"
                        value={statusFilter}
                        onChange={(e) => handleStatusFilter(e.target.value)}
                    >
                        <option value="">Tüm Durumlar</option>
                        <option value="publish">Yayında</option>
                        <option value="pending">Onay Bekliyor</option>
                        <option value="rejected">Reddedildi</option>
                        <option value="draft">Taslak</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                        <FontAwesomeIcon icon={faChevronDown} />
                    </div>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-200 hidden md:table">
                    <thead>
                    <tr className="bg-gray-100">
                        <th className="px-4 py-2 border">Foto</th>
                        <th className="px-4 py-2 border">
                            Başlık
                        </th>
                        <th className="px-4 py-2 border cursor-pointer" onClick={() => handleSort("price")}>
                            Fiyat {getSortIcon("price")}
                        </th>
                        <th className="px-4 py-2 border cursor-pointer" onClick={() => handleSort("createdAt")}>
                            Eklendi {getSortIcon("createdAt")}
                        </th>
                        <th className="px-4 py-2 border">Durum</th>
                        <th className="px-4 py-2 border">İşlem</th>
                        <th className="px-4 py-2 border">Detaylar</th>
                    </tr>
                    </thead>
                    <tbody>
                    {sortedAds.map((ad) => (
                        <tr key={ad.id} className="text-center">
                            <td className="px-1 py-1 border text-center justify-center flex">
                                <Image 
                                  src={getValidImageUrl(ad.thumbnailUrl || (ad.photoUrls && ad.photoUrls.length > 0 ? ad.photoUrls[0] : null))} 
                                  alt={ad.title} 
                                  className="w-16 h-16 object-cover rounded" 
                                  height={200} 
                                  width={200} 
                                />
                            </td>
                            <td className="px-4 py-2 border" data-name={ad.title + " " + ad.brand + " " + ad.model}>
                                <span className="text-gray-800 text-sm">
                                {ad.title.length > 50 ? ad.title.substring(0, 50) + '...' : ad.title}
                                </span>
                                <span className="text-gray-800 text-xs block">
                                    <b>Marka:</b> {ad.brand} - <b>Model:</b> {ad.model}
                                </span>
                            </td>
                            <td className="px-4 py-2 border" data-price={ad.price}>
                                { ad.price.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY', minimumFractionDigits: 0 }).replace("₺", "") + "₺" }
                            </td>
                            <td className="px-4 py-2 border">
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
                                                const dropdowns = document.querySelectorAll('.status-dropdown');
                                                dropdowns.forEach(dropdown => {
                                                    if (dropdown.id !== `dropdown-${ad.id}`) {
                                                        dropdown.classList.add('hidden');
                                                    }
                                                });
                                                document.getElementById(`dropdown-${ad.id}`)?.classList.toggle('hidden');
                                            }}
                                            className="w-16 inline-flex justify-between align-center items-center w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none"
                                            id={`dropdown-button-${ad.id}`}
                                            aria-expanded="true" aria-haspopup="true">
                                            <FontAwesomeIcon icon={faEdit} className="mr-2 h-4 w-4" />
                                            Güncelle
                                            <FontAwesomeIcon icon={faChevronDown} className="ml-1 h-4 w-4" />
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
                                    className="bg-blue-500 text-white px-3 py-2 rounded hover:bg-blue-600"
                                >
                                    <FontAwesomeIcon icon={faSearch} size="sm"></FontAwesomeIcon>
                                </button>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>

                {/* Küçük ekranlarda kart görünümü */}
                <div className="md:hidden space-y-4">
                    {sortedAds.map((ad) => (
                        <div key={ad.id} className="bg-gray-100 p-4 rounded shadow">
                            <div className="flex items-center space-x-4">
                                <Image src={getValidImageUrl(ad.thumbnailUrl || (ad.photoUrls && ad.photoUrls.length > 0 ? ad.photoUrls[0] : null))} alt={ad.title} className="w-20 h-20 object-cover rounded" width={125} height={125} />
                                <div className="flex-1">
                                    <h6 className="text-sm font-bold">{ad.title.length > 40 ? ad.title.substring(0, 40) + '...' : ad.title}</h6>
                                    <span className="text-gray-800 text-xs block">
                                        <b>Marka:</b> {ad.brand} | <b>Model:</b> {ad.model}
                                    </span>
                                    <p className="text-gray-700 font-bold text-sm mt-1">
                                        { ad.price.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY', minimumFractionDigits: 0 }).replace("₺", "") + "₺" }
                                    </p>
                                    <p className="text-xs text-gray-500 flex justify-end">
                                        {formatDate(ad.createdAt)}
                                    </p>
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
                                                className="inline-flex justify-center align-center items-center h-8 rounded-md border border-gray-300 shadow-sm px-3 py-1 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none"
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
                                    {/* İnceleme */}
                                    <div>
                                        <button
                                            onClick={() => openModal(ad.id)}
                                            className="bg-blue-500 text-white px-2 py-1 h-8 rounded hover:bg-blue-600"
                                        >
                                            <FontAwesomeIcon icon={faSearch}></FontAwesomeIcon>
                                        </button>
                                    </div>
                                    {/* İnceleme */}
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
