'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Customer, CustomerFormData } from '@/lib/types';
import { geocodeAddress } from '@/lib/geocoding';
import CustomerList from '@/components/CustomerList';
import AddCustomerModal from '@/components/AddCustomerModal';
import RouteGenerator from '@/components/RouteGenerator';
import Toast, { ToastType } from '@/components/Toast';

type Tab = 'customers' | 'routes' | 'history';

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>('customers');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  // Fetch customers on mount
  const fetchCustomers = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCustomers(data || []);
    } catch (error) {
      console.error('Error fetching customers:', error);
      showToast('Failed to load customers', 'error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const showToast = (message: string, type: ToastType) => {
    setToast({ message, type });
  };

  const handleAddCustomer = async (formData: CustomerFormData) => {
    try {
      // Geocode the address
      const geoResult = await geocodeAddress(
        formData.address,
        formData.city,
        formData.state,
        formData.zip
      );

      const { data, error } = await supabase
        .from('customers')
        .insert([
          {
            name: formData.name,
            address: formData.address,
            city: formData.city,
            state: formData.state,
            zip: formData.zip,
            lat: geoResult?.lat || null,
            lng: geoResult?.lng || null,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      setCustomers((prev) => [data, ...prev]);
      showToast(
        geoResult
          ? 'Customer added and geocoded successfully!'
          : 'Customer added (geocoding failed)',
        geoResult ? 'success' : 'info'
      );
    } catch (error) {
      console.error('Error adding customer:', error);
      showToast('Failed to add customer', 'error');
      throw error;
    }
  };

  const handleImportCSV = () => {
    // TODO: Implement CSV import
    showToast('CSV import coming soon!', 'info');
  };

  return (
    <div className="min-h-screen pb-20 sm:pb-0">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[var(--bg-primary)]/80 backdrop-blur-lg border-b border-[var(--border-subtle)]">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[var(--gradient-amber)] flex items-center justify-center shadow-lg">
                <svg className="w-6 h-6 text-[var(--bg-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
              </div>
              <div>
                <h1 className="text-lg font-semibold text-[var(--text-primary)]">
                  Route Optimizer
                </h1>
                <p className="text-xs text-[var(--text-muted)] hidden sm:block">
                  Christmas Lights Installation
                </p>
              </div>
            </div>

            {/* Desktop Nav */}
            <nav className="hidden sm:flex items-center gap-1 bg-[var(--bg-secondary)] rounded-xl p-1">
              <NavButton
                active={activeTab === 'customers'}
                onClick={() => setActiveTab('customers')}
              >
                Customers
              </NavButton>
              <NavButton
                active={activeTab === 'routes'}
                onClick={() => setActiveTab('routes')}
              >
                Generate Routes
              </NavButton>
              <NavButton
                active={activeTab === 'history'}
                onClick={() => setActiveTab('history')}
              >
                History
              </NavButton>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-6">
        {isLoading ? (
          <LoadingState />
        ) : activeTab === 'customers' ? (
          <CustomerList
            customers={customers}
            selectedIds={selectedIds}
            onSelectionChange={setSelectedIds}
            onAddCustomer={() => setIsAddModalOpen(true)}
            onImportCSV={handleImportCSV}
          />
        ) : activeTab === 'routes' ? (
          selectedIds.size < 2 ? (
            <RouteGeneratorPlaceholder
              selectedCount={selectedIds.size}
              onGoToCustomers={() => setActiveTab('customers')}
            />
          ) : (
            <RouteGenerator
              selectedCustomers={customers.filter((c) => selectedIds.has(c.id))}
              onBack={() => setActiveTab('customers')}
            />
          )
        ) : (
          <HistoryPlaceholder />
        )}
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-[var(--bg-secondary)] border-t border-[var(--border-subtle)] sm:hidden z-40">
        <div className="flex justify-around py-2">
          <MobileNavButton
            active={activeTab === 'customers'}
            onClick={() => setActiveTab('customers')}
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            }
            label="Customers"
          />
          <MobileNavButton
            active={activeTab === 'routes'}
            onClick={() => setActiveTab('routes')}
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
            }
            label="Routes"
            badge={selectedIds.size > 0 ? selectedIds.size : undefined}
          />
          <MobileNavButton
            active={activeTab === 'history'}
            onClick={() => setActiveTab('history')}
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            label="History"
          />
        </div>
      </nav>

      {/* Modals */}
      <AddCustomerModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddCustomer}
      />

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}

function NavButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
        active
          ? 'bg-[var(--accent-amber)] text-[var(--bg-primary)]'
          : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]'
      }`}
    >
      {children}
    </button>
  );
}

function MobileNavButton({
  active,
  onClick,
  icon,
  label,
  badge,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  badge?: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all relative ${
        active ? 'text-[var(--accent-amber)]' : 'text-[var(--text-muted)]'
      }`}
    >
      <div className="relative">
        {icon}
        {badge !== undefined && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-[var(--accent-amber)] text-[var(--bg-primary)] text-xs font-bold rounded-full flex items-center justify-center">
            {badge}
          </span>
        )}
      </div>
      <span className="text-xs font-medium">{label}</span>
    </button>
  );
}

function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="w-12 h-12 border-4 border-[var(--bg-tertiary)] border-t-[var(--accent-amber)] rounded-full animate-spin" />
      <p className="text-[var(--text-secondary)] mt-4">Loading...</p>
    </div>
  );
}

function RouteGeneratorPlaceholder({
  selectedCount,
  onGoToCustomers,
}: {
  selectedCount: number;
  onGoToCustomers: () => void;
}) {
  return (
    <div className="card p-8 sm:p-12 text-center">
      <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-[var(--accent-amber-glow)] flex items-center justify-center">
        <svg className="w-8 h-8 text-[var(--accent-amber)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
        </svg>
      </div>

      <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-2">
        Generate Optimized Routes
      </h3>

      {selectedCount < 2 ? (
        <>
          <p className="text-[var(--text-secondary)] mb-6 max-w-sm mx-auto">
            Select at least 2 customers to generate optimized routes.
          </p>
          <button onClick={onGoToCustomers} className="btn btn-primary">
            Select Customers
          </button>
        </>
      ) : (
        <>
          <p className="text-[var(--text-secondary)] mb-6 max-w-sm mx-auto">
            {selectedCount} customers selected. Route generation coming soon!
          </p>
          <p className="text-[var(--text-muted)] text-sm">
            Set your start/end locations and number of routes to optimize.
          </p>
        </>
      )}
    </div>
  );
}

function HistoryPlaceholder() {
  return (
    <div className="card p-8 sm:p-12 text-center">
      <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-[var(--accent-amber-glow)] flex items-center justify-center">
        <svg className="w-8 h-8 text-[var(--accent-amber)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>

      <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-2">
        Route History
      </h3>
      <p className="text-[var(--text-secondary)] max-w-sm mx-auto">
        Your saved routes will appear here. Generate and save routes to build your history.
      </p>
    </div>
  );
}
