'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Operator {
  id: string;
  username: string;
  station_number: number;
  printed_tickets: number;
}

export default function OperatorProfilePage() {
  const router = useRouter();
  const [operator] = useState<Operator | null>(() => {
    // Initialize operator from localStorage
    const operatorData = localStorage.getItem('operator');
    if (operatorData) {
      const parsedOperator = JSON.parse(operatorData);
      console.log('[OPERATOR PROFILE] Loaded operator:', parsedOperator.username);
      return parsedOperator;
    }
    return null;
  });

  useEffect(() => {
    // Check if operator is logged in
    if (!operator) {
      console.log('[OPERATOR PROFILE] No operator session, redirecting to login');
      router.push('/operator/login');
    }
  }, [operator, router]);

  const handleLogout = () => {
    console.log('[OPERATOR PROFILE] Logging out operator:', operator?.username);

    // Clear operator data from localStorage
    localStorage.removeItem('operator');
    localStorage.removeItem('selectedTickets');

    // Redirect to login
    router.push('/operator/login');
  };

  if (!operator) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-gray-800 text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-4">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="text-gray-600 hover:text-gray-800 flex items-center space-x-2 mb-4"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span>Back</span>
        </button>
        <h1 className="text-3xl font-bold text-gray-800">My Profile</h1>
      </div>

      {/* Profile Card */}
      <div className="max-w-md mx-auto">
        <div className="bg-gray-50 rounded-2xl p-8 border border-gray-200 mb-6">
          {/* Profile Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-24 h-24 bg-green-600 rounded-full flex items-center justify-center">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
          </div>

          {/* Operator Details */}
          <div className="space-y-4">
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <p className="text-gray-500 text-sm mb-1">Username</p>
              <p className="text-gray-900 text-xl font-semibold">{operator.username}</p>
            </div>

            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <p className="text-gray-500 text-sm mb-1">Station Number</p>
              <p className="text-gray-900 text-xl font-semibold">Station {operator.station_number}</p>
            </div>

            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <p className="text-gray-500 text-sm mb-1">Tickets Printed</p>
              <p className="text-gray-900 text-xl font-semibold">{operator.printed_tickets} tickets</p>
            </div>
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="w-full bg-red-500 text-white font-semibold py-4 rounded-xl hover:bg-red-600 transition-all duration-200 shadow-lg flex items-center justify-center space-x-3"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span>Logout</span>
        </button>

        {/* Info Box */}
        <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-800 text-sm text-center">
            Thank you for your service at Milan 26&apos;!
          </p>
        </div>
      </div>
    </div>
  );
}
