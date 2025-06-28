import Link from 'next/link';

export default function Home() {
  return (
    <div style={{ color: '#D4AF37', textAlign: 'center', marginTop: 100 }}>
      <h1>Welcome to Moonlight Match!</h1>
      <p>Get started by logging in or browsing events.</p>
      <p>
        <a href="/matches" style={{ color: '#D4AF37', textDecoration: 'underline' }}>See your matches</a>
      </p>
      <p>
        <a href="/admin-matching" style={{ color: '#D4AF37', textDecoration: 'underline' }}>Admin Matching</a>
      </p>
    </div>
  );
}
