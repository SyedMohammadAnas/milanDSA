export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type ticket_status = 'available' | 'sold' | 'reserved'
export type event_type = 'pro_show' | 'workshop' | 'competition' | 'general'
export type rsvp_status = 'pending' | 'ready' | 'printed'

export interface Database {
  public: {
    Tables: {
      events: {
        Row: {
          id: string
          name: string
          description: string | null
          event_type: event_type
          venue: string | null
          event_date: string | null
          duration_minutes: number | null
          max_capacity: number | null
          price: number | null
          image_url: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          event_type?: event_type
          venue?: string | null
          event_date?: string | null
          duration_minutes?: number | null
          max_capacity?: number | null
          price?: number | null
          image_url?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          event_type?: event_type
          venue?: string | null
          event_date?: string | null
          duration_minutes?: number | null
          max_capacity?: number | null
          price?: number | null
          image_url?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      tickets: {
        Row: {
          id: string
          event_id: string
          ticket_number: string
          status: ticket_status
          price: number
          seat_section: string | null
          seat_row: string | null
          seat_number: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          event_id: string
          ticket_number: string
          status?: ticket_status
          price: number
          seat_section?: string | null
          seat_row?: string | null
          seat_number?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          event_id?: string
          ticket_number?: string
          status?: ticket_status
          price?: number
          seat_section?: string | null
          seat_row?: string | null
          seat_number?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          phone: string | null
          college_name: string | null
          student_id: string | null
          year_of_study: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          phone?: string | null
          college_name?: string | null
          student_id?: string | null
          year_of_study?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          phone?: string | null
          college_name?: string | null
          student_id?: string | null
          year_of_study?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      bookings: {
        Row: {
          id: string
          user_id: string
          ticket_id: string
          booking_reference: string
          total_amount: number
          payment_status: string
          payment_method: string | null
          payment_id: string | null
          booking_date: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          ticket_id: string
          booking_reference: string
          total_amount: number
          payment_status?: string
          payment_method?: string | null
          payment_id?: string | null
          booking_date?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          ticket_id?: string
          booking_reference?: string
          total_amount?: number
          payment_status?: string
          payment_method?: string | null
          payment_id?: string | null
          booking_date?: string
          created_at?: string
          updated_at?: string
        }
      }
      student_database: {
        Row: {
          id: string
          email: string
          password: string
          full_name: string | null
          registration_number: string | null
          program: string | null
          department: string | null
          specialization: string | null
          semester: string | null
          batch: string | null
          phone_number: string | null
          personal_email: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          password: string
          full_name?: string | null
          registration_number?: string | null
          program?: string | null
          department?: string | null
          specialization?: string | null
          semester?: string | null
          batch?: string | null
          phone_number?: string | null
          personal_email?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          password?: string
          full_name?: string | null
          registration_number?: string | null
          program?: string | null
          department?: string | null
          specialization?: string | null
          semester?: string | null
          batch?: string | null
          phone_number?: string | null
          personal_email?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      ticket_confirmations: {
        Row: {
          id: string
          name: string
          registration_number: string
          email: string
          batch: string | null
          event_name: string
          event_date: string | null
          ticket_price: number
          razorpay_order_id: string
          razorpay_payment_id: string | null
          razorpay_signature: string | null
          payment_status: 'pending' | 'completed' | 'failed'
          booking_reference: string
          qr_code_data: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          registration_number: string
          email: string
          batch?: string | null
          event_name: string
          event_date?: string | null
          ticket_price: number
          razorpay_order_id: string
          razorpay_payment_id?: string | null
          razorpay_signature?: string | null
          payment_status?: 'pending' | 'completed' | 'failed'
          booking_reference: string
          qr_code_data?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          registration_number?: string
          email?: string
          batch?: string | null
          event_name?: string
          event_date?: string | null
          ticket_price?: number
          razorpay_order_id?: string
          razorpay_payment_id?: string | null
          razorpay_signature?: string | null
          payment_status?: 'pending' | 'completed' | 'failed'
          booking_reference?: string
          qr_code_data?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      operator_data: {
        Row: {
          id: string
          username: string
          password: string
          station_number: number
          printed_tickets: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          username: string
          password: string
          station_number: number
          printed_tickets?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string
          password?: string
          station_number?: number
          printed_tickets?: number
          created_at?: string
          updated_at?: string
        }
      }
      rsvp_confirmations: {
        Row: {
          id: string
          full_name: string
          registration_number: string
          email: string
          ticket_reference: string
          event_name: string
          rsvp_status: rsvp_status
          printed_by: string | null
          printed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          full_name: string
          registration_number: string
          email: string
          ticket_reference: string
          event_name: string
          rsvp_status?: rsvp_status
          printed_by?: string | null
          printed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string
          registration_number?: string
          email?: string
          ticket_reference?: string
          event_name?: string
          rsvp_status?: rsvp_status
          printed_by?: string | null
          printed_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      explore_posts_manager: {
        Row: {
          id: string
          image_url: string
          posted_by: string
          hashtags: Json
          created_at: string
        }
        Insert: {
          id?: string
          image_url: string
          posted_by: string
          hashtags?: Json
          created_at?: string
        }
        Update: {
          id?: string
          image_url?: string
          posted_by?: string
          hashtags?: Json
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_trending_hashtags: {
        Args: {
          limit_count?: number
        }
        Returns: {
          hashtag: string
          count: number
        }[]
      }
    }
    Enums: {
      ticket_status: ticket_status
      event_type: event_type
      rsvp_status: rsvp_status
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
