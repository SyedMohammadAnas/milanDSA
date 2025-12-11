'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Operator {
  id: string;
  username: string;
  station_number: number;
  printed_tickets: number;
}

export default function OperatorDashboard() {
  const router = useRouter();
  const [operator, setOperator] = useState<Operator | null>(null);

  useEffect(() => {
    // Initialize operator from localStorage on client side
    if (typeof window !== 'undefined') {
      const operatorData = localStorage.getItem('operator');
      if (operatorData) {
        const parsedOperator = JSON.parse(operatorData);
        console.log('[OPERATOR DASHBOARD] Operator session found:', parsedOperator.username);
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setOperator(parsedOperator);
      } else {
        console.log('[OPERATOR DASHBOARD] No operator session found, redirecting to login');
        router.push('/operator/login');
      }
    }
  }, [router]);

  if (!operator) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-black flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  const navigateTo = (path: string) => {
    console.log('[OPERATOR DASHBOARD] Navigating to:', path);
    router.push(path);
  };

  return (
    <div className="min-h-screen bg-white p-4">
      {/* Header */}
      <div className="bg-gray-50 rounded-2xl p-6 mb-6 border border-gray-200">
        <h1 className="text-3xl font-bold text-gray-800 text-center mb-2">Milan 26&apos;</h1>
        <p className="text-gray-600 text-center">
          Welcome <span className="font-semibold text-green-700">{operator.username}</span>, select task to continue
        </p>
      </div>

      {/* Task Options */}
      <div className="space-y-4 max-w-md mx-auto">
        {/* Print Tickets */}
        <button
          onClick={() => navigateTo('/operator/dashboard/print-tickets')}
          className="w-full bg-green-600 text-white font-semibold py-6 rounded-xl hover:bg-green-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center space-x-3"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          <span className="text-xl">Print Tickets</span>
        </button>

        {/* Verify QR */}
        <button
          onClick={() => navigateTo('/operator/dashboard/verify-qr')}
          className="w-full bg-green-600 text-white font-semibold py-6 rounded-xl hover:bg-green-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center space-x-3"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
          </svg>
          <span className="text-xl">Verify QR</span>
        </button>

        {/* My Profile */}
        <button
          onClick={() => navigateTo('/operator/dashboard/profile')}
          className="w-full bg-green-600 text-white font-semibold py-6 rounded-xl hover:bg-green-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center space-x-3"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <span className="text-xl">My Profile</span>
        </button>
      </div>
    </div>
  );
}
