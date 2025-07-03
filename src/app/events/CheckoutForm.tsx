import React from 'react';
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

export default function CheckoutForm({ onSuccess, onError }: { onSuccess?: () => void, onError?: (error: any) => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setLoading(true);
    if (!stripe || !elements) {
      setLoading(false);
      return;
    }
    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.href,
      },
    });
    setLoading(false);
    if (error) {
      setError(error.message || 'Payment failed.');
      if (onError) onError(error);
    } else {
      if (onSuccess) onSuccess();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-4">
      <PaymentElement />
      {error && <div className="text-red-600 text-sm text-center">{error}</div>}
      <button
        type="submit"
        disabled={!stripe || loading}
        className="px-6 py-3 rounded-full bg-[#D4AF37] text-[#181c24] font-bold text-lg hover:bg-[#e6c97a] transition border-2 border-[#D4AF37] mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Processing...' : 'Pay 50 RON'}
      </button>
    </form>
  );
} 