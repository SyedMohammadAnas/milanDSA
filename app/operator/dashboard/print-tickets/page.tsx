'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Operator {
  id: string;
  username: string;
  station_number: number;
  printed_tickets: number;
}

interface RSVPConfirmation {
  id: string;
  full_name: string;
  registration_number: string;
  email: string;
  ticket_reference: string;
  event_name: string;
  rsvp_status: string;
  created_at: string;
}

export default function PrintTicketsPage() {
  const router = useRouter();
  const [operator, setOperator] = useState<Operator | null>(null);
  const [rsvps, setRsvps] = useState<RSVPConfirmation[]>([]);
  const [selectedTickets, setSelectedTickets] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [printing, setPrinting] = useState(false);

  useEffect(() => {
    // Check if operator is logged in
    const operatorData = localStorage.getItem('operator');
    if (!operatorData) {
      console.log('[PRINT TICKETS] No operator session, redirecting to login');
      router.push('/operator/login');
      return;
    }

    const parsedOperator = JSON.parse(operatorData);
    setOperator(parsedOperator);

    // Load persistent selection from localStorage
    const savedSelection = localStorage.getItem('selectedTickets');
    if (savedSelection) {
      console.log('[PRINT TICKETS] Loading saved selection');
      setSelectedTickets(new Set(JSON.parse(savedSelection)));
    }

    // Fetch RSVP confirmations
    fetchRSVPs();
  }, [router]);

  useEffect(() => {
    // Save selection to localStorage whenever it changes
    localStorage.setItem('selectedTickets', JSON.stringify(Array.from(selectedTickets)));
  }, [selectedTickets]);

  const fetchRSVPs = async (search = '') => {
    setLoading(true);
    console.log('[PRINT TICKETS] Fetching RSVPs with search:', search);

    try {
      const url = search
        ? `/api/operator/rsvp-list?search=${encodeURIComponent(search)}`
        : '/api/operator/rsvp-list';

      const response = await fetch(url);
      const data = await response.json();

      if (response.ok) {
        console.log('[PRINT TICKETS] Fetched', data.rsvps.length, 'RSVPs');
        setRsvps(data.rsvps);
      } else {
        console.error('[PRINT TICKETS] Error fetching RSVPs:', data.error);
      }
    } catch (error) {
      console.error('[PRINT TICKETS] Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchRSVPs(searchQuery);
  };

  const handleRefresh = () => {
    console.log('[PRINT TICKETS] Refreshing list');
    setSearchQuery('');
    fetchRSVPs();
  };

  const toggleSelection = (ticketRef: string) => {
    setSelectedTickets(prev => {
      const newSet = new Set(prev);
      if (newSet.has(ticketRef)) {
        console.log('[PRINT TICKETS] Deselecting ticket:', ticketRef);
        newSet.delete(ticketRef);
      } else if (newSet.size < 10) {
        console.log('[PRINT TICKETS] Selecting ticket:', ticketRef);
        newSet.add(ticketRef);
      } else {
        console.log('[PRINT TICKETS] Maximum 10 tickets can be selected');
        alert('Maximum 10 tickets can be selected at once');
      }
      return newSet;
    });
  };

  const deselectAll = () => {
    console.log('[PRINT TICKETS] Deselecting all tickets');
    setSelectedTickets(new Set());
  };

  const handlePrint = async () => {
    if (selectedTickets.size === 0 || !operator) return;

    setPrinting(true);
    console.log('[PRINT TICKETS] Starting print process for', selectedTickets.size, 'tickets');

    try {
      const response = await fetch('/api/operator/print', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          operatorId: operator.id,
          ticketReferences: Array.from(selectedTickets)
        }),
      });

      const data = await response.json();

      if (response.ok) {
        console.log('[PRINT TICKETS] Print successful:', data);
        alert(`Printed! ${data.printedCount} tickets printed successfully.`);

        // Update operator data in localStorage
        const updatedOperator = { ...operator, printed_tickets: data.totalPrinted };
        localStorage.setItem('operator', JSON.stringify(updatedOperator));
        setOperator(updatedOperator);

        // Clear selection
        deselectAll();

        // Refresh list
        fetchRSVPs(searchQuery);
      } else {
        console.error('[PRINT TICKETS] Print error:', data.error);
        alert('Error printing tickets: ' + data.error);
      }
    } catch (error) {
      console.error('[PRINT TICKETS] Error:', error);
      alert('An error occurred while printing');
    } finally {
      setPrinting(false);
    }
  };

  // Sort RSVPs: selected items first
  const sortedRsvps = [...rsvps].sort((a, b) => {
    const aSelected = selectedTickets.has(a.ticket_reference);
    const bSelected = selectedTickets.has(b.ticket_reference);
    if (aSelected && !bSelected) return -1;
    if (!aSelected && bSelected) return 1;
    return 0;
  });

  if (!operator) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-black flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-4">
      {/* Header */}
      <div className="mb-4">
        <button
          onClick={() => router.back()}
          className="text-gray-600 hover:text-gray-800 flex items-center space-x-2 mb-4"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span>Back</span>
        </button>
        <h1 className="text-3xl font-bold text-gray-800">Print Tickets</h1>
      </div>

      {/* Search Bar */}
      <div className="mb-4">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => {
            const value = e.target.value;
            setSearchQuery(value);
            fetchRSVPs(value); // Search as user types
          }}
          placeholder="Search by name, reg number, or ticket ref..."
          className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>

      {/* Selection Controls */}
      <div className="bg-gray-50 rounded-lg p-4 mb-4 flex items-center justify-between border border-gray-200">
        <span className="text-gray-800 font-semibold">
          {selectedTickets.size}/10 selected
        </span>
        <div className="flex space-x-2">
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Refresh
          </button>
          <button
            onClick={deselectAll}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            Deselect All
          </button>
        </div>
      </div>

      {/* RSVP List */}
      <div className="space-y-3 mb-20">
        {loading ? (
          <div className="text-gray-800 text-center py-8">Loading...</div>
        ) : sortedRsvps.length === 0 ? (
          <div className="text-gray-800 text-center py-8">No RSVP confirmations found</div>
        ) : (
          sortedRsvps.map((rsvp) => {
            const isSelected = selectedTickets.has(rsvp.ticket_reference);
            return (
              <div
                key={rsvp.id}
                onClick={() => toggleSelection(rsvp.ticket_reference)}
                className={`bg-gray-50 rounded-lg p-4 border-2 cursor-pointer transition-all ${
                  isSelected
                    ? 'border-green-500 bg-green-100'
                    : 'border-gray-200 hover:border-green-400'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-gray-900 font-semibold text-lg">{rsvp.full_name}</h3>
                    <p className="text-gray-600 text-sm">{rsvp.registration_number}</p>
                    <p className="text-gray-500 text-xs mt-1">{rsvp.event_name}</p>
                    <p className="text-gray-500 text-xs">{rsvp.ticket_reference}</p>
                  </div>
                  <div className="ml-4">
                    {isSelected && (
                      <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Print Button - Fixed at bottom */}
      {selectedTickets.size > 0 && (
        <div className="fixed bottom-4 left-4 right-4 max-w-md mx-auto">
          <button
            onClick={handlePrint}
            disabled={printing}
            className="w-full bg-green-600 text-white font-bold py-4 rounded-xl hover:bg-green-700 transition-all duration-200 shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {printing ? 'Printing...' : `PRINT (${selectedTickets.size})`}
          </button>
        </div>
      )}
    </div>
  );
}
