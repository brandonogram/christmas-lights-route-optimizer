'use client';

import { useState } from 'react';
import { Customer } from '@/lib/types';

interface CustomerListProps {
  customers: Customer[];
  selectedIds: Set<string>;
  onSelectionChange: (ids: Set<string>) => void;
  onAddCustomer: () => void;
  onImportCSV: () => void;
}

export default function CustomerList({
  customers,
  selectedIds,
  onSelectionChange,
  onAddCustomer,
  onImportCSV,
}: CustomerListProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.city.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectAll = () => {
    if (selectedIds.size === filteredCustomers.length) {
      onSelectionChange(new Set());
    } else {
      onSelectionChange(new Set(filteredCustomers.map((c) => c.id)));
    }
  };

  const handleToggle = (id: string) => {
    const newSelection = new Set(selectedIds);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    onSelectionChange(newSelection);
  };

  const allSelected = filteredCustomers.length > 0 && selectedIds.size === filteredCustomers.length;

  return (
    <div className="space-y-4">
      {/* Header with stats and actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-[var(--text-primary)]">
            Customers
          </h2>
          <p className="text-[var(--text-secondary)] text-sm mt-1">
            {customers.length} total
            {selectedIds.size > 0 && (
              <span className="ml-2 text-[var(--accent-amber)]">
                • {selectedIds.size} selected
              </span>
            )}
          </p>
        </div>

        <div className="flex gap-2">
          <button onClick={onImportCSV} className="btn btn-secondary text-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Import CSV
          </button>
          <button onClick={onAddCustomer} className="btn btn-primary text-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Customer
          </button>
        </div>
      </div>

      {/* Search and select all */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <svg
            className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search customers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input pl-12"
          />
        </div>

        {filteredCustomers.length > 0 && (
          <button
            onClick={handleSelectAll}
            className="btn btn-secondary text-sm whitespace-nowrap"
          >
            {allSelected ? 'Deselect All' : 'Select All'}
          </button>
        )}
      </div>

      {/* Customer list */}
      {customers.length === 0 ? (
        <EmptyState onAddCustomer={onAddCustomer} onImportCSV={onImportCSV} />
      ) : filteredCustomers.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="text-[var(--text-secondary)]">No customers match your search.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredCustomers.map((customer, index) => (
            <CustomerCard
              key={customer.id}
              customer={customer}
              isSelected={selectedIds.has(customer.id)}
              onToggle={() => handleToggle(customer.id)}
              style={{ animationDelay: `${index * 50}ms` }}
            />
          ))}
        </div>
      )}

      {/* Selection summary bar */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-[var(--bg-secondary)] border-t border-[var(--border-subtle)] sm:hidden">
          <div className="flex items-center justify-between">
            <span className="text-[var(--text-primary)] font-medium">
              {selectedIds.size} customer{selectedIds.size !== 1 ? 's' : ''} selected
            </span>
            <button
              onClick={() => onSelectionChange(new Set())}
              className="text-[var(--text-secondary)] text-sm"
            >
              Clear
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function CustomerCard({
  customer,
  isSelected,
  onToggle,
  style,
}: {
  customer: Customer;
  isSelected: boolean;
  onToggle: () => void;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={`card p-4 cursor-pointer animate-fade-up ${
        isSelected ? 'border-[var(--accent-amber)] bg-[var(--accent-amber-glow)]' : ''
      }`}
      onClick={onToggle}
      style={style}
    >
      <div className="flex items-start gap-4">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onToggle}
          onClick={(e) => e.stopPropagation()}
          className="checkbox mt-1 flex-shrink-0"
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-medium text-[var(--text-primary)] truncate">
              {customer.name}
            </h3>
            {customer.lat && customer.lng && (
              <span className="badge text-xs">
                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
                Geocoded
              </span>
            )}
          </div>
          <p className="text-[var(--text-secondary)] text-sm mt-1">
            {customer.address}
          </p>
          <p className="text-[var(--text-muted)] text-sm">
            {customer.city}, {customer.state} {customer.zip}
          </p>
        </div>

        {/* Desktop: Show full address inline */}
        <div className="hidden lg:block text-right text-sm">
          <span className="text-[var(--text-muted)]">
            {customer.ghl_contact_id ? 'From GHL' : 'Manual'}
          </span>
        </div>
      </div>
    </div>
  );
}

function EmptyState({
  onAddCustomer,
  onImportCSV,
}: {
  onAddCustomer: () => void;
  onImportCSV: () => void;
}) {
  return (
    <div className="card p-8 sm:p-12 text-center">
      <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-[var(--accent-amber-glow)] flex items-center justify-center">
        <svg className="w-8 h-8 text-[var(--accent-amber)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      </div>

      <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-2">
        No customers yet
      </h3>
      <p className="text-[var(--text-secondary)] mb-6 max-w-sm mx-auto">
        Add customers to start optimizing your routes. Import from a CSV file or add them one by one.
      </p>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <button onClick={onImportCSV} className="btn btn-secondary">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          Import CSV
        </button>
        <button onClick={onAddCustomer} className="btn btn-primary">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Customer
        </button>
      </div>
    </div>
  );
}
