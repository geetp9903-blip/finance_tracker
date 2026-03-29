"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SetupUsernamePage() {
    const [username, setUsername] = useState('');
    const [pin, setPin] = useState('');
    const [confirmPin, setConfirmPin] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (pin !== confirmPin) {
            setError('PINs do not match');
            return;
        }

        if (pin.length < 4) {
            setError('PIN must be at least 4 digits');
            return;
        }

        setIsLoading(true);

        try {
            const res = await fetch('/api/auth/setup-username', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, pin })
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || 'Failed to setup username');
                setIsLoading(false);
                return;
            }

            // Success, redirect to dashboard
            router.push('/dashboard');
            router.refresh();

        } catch (err) {
            setError('An error occurred during setup');
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                    Complete your profile
                </h2>
                <p className="mt-2 text-center text-sm text-gray-600">
                    Choose a unique username and a PIN to secure your account.
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
                    <form className="space-y-6" onSubmit={handleSubmit}>
                        {error && (
                            <div className="bg-red-50 border-l-4 border-red-400 p-4">
                                <p className="text-sm text-red-700">{error}</p>
                            </div>
                        )}
                        <div>
                            <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                                Username
                            </label>
                            <div className="mt-1">
                                <input
                                    id="username"
                                    name="username"
                                    type="text"
                                    required
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                    placeholder="johndoe123"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="pin" className="block text-sm font-medium text-gray-700">
                                Create PIN
                            </label>
                            <div className="mt-1">
                                <input
                                    id="pin"
                                    name="pin"
                                    type="password"
                                    required
                                    maxLength={6}
                                    value={pin}
                                    onChange={(e) => setPin(e.target.value.replace(/[^0-9]/g, ''))}
                                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                    placeholder="4-6 digits"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="confirmPin" className="block text-sm font-medium text-gray-700">
                                Confirm PIN
                            </label>
                            <div className="mt-1">
                                <input
                                    id="confirmPin"
                                    name="confirmPin"
                                    type="password"
                                    required
                                    maxLength={6}
                                    value={confirmPin}
                                    onChange={(e) => setConfirmPin(e.target.value.replace(/[^0-9]/g, ''))}
                                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                    placeholder="Repeat PIN"
                                />
                            </div>
                        </div>

                        <div>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                            >
                                {isLoading ? 'Setting up...' : 'Complete Profile'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
