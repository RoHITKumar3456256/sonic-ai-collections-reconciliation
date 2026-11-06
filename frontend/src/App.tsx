import React, { useState, useEffect } from 'react';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { Dashboard } from './pages/Dashboard';
import { Invoices } from './pages/Invoices';
import { Collections } from './pages/Collections';
import { Reviews } from './pages/Reviews';
import { Conversations } from './pages/Conversations';
import { Reconciliation } from './pages/Reconciliation';
import { Payments } from './pages/Payments';
import { Customers } from './pages/Customers';
import { OrganizationPage } from './pages/Organization';
import { Settings } from './pages/Settings';
import { api } from './services/api';
import {
  HealthStatus,
  Organization,
  Customer,
  Invoice,
  ReviewItem,
  ReconciliationSuggestion,
  Payment,
  Conversation
} from './types';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [resetting, setResetting] = useState(false);

  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [overdueInvoices, setOverdueInvoices] = useState<Invoice[]>([]);
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [suggestions, setSuggestions] = useState<ReconciliationSuggestion[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);

  const loadAllData = async () => {
    try {
      const [
        hData,
        orgData,
        custList,
        invList,
        overdueList,
        revList,
        sugList,
        payList,
        convList
      ] = await Promise.all([
        api.getHealth().catch(() => null),
        api.getOrganization().catch(() => null),
        api.getCustomers().catch(() => []),
        api.getInvoices().catch(() => []),
        api.getOverdueInvoices().catch(() => []),
        api.getReviews().catch(() => []),
        api.getReconciliationSuggestions().catch(() => []),
        api.getPayments().catch(() => []),
        api.getConversations().catch(() => [])
      ]);

      if (hData) setHealth(hData);
      if (orgData) setOrganization(orgData);
      setCustomers(custList);
      setInvoices(invList);
      setOverdueInvoices(overdueList);
      setReviews(revList);
      setSuggestions(sugList);
      setPayments(payList);
      setConversations(convList);
    } catch (err) {
      console.error("Data load error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const handleResetDemo = async () => {
    try {
      setResetting(true);
      await api.resetDemoDatabase();
      await loadAllData();
    } catch (err: any) {
      alert(`Demo reset failed: ${err.message}`);
    } finally {
      setResetting(false);
    }
  };

  const handleQuickSendReminder = async (invoiceId: string) => {
    try {
      await api.sendReminder({ invoice_id: invoiceId });
      await loadAllData();
      alert(`Reminder dispatched successfully for invoice ${invoiceId}`);
    } catch (err: any) {
      alert(`Reminder failed: ${err.message}`);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#f8fafc] text-slate-800">
      {/* Dark sleek sidebar matching Image 2 */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        reviewCount={reviews.length}
      />

      {/* Main Content Area with Light Canvas matching Images 1, 2, 3, 4, 5 */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Navbar
          health={health}
          onResetDemo={handleResetDemo}
          resetting={resetting}
        />

        <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-[#f8fafc]">
          {loading ? (
            <div className="flex items-center justify-center h-64 space-x-3 text-slate-400">
              <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-sm font-medium">Connecting to Sonic AI backend...</span>
            </div>
          ) : (
            <>
              {activeTab === 'dashboard' && (
                <Dashboard
                  invoices={invoices}
                  overdueInvoices={overdueInvoices}
                  reviews={reviews}
                  suggestions={suggestions}
                  payments={payments}
                  onNavigate={setActiveTab}
                  onSendReminder={handleQuickSendReminder}
                />
              )}

              {activeTab === 'invoices' && (
                <Invoices
                  invoices={invoices}
                  onSendReminder={handleQuickSendReminder}
                />
              )}

              {activeTab === 'collections' && (
                <Collections
                  overdueInvoices={overdueInvoices}
                  onRefresh={loadAllData}
                />
              )}

              {activeTab === 'reviews' && (
                <Reviews
                  reviews={reviews}
                  onRefresh={loadAllData}
                />
              )}

              {activeTab === 'conversations' && (
                <Conversations
                  conversations={conversations}
                  customers={customers}
                  onRefresh={loadAllData}
                />
              )}

              {activeTab === 'reconciliation' && (
                <Reconciliation
                  suggestions={suggestions}
                  invoices={invoices}
                  onRefresh={loadAllData}
                />
              )}

              {activeTab === 'payments' && (
                <Payments payments={payments} />
              )}

              {activeTab === 'customers' && (
                <Customers
                  customers={customers}
                  onRefresh={loadAllData}
                />
              )}

              {activeTab === 'organization' && (
                <OrganizationPage
                  organization={organization}
                  onRefresh={loadAllData}
                />
              )}

              {activeTab === 'settings' && (
                <Settings
                  health={health}
                  onResetDemo={handleResetDemo}
                  resetting={resetting}
                />
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default App;
