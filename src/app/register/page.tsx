"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [retainDataConsent, setRetainDataConsent] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          name: email.split('@')[0].charAt(0).toUpperCase() + email.split('@')[0].slice(1),
          description: "A passionate guest seeking meaningful connections at Moonlight Match events. (Imported from Google Form)",
          retainDataConsent,
        }),
      });
      const data = await res.json();
      setLoading(false);
      if (!res.ok) {
        setError(data.error || "Registration failed.");
        return;
      }
      // Optionally store user info in localStorage for session
      if (typeof window !== 'undefined') {
        localStorage.setItem('mm_logged_in', 'true');
        localStorage.setItem('mm_email', data.email);
        localStorage.setItem('mm_user_profile', JSON.stringify(data));
      }
      router.push("/user");
    } catch (err) {
      setLoading(false);
      setError("Registration failed. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-[#181c24] flex flex-col items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center mt-16">
        <h1 className="text-3xl font-serif font-bold text-[#D4AF37] mb-4">Register</h1>
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
            placeholder="Password (min 8 characters)"
            className="px-4 py-3 rounded-full border-2 border-[#D4AF37] focus:outline-none focus:ring-2 focus:ring-[#D4AF37] text-[#181c24] text-lg"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
          <div className="mb-4">
            <label className="block text-[#23283a] text-sm font-bold mb-2" htmlFor="confirmPassword">
              Confirm Password
            </label>
          <input
            type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-[#23283a] leading-tight focus:outline-none focus:shadow-outline"
            required
            />
          </div>
          <div className="mb-6">
            <label className="flex items-center text-[#23283a] text-sm">
              <input
                type="checkbox"
                checked={retainDataConsent}
                onChange={(e) => setRetainDataConsent(e.target.checked)}
                className="mr-2"
              />
              I agree to have my data stored for more than 24 hours
            </label>
          </div>
          {error && <div className="text-red-600 font-semibold text-sm -mt-4">{error}</div>}
          <button
            type="submit"
            disabled={loading}
            className="px-8 py-3 rounded-full bg-[#D4AF37] text-[#181c24] font-bold text-lg hover:bg-[#e6c97a] transition shadow border-2 border-[#D4AF37]"
          >
            {loading ? "Registering..." : "Register"}
          </button>
        </form>
        <div className="mt-8 text-xs text-[#23283a] bg-gray-100 rounded p-3">
          <b>Privacy & Security:</b> Your email and password are securely stored and never shared. We use strong encryption and never display your personal information to other users. By registering, you agree to our <a href="#" className="text-[#D4AF37] underline">Privacy Policy</a>.
        </div>
      </div>
    </div>
  );
} 