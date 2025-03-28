"use client";

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Modal from '@/app/components/AdModal';

export default function AdDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(true);
  const adId = params.id as string;

  // Modal kapatıldığında ana sayfaya yönlendir
  const handleCloseModal = () => {
    setIsModalOpen(false);
    router.push('/admin/ads'); // Ana sayfa yolunu projenize göre ayarlayın
  };

  if (!adId) {
    return `<div>İlan ID'si bulunamadı</div>`;
  }

  return (
    <div>
      {/* Modal'ı aç ve ilgili ilanı göster */}
      <Modal 
        isOpen={isModalOpen} 
        closeModal={handleCloseModal} 
        adId={adId} 
      />
    </div>
  );
}
