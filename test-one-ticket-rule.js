// Test script to verify the one ticket per student rule
// This simulates API calls to test the constraint

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

async function testOneTicketRule() {
  console.log('🧪 Testing One Ticket Per Student Rule')
  console.log('=====================================')

  const testEmail = 'test-student@example.com'
  const testEventName = 'Test Event'
  const testEventDate = '2026-02-15'
  const testTicketPrice = 100

  try {
    // First, clean up any existing test data
    console.log('🧹 Cleaning up existing test data...')
    await supabase
      .from('ticket_confirmations')
      .delete()
      .eq('email', testEmail)

    console.log('✅ Clean up completed')

    // Test 1: Create first order (should succeed)
    console.log('\n📝 Test 1: Creating first order...')
    const { data: firstOrder, error: firstOrderError } = await supabase
      .from('ticket_confirmations')
      .insert({
        name: 'Test Student',
        registration_number: 'TEST123',
        email: testEmail,
        event_name: testEventName,
        event_date: testEventDate,
        ticket_price: testTicketPrice,
        razorpay_order_id: 'order_test_1',
        payment_status: 'pending',
        booking_reference: 'TEST-BOOKING-1',
      })
      .select()
      .single()

    if (firstOrderError) {
      console.error('❌ Failed to create first order:', firstOrderError.message)
      return
    }

    console.log('✅ First order created:', firstOrder.booking_reference)

    // Test 2: Mark first order as completed
    console.log('\n✅ Test 2: Marking first order as completed...')
    const { error: updateError } = await supabase
      .from('ticket_confirmations')
      .update({
        payment_status: 'completed',
        razorpay_payment_id: 'pay_test_1',
        razorpay_signature: 'signature_test_1',
      })
      .eq('id', firstOrder.id)

    if (updateError) {
      console.error('❌ Failed to complete first order:', updateError.message)
      return
    }

    console.log('✅ First order marked as completed')

    // Test 3: Try to create second order (should fail due to database constraint)
    console.log('\n🚫 Test 3: Attempting to create second completed order...')
    const { data: secondOrder, error: secondOrderError } = await supabase
      .from('ticket_confirmations')
      .insert({
        name: 'Test Student',
        registration_number: 'TEST123',
        email: testEmail,
        event_name: 'Another Event',
        event_date: testEventDate,
        ticket_price: testTicketPrice,
        razorpay_order_id: 'order_test_2',
        payment_status: 'completed', // This should fail
        booking_reference: 'TEST-BOOKING-2',
        razorpay_payment_id: 'pay_test_2',
        razorpay_signature: 'signature_test_2',
      })
      .select()
      .single()

    if (secondOrderError) {
      console.log('✅ Database constraint working - second completed order blocked:', secondOrderError.message)
    } else {
      console.error('❌ Database constraint FAILED - second completed order was created:', secondOrder)
      return
    }

    // Test 4: Check that we can still create pending orders
    console.log('\n📝 Test 4: Creating pending order (should succeed)...')
    const { data: pendingOrder, error: pendingOrderError } = await supabase
      .from('ticket_confirmations')
      .insert({
        name: 'Test Student',
        registration_number: 'TEST123',
        email: testEmail,
        event_name: 'Another Event',
        event_date: testEventDate,
        ticket_price: testTicketPrice,
        razorpay_order_id: 'order_test_pending',
        payment_status: 'pending', // This should succeed
        booking_reference: 'TEST-BOOKING-PENDING',
      })
      .select()
      .single()

    if (pendingOrderError) {
      console.error('❌ Failed to create pending order:', pendingOrderError.message)
      return
    }

    console.log('✅ Pending order created successfully:', pendingOrder.booking_reference)

    // Test 5: Verify API-level check (simulate the API logic)
    console.log('\n🔍 Test 5: Simulating API check for existing completed ticket...')

    const { data: existingCompletedTicket, error: checkError } = await supabase
      .from('ticket_confirmations')
      .select('id, booking_reference, event_name, created_at')
      .eq('email', testEmail)
      .eq('payment_status', 'completed')
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('❌ API check failed:', checkError.message)
      return
    }

    if (existingCompletedTicket) {
      console.log('✅ API check working - found existing completed ticket:', existingCompletedTicket.booking_reference)
      console.log('🚫 Would block new order creation as expected')
    } else {
      console.error('❌ API check FAILED - no existing ticket found')
      return
    }

    console.log('\n🎉 All tests passed! One ticket per student rule is working correctly.')
    console.log('📋 Summary:')
    console.log('   ✅ Database constraint prevents multiple completed tickets')
    console.log('   ✅ API check blocks new orders for students with completed tickets')
    console.log('   ✅ Pending orders are still allowed')

  } catch (error) {
    console.error('❌ Test failed with error:', error.message)
  } finally {
    // Clean up test data
    console.log('\n🧹 Cleaning up test data...')
    await supabase
      .from('ticket_confirmations')
      .delete()
      .eq('email', testEmail)

    console.log('✅ Test cleanup completed')
  }
}

// Run the test
testOneTicketRule().then(() => {
  console.log('\n🏁 Test completed')
  process.exit(0)
}).catch((error) => {
  console.error('❌ Test failed:', error)
  process.exit(1)
})
