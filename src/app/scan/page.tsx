'use client';
import React, { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

export default function ScanPage() {
  const [scanResult, setScanResult] = useState<string | null>(null);
  const scannerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!scannerRef.current) return;
    const scanner = new Html5QrcodeScanner('qr-reader', {
      fps: 10,
      qrbox: 250,
    }, false);
    scanner.render(
      (decodedText: string) => {
        setScanResult(decodedText);
        if (decodedText.startsWith('http')) {
          window.location.href = decodedText;
        }
      },
      (error: any) => {
        // Optionally handle scan errors
      }
    );
    return () => {
      scanner.clear();
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#181c24] flex flex-col items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center mt-16">
        <h1 className="text-3xl font-serif font-bold text-[#D4AF37] mb-4">Scan Party QR Code</h1>
        <div ref={scannerRef} id="qr-reader" className="mx-auto" style={{ width: 250 }} />
        {scanResult && (
          <div className="mt-4 text-[#181c24] font-semibold">QR Code detected! Redirecting...</div>
        )}
      </div>
    </div>
  );
} 