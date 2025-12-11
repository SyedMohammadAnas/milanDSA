'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function RSVPContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [studentEmail] = useState(() => {
    // Initialize student email from localStorage
    const email = localStorage.getItem('studentEmail');
    if (email) {
      console.log('[RSVP PAGE] Student session found:', email);
      return email;
    }
    return '';
  });

  // Initialize error state based on source validation
  const [error, setError] = useState(() => {
    const source = searchParams.get('source');
    if (source !== 'station_qr') {
      console.log('[RSVP PAGE] Invalid RSVP source');
      return 'Invalid RSVP source';
    }
    return '';
  });

  useEffect(() => {
    // Check if student is logged in
    if (!studentEmail) {
      console.log('[RSVP PAGE] No student session found, redirecting to login');
      router.push('/login');
      return;
    }
  }, [router, studentEmail]);

  const handleYes = async () => {
    console.log('[RSVP PAGE] Student confirmed RSVP');
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/rsvp/confirm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: studentEmail }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.log('[RSVP PAGE] RSVP confirmation failed:', data.error);
        setError(data.error || 'Failed to confirm RSVP');
        setLoading(false);
        return;
      }

      console.log('[RSVP PAGE] RSVP confirmed successfully');

      // Redirect to success page
      router.push('/rsvp/success');
    } catch (err) {
      console.error('[RSVP PAGE] Error during RSVP confirmation:', err);
      setError('An error occurred. Please try again.');
      setLoading(false);
    }
  };

  const handleNo = () => {
    console.log('[RSVP PAGE] Student declined RSVP');
    router.push('/account');
  };

  if (!studentEmail) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-black flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-black flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Milan 26&apos;</h1>
          <p className="text-gray-300">RSVP Confirmation</p>
        </div>

        {/* RSVP Card */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-white/20">
          <div className="text-center mb-8">
            <svg className="w-20 h-20 mx-auto mb-4 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="text-2xl font-bold text-white mb-4">
              Are you ready to RSVP?
            </h2>
            <p className="text-gray-200 text-lg mb-2">
              Are you available at the station to convert your ticket?
            </p>
            <p className="text-gray-400 text-sm">
              This will add you to the print queue
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 text-red-200 text-sm mb-6">
              {error}
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-4">
            <button
              onClick={handleYes}
              disabled={loading || !!error}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold py-4 rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Confirming...' : 'Yes, I\'m Ready!'}
            </button>

            <button
              onClick={handleNo}
              disabled={loading}
              className="w-full bg-white/10 border-2 border-white/30 text-white font-semibold py-4 rounded-xl hover:bg-white/20 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              No, Not Yet
            </button>
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-6 bg-blue-500/20 border border-blue-500/50 rounded-lg p-4">
          <p className="text-blue-200 text-sm text-center">
            Make sure you&apos;re near a station before confirming
          </p>
        </div>
      </div>
    </div>
  );
}

export default function RSVPPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <RSVPContent />
    </Suspense>
  );
}
