import Link from 'next/link';

export default function Home() {
  return (
    <main style={{ fontFamily: 'sans-serif', padding: 40, maxWidth: 600, margin: '0 auto' }}>
      <h1 style={{ color: '#D4AF37', fontSize: 40 }}>Moonlight Match</h1>
      <p style={{ fontSize: 20, margin: '24px 0' }}>
        Welcome to Moonlight Match! Buy tickets and get matched at our exclusive events.
      </p>
      <p style={{ fontSize: 18 }}>
        Contact: <a href="mailto:your@email.com">your@email.com</a>
      </p>
      <p style={{ marginTop: 32 }}>
        <Link href="/terms">Terms of Service</Link> | <Link href="/privacy">Privacy Policy</Link>
      </p>
    </main>
  );
}
