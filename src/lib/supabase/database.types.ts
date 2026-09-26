// Tipe DB hasil `supabase gen types typescript`.
// Regenerasi saat skema berubah; JANGAN edit manual.
// Stub ini cukup untuk typecheck tanpa koneksi Supabase.

export type TripRole = "owner" | "member";

export type ExpenseCategory =
  | "makan"
  | "transport"
  | "penginapan"
  | "tiket"
  | "belanja"
  | "lain-lain";

export type ExpenseKind = "expense" | "settlement";

export interface Profile {
  id: string;
  name: string;
  created_at: string;
}

export interface Trip {
  id: string;
  title: string;
  destination: string | null;
  start_date: string;
  end_date: string;
  invite_code: string;
  created_by: string;
  created_at: string;
}

export interface TripMember {
  trip_id: string;
  user_id: string;
  role: TripRole;
  joined_at: string;
}

export interface ItineraryItem {
  id: string;
  trip_id: string;
  date: string;
  time: string | null;
  title: string;
  notes: string | null;
  location: string | null;
  sort_order: number;
  created_at: string;
}

export interface Expense {
  id: string;
  trip_id: string;
  title: string;
  amount: number;
  paid_by: string;
  date: string;
  category: ExpenseCategory;
  kind: ExpenseKind;
  created_at: string;
}

export interface ExpenseSplit {
  expense_id: string;
  user_id: string;
  share_amount: number;
}

export interface Database {
  public: {
    Tables: {
      profiles: { Row: Profile };
      trips: { Row: Trip };
      trip_members: { Row: TripMember };
      itinerary_items: { Row: ItineraryItem };
      expenses: { Row: Expense };
      expense_splits: { Row: ExpenseSplit };
    };
  };
}
