export default function PaymentSuccess() {
  return (
    <div style={{ textAlign: 'center', marginTop: '4rem' }}>
      <h1>🎉 Payment Successful!</h1>
      <p>Your next match has been revealed. Go check your matches!</p>
      <a href="/matches">
        <button style={{ marginTop: '2rem', padding: '1rem 2rem', fontSize: '1.2rem' }}>
          View My Matches
        </button>
      </a>
    </div>
  );
} 