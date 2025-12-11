import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { studentId, field, value } = await request.json()

    console.log('🔄 [API] Received update request:', { studentId, field, value: value ? '***' : null })

    if (!studentId || !field) {
      console.error('❌ [API] Missing required fields')
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Validate field name for security
    const allowedFields = ['phone_number', 'personal_email']
    if (!allowedFields.includes(field)) {
      console.error('❌ [API] Invalid field name:', field)
      return NextResponse.json({ error: 'Invalid field name' }, { status: 400 })
    }

    // Validate studentId format (should be UUID)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(studentId)) {
      console.error('❌ [API] Invalid student ID format')
      return NextResponse.json({ error: 'Invalid student ID' }, { status: 400 })
    }

    console.log('📝 [API] Updating student field:', field, 'for ID:', studentId)

    // Update the field using admin client
    const { data, error } = await getSupabaseAdmin()
      .from('student_database')
      .update({
        [field]: value.trim() === '' ? null : value.trim(),
        updated_at: new Date().toISOString()
      })
      .eq('id', studentId)
      .select()

    if (error) {
      console.error('❌ [API] Database error:', error)
      return NextResponse.json({ error: 'Failed to update database' }, { status: 500 })
    }

    if (!data || data.length === 0) {
      console.error('❌ [API] No data returned from update')
      return NextResponse.json({ error: 'No data updated' }, { status: 404 })
    }

    console.log('✅ [API] Update successful for field:', field)
    return NextResponse.json({ success: true, data: data[0] })

  } catch (error) {
    console.error('❌ [API] Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
