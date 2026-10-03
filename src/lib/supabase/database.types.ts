// Tipe DB — bentuk mengikuti output `supabase gen types typescript`.
// Diperluas manual agar cocok dengan skema di `supabase/migrations/`:
// `20260926000000_init.sql`, `20260927000000_owner_trigger.sql`,
// `20260928000000_itinerary_category.sql`, `20261003074910_realtime_trip_members.sql`,
// `20261003081856_harden_security_definer.sql`.
// Regenerasi saat skema berubah; JANGAN ubah nama kolom sembarangan.
// Catatan: helper RLS `is_trip_member`/`is_trip_owner`/`has_other_owner` kini
// di schema `private` (tidak diekspos PostgREST) — sengaja TIDAK ada di sini.

export type TripRole = "owner" | "member";

export type ExpenseCategory =
  | "makan"
  | "transport"
  | "penginapan"
  | "tiket"
  | "belanja"
  | "lain-lain";

export type ExpenseKind = "expense" | "settlement";

export type ItineraryCategory =
  | "makan"
  | "transport"
  | "penginapan"
  | "tiket"
  | "aktivitas"
  | "lain-lain";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          name: string;
          created_at: string;
        };
        Insert: {
          id: string;
          name?: string;
          created_at?: string;
        };
        Update: {
          name?: string;
        };
        Relationships: [];
      };
      trips: {
        Row: {
          id: string;
          title: string;
          destination: string | null;
          start_date: string;
          end_date: string;
          invite_code: string;
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          destination?: string | null;
          start_date: string;
          end_date: string;
          invite_code?: string;
          created_by: string;
          created_at?: string;
        };
        Update: {
          title?: string;
          destination?: string | null;
          start_date?: string;
          end_date?: string;
        };
        Relationships: [];
      };
      trip_members: {
        Row: {
          trip_id: string;
          user_id: string;
          role: TripRole;
          joined_at: string;
        };
        Insert: {
          trip_id: string;
          user_id: string;
          role?: TripRole;
          joined_at?: string;
        };
        Update: never;
        Relationships: [];
      };
      itinerary_items: {
        Row: {
          id: string;
          trip_id: string;
          date: string;
          time: string | null;
          title: string;
          notes: string | null;
          location: string | null;
          sort_order: number;
          category: ItineraryCategory;
          created_at: string;
        };
        Insert: {
          id?: string;
          trip_id: string;
          date: string;
          time?: string | null;
          title: string;
          notes?: string | null;
          location?: string | null;
          sort_order?: number;
          category?: ItineraryCategory;
          created_at?: string;
        };
        Update: {
          date?: string;
          time?: string | null;
          title?: string;
          notes?: string | null;
          location?: string | null;
          sort_order?: number;
          category?: ItineraryCategory;
        };
        Relationships: [];
      };
      expenses: {
        Row: {
          id: string;
          trip_id: string;
          title: string;
          amount: number;
          paid_by: string;
          date: string;
          category: ExpenseCategory;
          kind: ExpenseKind;
          created_at: string;
        };
        Insert: {
          id?: string;
          trip_id: string;
          title: string;
          amount: number;
          paid_by: string;
          date?: string;
          category?: ExpenseCategory;
          kind?: ExpenseKind;
          created_at?: string;
        };
        Update: {
          title?: string;
          amount?: number;
          paid_by?: string;
          date?: string;
          category?: ExpenseCategory;
          kind?: ExpenseKind;
        };
        Relationships: [];
      };
      expense_splits: {
        Row: {
          expense_id: string;
          user_id: string;
          share_amount: number;
        };
        Insert: {
          expense_id: string;
          user_id: string;
          share_amount: number;
        };
        Update: {
          share_amount?: number;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      get_trip_by_invite: {
        Args: { p_code: string };
        Returns: {
          id: string;
          title: string;
          destination: string | null;
          start_date: string;
          end_date: string;
        }[];
      };
    };
    Enums: {
      trip_role: TripRole;
      expense_category: ExpenseCategory;
      expense_kind: ExpenseKind;
      itinerary_category: ItineraryCategory;
    };
    CompositeTypes: Record<string, never>;
  };
}

export type Trip = Database["public"]["Tables"]["trips"]["Row"];
export type TripMember = Database["public"]["Tables"]["trip_members"]["Row"];
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type ItineraryItemRow = Database["public"]["Tables"]["itinerary_items"]["Row"];
export type ExpenseRow = Database["public"]["Tables"]["expenses"]["Row"];
export type ExpenseSplitRow = Database["public"]["Tables"]["expense_splits"]["Row"];
