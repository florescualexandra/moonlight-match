'use client';
import React, { useEffect } from 'react';
import { useParams } from 'next/navigation';

const GOOGLE_FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSehjYJGGWUxKd9T_fLiD6yPrpLXGgBE-S5NBNaf_5TG2zg0LA/viewform?usp=dialog';

export default function EventRedirectPage() {
  const params = useParams();
  const eventId = params?.eventId || 'default';

  useEffect(() => {
    // Redirect to Google Form after a short delay
    const timer = setTimeout(() => {
      window.location.href = GOOGLE_FORM_URL;
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-[#181c24] flex flex-col items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center mt-16">
        <h1 className="text-2xl font-serif font-bold text-[#D4AF37] mb-4">Redirecting to Registration Form...</h1>
        <p className="text-[#23283a] mb-4">You are being redirected to the event preferences form. Please complete the form, then return to the site to finish your registration.</p>
        <a
          href={GOOGLE_FORM_URL}
          className="inline-block px-6 py-3 rounded-full bg-[#D4AF37] text-[#181c24] font-bold text-lg hover:bg-[#e6c97a] transition shadow border-2 border-[#D4AF37] mt-4"
        >
          Go to Form Now
        </a>
        <div className="mt-8 text-[#23283a] text-sm">
          After submitting the form, <b>click below to continue registration:</b>
        </div>
        <a
          href="/register"
          className="inline-block px-6 py-3 rounded-full bg-[#181c24] text-[#D4AF37] font-bold text-lg hover:bg-[#23283a] transition border-2 border-[#D4AF37] mt-2"
        >
          Continue to Registration
        </a>
      </div>
    </div>
  );
} 