import {
  Organization,
  Customer,
  Invoice,
  Conversation,
  Message,
  ReviewItem,
  ReconciliationSuggestion,
  Payment,
  HealthStatus,
  AuditLog
} from '../types';

const API_BASE = '/api';

export const api = {
  // Health
  getHealth: async (): Promise<HealthStatus> => {
    const res = await fetch(`${API_BASE}/health`);
    if (!res.ok) throw new Error('Failed to fetch health status');
    return res.json();
  },

  // Organization
  getOrganization: async (): Promise<Organization> => {
    const res = await fetch(`${API_BASE}/organization`);
    if (!res.ok) throw new Error('Failed to fetch organization details');
    return res.json();
  },
  updateOrganization: async (data: Partial<Organization>): Promise<Organization> => {
    const res = await fetch(`${API_BASE}/organization`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to update organization details');
    return res.json();
  },

  // Customers
  getCustomers: async (search?: string): Promise<Customer[]> => {
    const url = search ? `${API_BASE}/customers?search=${encodeURIComponent(search)}` : `${API_BASE}/customers`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch customers');
    return res.json();
  },
  updateCustomer: async (id: string, data: Partial<Customer>): Promise<Customer> => {
    const res = await fetch(`${API_BASE}/customers/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to update customer');
    return res.json();
  },

  // Invoices
  getInvoices: async (customerId?: string, status?: string): Promise<Invoice[]> => {
    const params = new URLSearchParams();
    if (customerId) params.append('customer_id', customerId);
    if (status && status !== 'all') params.append('status', status);
    const res = await fetch(`${API_BASE}/invoices?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch invoices');
    return res.json();
  },
  getOverdueInvoices: async (): Promise<Invoice[]> => {
    const res = await fetch(`${API_BASE}/invoices/overdue`);
    if (!res.ok) throw new Error('Failed to fetch overdue invoices');
    return res.json();
  },

  // Collections & Reminders
  sendReminder: async (payload: {
    invoice_id: string;
    custom_message?: string;
    override_recipient?: string;
  }) => {
    const res = await fetch(`${API_BASE}/collections/remind`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Failed to dispatch payment reminder');
    return data;
  },

  // Inbound Email & IMAP
  checkInbox: async (simulateReply?: { sender: string; subject: string; body: string }) => {
    const res = await fetch(`${API_BASE}/email/check-inbox`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(simulateReply ? { simulate_reply: simulateReply } : {})
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Failed to check inbox');
    return data;
  },

  // Conversations & Messages
  getConversations: async (customerId?: string): Promise<Conversation[]> => {
    const url = customerId ? `${API_BASE}/conversations?customer_id=${customerId}` : `${API_BASE}/conversations`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch conversations');
    return res.json();
  },
  getConversationMessages: async (conversationId: string): Promise<{ conversation: Conversation; messages: Message[] }> => {
    const res = await fetch(`${API_BASE}/conversations/${conversationId}/messages`);
    if (!res.ok) throw new Error('Failed to fetch conversation history');
    return res.json();
  },

  // Needs Attention Reviews
  getReviews: async (status: string = 'pending'): Promise<ReviewItem[]> => {
    const res = await fetch(`${API_BASE}/reviews?status=${status}`);
    if (!res.ok) throw new Error('Failed to fetch review queue');
    return res.json();
  },
  sendReviewDraft: async (reviewId: string, editedReply: string, recipient?: string) => {
    const res = await fetch(`${API_BASE}/reviews/${reviewId}/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ edited_reply: editedReply, recipient, close_review: true })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Failed to send review draft');
    return data;
  },

  // Reconciliation
  uploadBankCsv: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_BASE}/reconciliation/upload`, {
      method: 'POST',
      body: formData
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Failed to upload CSV bank statement');
    return data;
  },
  getReconciliationSuggestions: async (status?: string): Promise<ReconciliationSuggestion[]> => {
    const url = status ? `${API_BASE}/reconciliation?status=${status}` : `${API_BASE}/reconciliation`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch reconciliation suggestions');
    return res.json();
  },
  approveSuggestion: async (suggestionId: string, actionType: string, tdsAmount?: number, notes?: string) => {
    const res = await fetch(`${API_BASE}/reconciliation/${suggestionId}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action_type: actionType, tds_amount: tdsAmount, notes })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Failed to approve reconciliation suggestion');
    return data;
  },
  rejectSuggestion: async (suggestionId: string, reason?: string) => {
    const res = await fetch(`${API_BASE}/reconciliation/${suggestionId}/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: reason || 'Rejected by operator' })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Failed to reject reconciliation suggestion');
    return data;
  },
  manualSelectSuggestion: async (suggestionId: string, invoiceId: string, actionType: string, tdsAmount?: number) => {
    const res = await fetch(`${API_BASE}/reconciliation/${suggestionId}/select`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ invoice_id: invoiceId, action_type: actionType, tds_amount: tdsAmount })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Failed to link manual invoice');
    return data;
  },

  // Payments & Audit
  getPayments: async (): Promise<Payment[]> => {
    const res = await fetch(`${API_BASE}/payments`);
    if (!res.ok) throw new Error('Failed to fetch payment history');
    return res.json();
  },
  getAuditLogs: async (limit: number = 50): Promise<AuditLog[]> => {
    const res = await fetch(`${API_BASE}/audit-logs?limit=${limit}`);
    if (!res.ok) throw new Error('Failed to fetch audit logs');
    return res.json();
  },

  // Demo Reset
  resetDemoDatabase: async () => {
    const res = await fetch(`${API_BASE}/demo/reset`, {
      method: 'POST'
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Failed to reset demo database');
    return data;
  }
};

