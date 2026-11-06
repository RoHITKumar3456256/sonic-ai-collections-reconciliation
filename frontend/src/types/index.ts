export interface BillingAddress {
  line1: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
}

export interface BankDetails {
  bank_name: string;
  account_name: string;
  account_number: string;
  ifsc_code: string;
  swift_code: string;
  upi_id?: string;
}

export interface Policies {
  tds_deduction_rate_indian: number;
  tds_note: string;
  international_bank_charges: string;
  payment_terms_days: number;
  working_hours: string;
  dispute_review_window_days: number;
  approval_required_for_extensions: boolean;
  approval_required_for_installments: boolean;
  accounts_team_contact: string;
}

export interface Organization {
  id: string;
  name: string;
  registration_number?: string;
  tax_id?: string;
  accounts_email: string;
  billing_address: BillingAddress;
  bank_details: BankDetails;
  policies: Policies;
  updated_at?: string;
}

export interface Customer {
  id: string;
  name: string;
  country: string;
  contact_name?: string;
  contact_email: string;
  phone?: string;
  currency: string;
  tax_id?: string;
  payment_terms: string;
  updated_at?: string;
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  customer_id: string;
  customer_name: string;
  issue_date: string;
  due_date: string;
  currency: string;
  subtotal: number;
  tax: number;
  total: number;
  paid_amount: number;
  balance_due: number;
  status: 'draft' | 'sent' | 'paid' | 'void';
  description?: string;
  items?: InvoiceItem[];
  notes?: string;
  is_overdue: boolean;
  days_overdue: number;
  updated_at?: string;
}

export interface Conversation {
  id: string;
  customer_id?: string;
  customer_name?: string;
  last_message_at: string;
  status: string;
  last_category?: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  direction: 'inbound' | 'outbound';
  sender: string;
  recipient: string;
  subject: string;
  body: string;
  message_id: string;
  created_at: string;
  is_human_reviewed?: boolean;
}

export interface ReviewItem {
  id: string;
  conversation_id: string;
  customer_id?: string;
  customer_name?: string;
  sender_email: string;
  subject: string;
  category: string;
  urgency: 'normal' | 'high' | 'critical';
  reason_for_review: string;
  ai_draft_reply: string;
  status: 'pending' | 'sent' | 'dismissed';
  created_at: string;
}

export interface MatchScoreDetails {
  invoice_number_score: number;
  payer_name_score: number;
  amount_score: number;
  date_proximity_score: number;
  currency_score: number;
  total_confidence: number;
  match_type: string;
  suggested_action: string;
  tds_amount?: number;
  match_notes: string;
}

export interface ReconciliationSuggestion {
  id: string;
  bank_transaction_id: string;
  transaction_date: string;
  transaction_description: string;
  transaction_reference: string;
  transaction_amount: number;
  transaction_currency: string;
  candidate_invoice_id?: string;
  candidate_invoice_number?: string;
  candidate_customer_name?: string;
  candidate_invoice_total?: number;
  candidate_balance_due?: number;
  confidence_score: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'manually_selected';
  breakdown?: MatchScoreDetails;
  suggested_action: 'close_invoice_tds' | 'leave_balance_open' | 'full_settlement' | 'no_match';
}

export interface Payment {
  id: string;
  transaction_reference: string;
  invoice_id: string;
  invoice_number: string;
  customer_name: string;
  amount: number;
  currency: string;
  tds_deducted: number;
  action_type: string;
  previous_balance: number;
  new_balance: number;
  invoice_status: string;
  payment_date: string;
  approved_by: string;
  notes?: string;
  created_at: string;
}

export interface HealthStatus {
  status: string;
  app: string;
  version: string;
  environment: string;
  database_mode: string;
  gemini_configured: boolean;
  smtp_configured: boolean;
  imap_configured: boolean;
}

export interface AuditLog {
  action: string;
  entity_type: string;
  entity_id: string;
  actor: string;
  details: any;
  created_at: string;
}

