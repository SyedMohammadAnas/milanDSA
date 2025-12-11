import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { Database } from '@/lib/database.types';

export async function POST(request: NextRequest) {
  try {
    console.log('[OPERATOR LOGIN] Starting operator login process');

    const body = await request.json();
    const { username, password } = body;

    console.log('[OPERATOR LOGIN] Login attempt for username:', username);

    if (!username || !password) {
      console.log('[OPERATOR LOGIN] Missing credentials');
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    // Query operator_data table
    console.log('[OPERATOR LOGIN] Querying operator_data table');
    const { data: operator, error } = await supabase
      .from('operator_data')
      .select('*')
      .eq('username', username)
      .eq('password', password)
      .single<Database['public']['Tables']['operator_data']['Row']>();

    if (error || !operator) {
      console.log('[OPERATOR LOGIN] Invalid credentials. Error:', error?.message);
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      );
    }

    console.log('[OPERATOR LOGIN] Login successful for operator:', operator.username);
    console.log('[OPERATOR LOGIN] Operator details:', {
      id: operator.id,
      username: operator.username,
      station_number: operator.station_number,
      printed_tickets: operator.printed_tickets
    });

    // Return operator data (excluding password)
    const { password, ...operatorData } = operator;

    return NextResponse.json({
      success: true,
      operator: operatorData
    });

  } catch (error) {
    console.error('[OPERATOR LOGIN] Error during login:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
