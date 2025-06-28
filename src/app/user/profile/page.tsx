"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
    const [userData, setUserData] = useState<any>(null);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [formResponse, setFormResponse] = useState<Record<string, any>>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const router = useRouter();

    useEffect(() => {
        const fetchProfile = async () => {
            setLoading(true);
            const email = localStorage.getItem('mm_email');
            if (!email) {
                router.push('/login');
                return;
            }

            try {
                const res = await fetch(`/api/user-profile?email=${email}`);
                if (!res.ok) {
                    throw new Error('Failed to fetch profile.');
                }
                const data = await res.json();
                setUserData(data);
                setName(data.name || '');
                setDescription(data.description || '');
                setFormResponse(data.formResponse || {});
            } catch (err: any) {
                setError(err.message || 'An error occurred.');
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        const email = localStorage.getItem('mm_email');
        if (!email) {
            setError('User session not found. Please log in again.');
            setLoading(false);
            return;
        }

        // First, handle the file upload if a new file is selected
        if (file) {
            try {
                const formData = new FormData();
                formData.append('file', file);
                if (email) {
                    formData.append('email', email);
                }

                const uploadRes = await fetch('/api/user/upload-photo', {
                    method: 'POST',
                    body: formData,
                });

                const uploadData = await uploadRes.json();
                if (!uploadRes.ok || !uploadData.success) {
                    throw new Error(uploadData.error || 'Failed to upload photo.');
                }
                
                // The API returns the new image path, so we can update the user data
                setUserData((prev: any) => ({ ...prev, image: uploadData.image }));

            } catch (err: any) {
                setError(`Photo upload failed: ${err.message}`);
                setLoading(false);
                return; // Stop if photo upload fails
            }
        }

        // Next, update the rest of the profile data
        try {
            const res = await fetch('/api/user-profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, name, description, formResponse }),
            });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || 'Failed to update profile.');
            }
            setSuccess('Profile updated successfully!');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            setFile(selectedFile);
            setImagePreview(URL.createObjectURL(selectedFile));
        }
    };

    if (loading) {
        return <div className="min-h-screen bg-[#181c24] flex items-center justify-center text-white">Loading profile...</div>;
    }

    return (
        <div className="min-h-screen bg-[#181c24] text-white p-8">
            <button onClick={() => router.back()} className="mb-8 bg-[#D4AF37] text-[#181c24] font-bold py-2 px-4 rounded-full transition hover:bg-[#e6c97a]">
                &larr; Back
            </button>
            <h1 className="text-4xl font-serif text-[#D4AF37] mb-8">Edit Your Profile</h1>
            {error && <div className="bg-red-500/20 border border-red-500 text-red-300 p-3 rounded-lg mb-4">{error}</div>}
            {success && <div className="bg-green-500/20 border border-green-500 text-green-300 p-3 rounded-lg mb-4">{success}</div>}
            
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label htmlFor="name" className="block text-lg font-semibold mb-2">Name</label>
                    <input
                        id="name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-[#2a313c] border border-[#D4AF37] rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                    />
                </div>
                <div>
                    <label htmlFor="description" className="block text-lg font-semibold mb-2">Description</label>
                    <textarea
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={4}
                        className="w-full bg-[#2a313c] border border-[#D4AF37] rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                    />
                </div>

                <h2 className="text-2xl font-serif text-[#D4AF37] pt-4 border-t border-gray-700">Your Responses</h2>
                <div className="space-y-4">
                    {Object.entries(formResponse).map(([question, answer]) => (
                        <div key={question}>
                            <label className="block text-md font-medium text-gray-400">{question}</label>
                            <input
                                type="text"
                                value={String(answer)}
                                onChange={(e) => setFormResponse(prev => ({ ...prev, [question]: e.target.value }))}
                                className="w-full bg-[#2a313c] border border-gray-600 rounded-lg px-4 py-3 mt-1 focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                            />
                        </div>
                    ))}
                </div>

                <div className="text-center">
                    <label htmlFor="photo-upload" className="block text-[#D4AF37] text-sm font-bold mb-2">
                        Profile Photo
                    </label>
                    {(imagePreview || userData?.image) && (
                        <img 
                            src={imagePreview || userData?.image} 
                            alt="Profile Preview" 
                            className="w-32 h-32 rounded-full object-cover mx-auto my-4 border-4 border-white/20"
                        />
                    )}
                    <input
                        id="photo-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="text-sm text-slate-500
                            file:mr-4 file:py-2 file:px-4
                            file:rounded-full file:border-0
                            file:text-sm file:font-semibold
                            file:bg-white/10 file:text-[#D4AF37]
                            hover:file:bg-white/20
                        "
                    />
                </div>

                <button type="submit" disabled={loading} className="w-full bg-[#D4AF37] text-[#181c24] font-bold py-3 px-6 rounded-full text-lg transition hover:bg-[#e6c97a] disabled:opacity-50">
                    {loading ? 'Saving...' : 'Save Changes'}
                </button>
            </form>
        </div>
    );
} 