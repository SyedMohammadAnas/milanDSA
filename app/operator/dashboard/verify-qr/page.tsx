'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Operator {
  id: string;
  username: string;
  station_number: number;
  printed_tickets: number;
}

interface Ticket {
  id: string;
  name: string;
  registration_number: string;
  email: string;
  event_name: string;
  booking_reference: string;
  ticket_price: number;
  rsvp_status?: string;
  qr_code_data?: any;
}

export default function VerifyQRPage() {
  const router = useRouter();
  const [operator, setOperator] = useState<Operator | null>(null);
  const [manualEntry, setManualEntry] = useState('');
  const [searchResults, setSearchResults] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    // Check if operator is logged in
    const operatorData = localStorage.getItem('operator');
    if (!operatorData) {
      console.log('[VERIFY QR] No operator session, redirecting to login');
      router.push('/operator/login');
      return;
    }

    const parsedOperator = JSON.parse(operatorData);
    setOperator(parsedOperator);
  }, [router]);

  const handleManualSearch = async (value: string) => {
    setManualEntry(value);
    setMessage('');
    setSelectedTicket(null);

    if (value.length < 2) {
      setSearchResults([]);
      return;
    }

    console.log('[VERIFY QR] Searching for tickets:', value);
    setLoading(true);

    try {
      const response = await fetch(`/api/operator/verify-ticket?ticketRef=${encodeURIComponent(value)}`);
      const data = await response.json();

      if (response.ok) {
        console.log('[VERIFY QR] Found', data.tickets?.length || 0, 'tickets');
        setSearchResults(data.tickets || []);
      } else {
        console.log('[VERIFY QR] Search failed');
        setSearchResults([]);
      }
    } catch (error) {
      console.error('[VERIFY QR] Error searching:', error);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTicket = (ticket: Ticket) => {
    console.log('[VERIFY QR] Selected ticket:', ticket.booking_reference);
    setSelectedTicket(ticket);
  };

  const handleAddToSelection = async () => {
    if (!selectedTicket) return;

    console.log('[VERIFY QR] Adding stranded student to selection:', selectedTicket.booking_reference);
    setLoading(true);

    try {
      const response = await fetch('/api/operator/verify-ticket', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ticketReference: selectedTicket.booking_reference
        }),
      });

      const data = await response.json();

      if (response.ok) {
        console.log('[VERIFY QR] Student added to RSVP list');
        setMessage(data.message);

        // Add to persistent selection in localStorage
        const savedSelection = localStorage.getItem('selectedTickets');
        const currentSelection = savedSelection ? JSON.parse(savedSelection) : [];

        if (!currentSelection.includes(selectedTicket.booking_reference)) {
          if (currentSelection.length < 10) {
            currentSelection.push(selectedTicket.booking_reference);
            localStorage.setItem('selectedTickets', JSON.stringify(currentSelection));
            console.log('[VERIFY QR] Added to print selection');
          } else {
            setMessage('Print selection is full (10 max). Please print first.');
          }
        }

        // Clear form
        setTimeout(() => {
          setManualEntry('');
          setSearchResults([]);
          setSelectedTicket(null);
          setMessage('');
        }, 2000);
      } else {
        console.error('[VERIFY QR] Error adding student:', data.error);
        setMessage('Error: ' + data.error);
      }
    } catch (error) {
      console.error('[VERIFY QR] Error:', error);
      setMessage('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleScanQR = () => {
    console.log('[VERIFY QR] QR Scanner would open here');
    alert('QR Scanner functionality will be implemented with a camera library');
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
        <h1 className="text-3xl font-bold text-gray-800">Verify QR</h1>
        <p className="text-gray-600 mt-2">Scan or manually enter ticket reference</p>
      </div>

      {/* Scan QR Button */}
      <button
        onClick={handleScanQR}
        className="w-full bg-green-600 text-white font-semibold py-6 rounded-xl hover:bg-green-700 transition-all duration-200 shadow-lg mb-6 flex items-center justify-center space-x-3"
      >
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
        </svg>
        <span className="text-xl">Scan Now</span>
      </button>

      {/* Divider */}
      <div className="flex items-center my-6">
        <div className="flex-1 border-t border-gray-300"></div>
        <span className="px-4 text-gray-500">OR</span>
        <div className="flex-1 border-t border-gray-300"></div>
      </div>

      {/* Manual Entry */}
      <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
        <h2 className="text-gray-800 font-semibold text-lg mb-4">Manual Entry</h2>

        <input
          type="text"
          value={manualEntry}
          onChange={(e) => {
            const value = e.target.value;
            setManualEntry(value);
            handleManualSearch(value); // Search as user types
          }}
          placeholder="Enter ticket reference..."
          className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 mb-4"
        />

        {/* Search Results */}
        {loading && (
          <div className="text-gray-600 text-center py-4">Searching...</div>
        )}

        {searchResults.length > 0 && (
          <div className="space-y-3">
            {searchResults.map((ticket) => {
              const getRSVPStatusColor = (status: string) => {
                switch (status) {
                  case 'ready':
                    return 'bg-green-100 text-green-800 border-green-300';
                  case 'printed':
                    return 'bg-blue-100 text-blue-800 border-blue-300';
                  default:
                    return 'bg-yellow-100 text-yellow-800 border-yellow-300';
                }
              };

              const getRSVPStatusText = (status: string) => {
                switch (status) {
                  case 'ready':
                    return 'RSVP Completed';
                  case 'printed':
                    return 'Ticket Printed';
                  default:
                    return 'RSVP Not Started';
                }
              };

              return (
                <div
                  key={ticket.id}
                  onClick={() => handleSelectTicket(ticket)}
                  className={`bg-white rounded-lg p-4 cursor-pointer border-2 transition-all ${
                    selectedTicket?.id === ticket.id
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-green-400'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-gray-900 font-semibold text-lg">{ticket.name}</h3>
                      <p className="text-gray-600 text-sm">{ticket.registration_number}</p>
                      <p className="text-gray-500 text-xs mt-1">{ticket.event_name}</p>
                      <p className="text-gray-500 text-xs">{ticket.booking_reference}</p>
                    </div>
                    <div className="ml-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold border ${getRSVPStatusColor(ticket.rsvp_status || 'not_started')}`}>
                        {getRSVPStatusText(ticket.rsvp_status || 'not_started')}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {manualEntry.length >= 2 && searchResults.length === 0 && !loading && (
          <div className="text-gray-500 text-center py-4">No tickets found</div>
        )}

        {/* Message */}
        {message && (
          <div className="mt-4 bg-green-100 border border-green-300 rounded-lg p-3 text-green-800 text-sm">
            {message}
          </div>
        )}

        {/* Add to Selection Button */}
        {selectedTicket && (
          <button
            onClick={handleAddToSelection}
            disabled={loading}
            className="w-full mt-4 bg-green-600 text-white font-semibold py-3 rounded-lg hover:bg-green-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Adding...' : 'Add to Print Selection'}
          </button>
        )}
      </div>

      {/* Info Box */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-blue-800 text-sm">
          <strong>Note:</strong> Use this page to help stranded students who couldn&apos;t complete RSVP.
          After adding them here, go to Print Tickets to complete the process.
        </p>
      </div>
    </div>
  );
}
