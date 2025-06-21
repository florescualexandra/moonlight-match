'use client';
import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
// @ts-ignore
import { QRCodeCanvas } from 'qrcode.react';

const GOOGLE_FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSehjYJGGWUxKd9T_fLiD6yPrpLXGgBE-S5NBNaf_5TG2zg0LA/viewform?usp=dialog';

export default function EventQRPage() {
  const params = useParams();
  const eventId = params?.eventId || 'default';
  const [redirectUrl, setRedirectUrl] = useState('');

  useEffect(() => {
    setRedirectUrl(`${window.location.origin}/event/${eventId}/redirect`);
  }, [eventId]);

  return (
    <div className="min-h-screen bg-[#181c24] flex flex-col items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center mt-16">
        <h1 className="text-3xl font-serif font-bold text-[#D4AF37] mb-4">Event QR Code</h1>
        <p className="mb-4 text-[#23283a]">Scan this QR code to start registration for this event.</p>
        <div className="flex flex-col items-center gap-4">
          {redirectUrl && (
            <QRCodeCanvas value={redirectUrl} size={220} fgColor="#181c24" bgColor="#fff" level="H" />
          )}
          <div className="text-xs break-all text-[#23283a] bg-gray-100 rounded p-2 mt-2">{redirectUrl}</div>
        </div>
      </div>
    </div>
  );
} 