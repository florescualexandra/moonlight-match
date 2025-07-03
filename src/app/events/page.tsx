'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import CheckoutForm from './CheckoutForm';

interface Event {
  id: string;
  name: string;
  date: string;
  formUrl: string;
}

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [purchasedEvents, setPurchasedEvents] = useState<string[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [showPayment, setShowPayment] = useState(false);
  const [paymentClientSecret, setPaymentClientSecret] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  useEffect(() => {
    fetchEvents();
    // Get user ID from localStorage
    if (typeof window !== 'undefined') {
      const profileStr = localStorage.getItem('mm_user_profile');
      if (profileStr) {
        const profile = JSON.parse(profileStr);
        setUserId(profile.id);
      }
    }
  }, []);

  const fetchEvents = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/events');
      const data = await res.json();
      if (res.ok) {
        setEvents(data.events);
      } else {
        setError(data.error || 'Failed to fetch events');
      }
    } catch (err) {
      setError('Network error.');
    } finally {
      setLoading(false);
    }
  };

  // Helper to filter out past events
  const getUpcomingEvents = () => {
    const now = new Date();
    return events.filter(event => {
      const eventDate = new Date(event.date);
      // Keep events that are today or in the future
      return (
        eventDate.getFullYear() > now.getFullYear() ||
        (eventDate.getFullYear() === now.getFullYear() && eventDate.getMonth() > now.getMonth()) ||
        (eventDate.getFullYear() === now.getFullYear() && eventDate.getMonth() === now.getMonth() && eventDate.getDate() >= now.getDate())
      );
    });
  };

  const handleBuyTicket = async (event: Event) => {
    if (!userId) {
      setError('Please log in to purchase tickets');
      return;
    }
    try {
      setPurchasing(event.id);
      setError('');
      // Use Stripe Checkout session for ticket purchase
      const res = await fetch('/api/payments/ticket-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId: event.id, userId }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) {
        setError(data.error || 'Failed to process ticket purchase');
        setPurchasing(null);
        return;
      }
      window.location.href = data.url; // Redirect to Stripe Checkout
    } catch (err) {
      setError('Payment processing failed. Please try again.');
      console.error('Payment error:', err);
    } finally {
      setPurchasing(null);
    }
  };

  // Check for success parameter in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get('success');
    const eventId = urlParams.get('eventId');
    
    if (success === 'true' && eventId) {
      setPurchasedEvents(prev => [...prev, eventId]);
      // Clean up URL
      window.history.replaceState({}, document.title, '/events');
    }
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#181c24] flex items-center justify-center">
        <div className="text-white text-xl">Loading events...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#181c24] py-16 px-4">
      <button
        className="mb-8 px-6 py-3 rounded-full bg-[#D4AF37] text-[#181c24] font-bold text-lg border-2 border-[#D4AF37] hover:bg-[#e6c97a] transition"
        onClick={() => window.location.href = '/user'}
        style={{ display: 'block', marginLeft: 0 }}
      >
        &larr; Back to Dashboard
      </button>
      <h1 className="text-4xl font-serif font-bold text-[#D4AF37] text-center mb-12">Upcoming Events</h1>
      
      {error && (
        <div className="max-w-6xl mx-auto mb-8">
          <div className="bg-red-500 text-white p-4 rounded-lg text-center">
            {error}
          </div>
        </div>
      )}

      {/* Payment Modal or Inline */}
      {showPayment && paymentClientSecret && selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-lg w-full relative">
            <button
              className="absolute top-4 right-4 text-[#D4AF37] text-2xl font-bold hover:text-[#181c24]"
              onClick={() => { setShowPayment(false); setPaymentClientSecret(null); setSelectedEvent(null); }}
            >
              &times;
            </button>
            <h2 className="text-2xl font-serif font-bold text-[#181c24] mb-4 text-center">Buy Ticket for {selectedEvent.name}</h2>
            <Elements stripe={stripePromise} options={{ clientSecret: paymentClientSecret }}>
              <CheckoutForm
                onSuccess={() => {
                  setShowPayment(false);
                  setPaymentClientSecret(null);
                  setSelectedEvent(null);
                  setPurchasedEvents(prev => [...prev, selectedEvent.id]);
                }}
                onError={err => setError(err.message || 'Payment failed.')}
              />
            </Elements>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-10">
        {getUpcomingEvents().map(event => (
          <div key={event.id} className="bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            <div className="w-full h-48 bg-gradient-to-br from-[#D4AF37] to-[#e6c97a] flex items-center justify-center">
              <span className="text-6xl">🌙</span>
            </div>
            <div className="p-6 flex flex-col flex-1">
              <h2 className="text-2xl font-serif font-bold text-[#181c24] mb-2">{event.name}</h2>
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
              <p className="text-[#23283a] mb-4 flex-1">
                Join us for an exclusive Moonlight Match event. Experience luxury matchmaking in an elegant setting.
              </p>
              
              {purchasedEvents.includes(event.id) ? (
                <div className="text-center">
                  <div className="px-6 py-3 rounded-full bg-green-100 text-green-800 font-bold text-lg border-2 border-green-300">
                    ✓ Ticket Purchased
                  </div>
                  <Link
                    href={`/event/${event.id}`}
                    className="block mt-3 text-[#D4AF37] hover:underline font-semibold"
                  >
                    View Details
                  </Link>
                </div>
              ) : (
                <button
                  onClick={() => handleBuyTicket(event)}
                  disabled={purchasing === event.id || !userId}
                  className="px-6 py-3 rounded-full bg-[#D4AF37] text-[#181c24] font-bold text-lg hover:bg-[#e6c97a] transition shadow border-2 border-[#D4AF37] mt-auto disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {purchasing === event.id ? 'Processing...' : !userId ? 'Login to Purchase' : 'Buy Ticket - 50 RON'}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {!loading && getUpcomingEvents().length === 0 && !error && (
        <div className="text-center text-white mt-16">
          <h2 className="text-2xl font-serif font-bold text-[#D4AF37] mb-4">No Upcoming Events</h2>
          <p className="text-lg">Check back soon for new events!</p>
        </div>
      )}

      {!userId && (
        <div className="max-w-6xl mx-auto mt-12 text-center">
          <div className="bg-white/10 rounded-2xl p-8 border border-[#D4AF37]/20">
            <h3 className="text-xl font-serif font-bold text-[#D4AF37] mb-4">Ready to Join?</h3>
            <p className="text-white mb-6">Create an account to purchase tickets and participate in our events.</p>
            <div className="flex gap-4 justify-center">
              <Link
                href="/register"
                className="px-8 py-3 rounded-full bg-[#D4AF37] text-[#181c24] font-bold text-lg hover:bg-[#e6c97a] transition shadow border-2 border-[#D4AF37]"
              >
                Register Now
              </Link>
              <Link
                href="/login"
                className="px-8 py-3 rounded-full border-2 border-[#D4AF37] text-[#D4AF37] font-bold text-lg bg-transparent hover:bg-[#D4AF37]/10 transition"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 