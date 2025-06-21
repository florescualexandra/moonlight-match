"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      setLoading(false);
      if (!res.ok) {
        setError(data.error || "Login failed.");
        return;
      }
      if (typeof window !== 'undefined') {
        localStorage.setItem('mm_logged_in', 'true');
        localStorage.setItem('mm_email', data.email);
        localStorage.setItem('mm_user_profile', JSON.stringify(data));
        if (data.isAdmin) {
          router.push('/admin/events');
        } else {
          router.push('/user');
        }
      }
    } catch (err) {
      setLoading(false);
      setError("Login failed. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-[#181c24] flex flex-col items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center mt-16">
        <h1 className="text-3xl font-serif font-bold text-[#D4AF37] mb-4">Sign In</h1>
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <input
            type="email"
            required
            placeholder="Email address"
            className="px-4 py-3 rounded-full border-2 border-[#D4AF37] focus:outline-none focus:ring-2 focus:ring-[#D4AF37] text-[#181c24] text-lg"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
          <input
            type="password"
            required
            placeholder="Password"
            className="px-4 py-3 rounded-full border-2 border-[#D4AF37] focus:outline-none focus:ring-2 focus:ring-[#D4AF37] text-[#181c24] text-lg"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
          {error && <div className="text-red-600 font-semibold text-sm -mt-4">{error}</div>}
          <button
            type="submit"
            disabled={loading}
            className="px-8 py-3 rounded-full bg-[#D4AF37] text-[#181c24] font-bold text-lg hover:bg-[#e6c97a] transition shadow border-2 border-[#D4AF37]"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
} 