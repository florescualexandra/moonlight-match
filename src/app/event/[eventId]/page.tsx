"use client";
import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { loadStripe } from '@stripe/stripe-js';

interface Event {
  id: string;
  name: string;
  date: string;
  formUrl: string;
}

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export default function EventDetailsPage() {
  const { eventId } = useParams();
  const router = useRouter();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [error, setError] = useState('');
  const [hasTicket, setHasTicket] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    fetchEvent();
    // Get user ID from localStorage
    if (typeof window !== 'undefined') {
      const profileStr = localStorage.getItem('mm_user_profile');
      if (profileStr) {
        const profile = JSON.parse(profileStr);
        setUserId(profile.id);
        checkTicketStatus(profile.id);
      }
    }
  }, [eventId]);

  const fetchEvent = async () => {
    try {
      const res = await fetch(`/api/events/${eventId}`);
      const data = await res.json();
      if (res.ok) {
        setEvent(data.event);
      } else {
        setError(data.error || 'Event not found');
      }
    } catch (err) {
      setError('Failed to fetch event');
    } finally {
      setLoading(false);
    }
  };

  const checkTicketStatus = async (userId: string) => {
    try {
      const res = await fetch(`/api/user/events?userId=${userId}`);
      const data = await res.json();
      if (res.ok) {
        const hasTicketForThisEvent = data.events.some((e: Event) => e.id === eventId);
        setHasTicket(hasTicketForThisEvent);
      }
    } catch (err) {
      console.error('Failed to check ticket status:', err);
    }
  };

  const handleBuyTicket = async () => {
    if (!userId) {
      setError('Please log in to purchase tickets');
      return;
    }

    try {
      setPurchasing(true);
      setError('');

      // Create payment intent
      const res = await fetch('/api/tickets/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, eventId }),
      });

      const data = await res.json();
      
      if (!res.ok) {
        if (res.status === 409) {
          setHasTicket(true);
          setError('You already have a ticket for this event');
        } else {
          setError(data.error || 'Failed to process ticket purchase');
        }
        return;
      }

      // Initialize Stripe
      const stripe = await stripePromise;
      if (!stripe) {
        setError('Payment service not available');
        return;
      }

      // Confirm payment
      const { error: stripeError } = await stripe.confirmPayment({
        clientSecret: data.clientSecret,
        confirmParams: {
          return_url: `${window.location.origin}/event/${eventId}?success=true`,
        },
      });

      if (stripeError) {
        setError(stripeError.message || 'Payment failed');
      } else {
        setHasTicket(true);
      }

    } catch (err) {
      setError('Payment processing failed. Please try again.');
      console.error('Payment error:', err);
    } finally {
      setPurchasing(false);
    }
  };

  // Check for success parameter in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get('success');
    
    if (success === 'true') {
      setHasTicket(true);
      // Clean up URL
      window.history.replaceState({}, document.title, `/event/${eventId}`);
    }
  }, [eventId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#181c24]">
        <div className="text-white text-xl">Loading event...</div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#181c24]">
        <div className="bg-white rounded-2xl shadow-2xl p-10 text-center">
          <h1 className="text-3xl font-serif font-bold text-[#D4AF37] mb-4">Event Not Found</h1>
          <Link href="/events" className="text-[#D4AF37] underline">Back to Events</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#181c24] flex flex-col items-center justify-center px-4 py-16">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8 flex flex-col md:flex-row gap-8">
        <div className="w-full md:w-80 h-64 bg-gradient-to-br from-[#D4AF37] to-[#e6c97a] rounded-xl shadow flex items-center justify-center">
          <span className="text-8xl">🌙</span>
        </div>
        <div className="flex-1 flex flex-col">
          <h1 className="text-3xl font-serif font-bold text-[#181c24] mb-2">{event.name}</h1>
          <div className="text-[#D4AF37] font-semibold mb-1">
            {new Date(event.date).toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </div>
          <div className="text-[#23283a] mb-3">
            {new Date(event.date).toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </div>
          <p className="text-[#23283a] mb-6">
            Join us for an exclusive Moonlight Match event. Experience luxury matchmaking in an elegant setting with curated guests and sophisticated matchmaking technology.
          </p>

          {error && (
            <div className="bg-red-100 text-red-800 p-3 rounded-lg mb-4 text-center">
              {error}
            </div>
          )}

          {hasTicket ? (
            <div className="text-center">
              <div className="px-8 py-3 rounded-full bg-green-100 text-green-800 font-bold text-lg border-2 border-green-300 mb-4">
                ✓ Ticket Purchased
              </div>
              <Link
                href={`/event/${event.id}/qr`}
                className="inline-block px-8 py-3 rounded-full bg-[#181c24] text-[#D4AF37] font-bold text-lg hover:bg-[#23283a] transition border-2 border-[#D4AF37] text-center"
              >
                View My QR Code
              </Link>
            </div>
          ) : (
            <button
              className="px-8 py-3 rounded-full bg-[#D4AF37] text-[#181c24] font-bold text-lg hover:bg-[#e6c97a] transition shadow border-2 border-[#D4AF37] mt-auto disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={purchasing || !userId}
              onClick={handleBuyTicket}
            >
              {purchasing ? "Processing..." : !userId ? "Login to Purchase" : "Buy Ticket - 50 RON"}
            </button>
          )}

          {!userId && (
            <div className="mt-6 text-center">
              <p className="text-[#23283a] mb-4">Create an account to purchase tickets</p>
              <div className="flex gap-4 justify-center">
                <Link
                  href="/register"
                  className="px-6 py-2 rounded-full bg-[#D4AF37] text-[#181c24] font-bold hover:bg-[#e6c97a] transition border-2 border-[#D4AF37]"
                >
                  Register
                </Link>
                <Link
                  href="/login"
                  className="px-6 py-2 rounded-full border-2 border-[#D4AF37] text-[#D4AF37] font-bold bg-transparent hover:bg-[#D4AF37]/10 transition"
                >
                  Sign In
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 