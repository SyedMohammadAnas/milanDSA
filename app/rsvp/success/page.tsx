'use client';

import { useRouter } from 'next/navigation';

export default function RSVPSuccessPage() {
  const router = useRouter();

  const handleNext = () => {
    console.log('[RSVP SUCCESS] Redirecting to account page');
    router.push('/account');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-black flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Milan 26&apos;</h1>
          <p className="text-gray-300">RSVP Confirmed</p>
        </div>

        {/* Success Card */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-white/20 mb-6">
          <div className="text-center mb-6">
            <svg className="w-20 h-20 mx-auto mb-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="text-2xl font-bold text-white mb-2">
              RSVP Confirmed!
            </h2>
            <p className="text-gray-200">
              Go to the nearest station to collect your physical ticket
            </p>
          </div>

          {/* Map Placeholder */}
          <div className="bg-white/10 rounded-lg p-4 mb-6">
            <div className="aspect-video bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-lg flex items-center justify-center border border-white/20">
              <div className="text-center">
                <svg className="w-16 h-16 mx-auto mb-2 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
                <p className="text-white/70 text-sm">Station Location Map</p>
                <p className="text-white/50 text-xs mt-1">(Placeholder Image)</p>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-4 mb-6">
            <h3 className="text-green-200 font-semibold mb-2">Next Steps:</h3>
            <ol className="text-green-200 text-sm space-y-1 list-decimal list-inside">
              <li>Locate the nearest station on the map</li>
              <li>Show this confirmation to the operator</li>
              <li>Collect your physical ticket</li>
            </ol>
          </div>

          {/* Next Button */}
          <button
            onClick={handleNext}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold py-4 rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all duration-200 shadow-lg"
          >
            Next
          </button>
        </div>

        {/* Info Box */}
        <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-4">
          <p className="text-yellow-200 text-sm text-center">
            <strong>Important:</strong> Please collect your ticket as soon as possible
          </p>
        </div>
      </div>
    </div>
  );
}
