'use client';

import { useState, useEffect } from 'react';
import { Customer, Location, OptimizedRoute, RouteSettings } from '@/lib/types';
import { geocodeAddress, getCurrentLocation, reverseGeocode } from '@/lib/geocoding';
import {
  optimizeRoutes,
  calculateRouteDistance,
  generateGoogleMapsUrl,
  generateAppleMapsUrl,
  isAppleDevice,
} from '@/lib/routeOptimizer';

interface RouteGeneratorProps {
  selectedCustomers: Customer[];
  onBack: () => void;
}

export default function RouteGenerator({ selectedCustomers, onBack }: RouteGeneratorProps) {
  const [settings, setSettings] = useState<RouteSettings>({
    numberOfRoutes: 1,
    startLocation: null,
    endLocation: null,
    returnToStart: true,
  });
  const [startAddress, setStartAddress] = useState('');
  const [endAddress, setEndAddress] = useState('');
  const [isGeocodingStart, setIsGeocodingStart] = useState(false);
  const [isGeocodingEnd, setIsGeocodingEnd] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [generatedRoutes, setGeneratedRoutes] = useState<OptimizedRoute[] | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeRouteId, setActiveRouteId] = useState<number | null>(null);
  const [showAppleMaps, setShowAppleMaps] = useState(false);

  useEffect(() => {
    setShowAppleMaps(isAppleDevice());
  }, []);

  const handleGeocodeStart = async () => {
    if (!startAddress.trim()) return;

    setIsGeocodingStart(true);
    try {
      // Parse address - assume format "address, city, state zip" or just use as-is
      const parts = startAddress.split(',').map((p) => p.trim());
      let address = startAddress;
      let city = '';
      let state = '';
      let zip = '';

      if (parts.length >= 3) {
        address = parts[0];
        city = parts[1];
        const stateZip = parts[2].split(' ');
        state = stateZip[0] || '';
        zip = stateZip[1] || '';
      }

      const result = await geocodeAddress(address, city, state, zip);
      if (result) {
        const newStartLocation: Location = {
          lat: result.lat,
          lng: result.lng,
          address: startAddress,
        };
        setSettings((prev) => ({
          ...prev,
          startLocation: newStartLocation,
          endLocation: prev.returnToStart ? newStartLocation : prev.endLocation,
        }));
        if (settings.returnToStart) {
          setEndAddress(startAddress);
        }
      }
    } catch (error) {
      console.error('Geocoding error:', error);
    } finally {
      setIsGeocodingStart(false);
    }
  };

  const handleGeocodeEnd = async () => {
    if (!endAddress.trim() || settings.returnToStart) return;

    setIsGeocodingEnd(true);
    try {
      const parts = endAddress.split(',').map((p) => p.trim());
      let address = endAddress;
      let city = '';
      let state = '';
      let zip = '';

      if (parts.length >= 3) {
        address = parts[0];
        city = parts[1];
        const stateZip = parts[2].split(' ');
        state = stateZip[0] || '';
        zip = stateZip[1] || '';
      }

      const result = await geocodeAddress(address, city, state, zip);
      if (result) {
        setSettings((prev) => ({
          ...prev,
          endLocation: {
            lat: result.lat,
            lng: result.lng,
            address: endAddress,
          },
        }));
      }
    } catch (error) {
      console.error('Geocoding error:', error);
    } finally {
      setIsGeocodingEnd(false);
    }
  };

  const handleUseCurrentLocation = async () => {
    setIsGettingLocation(true);
    try {
      const location = await getCurrentLocation();
      const address = await reverseGeocode(location.lat, location.lng);

      const newStartLocation: Location = {
        lat: location.lat,
        lng: location.lng,
        address: address || 'Current Location',
      };

      setStartAddress(address || 'Current Location');
      setSettings((prev) => ({
        ...prev,
        startLocation: newStartLocation,
        endLocation: prev.returnToStart ? newStartLocation : prev.endLocation,
      }));

      if (settings.returnToStart) {
        setEndAddress(address || 'Current Location');
      }
    } catch (error) {
      console.error('Error getting location:', error);
    } finally {
      setIsGettingLocation(false);
    }
  };

  const handleReturnToStartToggle = () => {
    const newValue = !settings.returnToStart;
    setSettings((prev) => ({
      ...prev,
      returnToStart: newValue,
      endLocation: newValue ? prev.startLocation : prev.endLocation,
    }));
    if (newValue && settings.startLocation) {
      setEndAddress(startAddress);
    }
  };

  const handleGenerateRoutes = () => {
    if (!settings.startLocation || selectedCustomers.length < 2) return;

    setIsGenerating(true);

    // Small delay to show loading state
    setTimeout(() => {
      const endLoc = settings.endLocation || settings.startLocation;
      const routes = optimizeRoutes(
        selectedCustomers,
        settings.numberOfRoutes,
        settings.startLocation!,
        endLoc!
      );

      setGeneratedRoutes(routes);
      setActiveRouteId(routes.length > 0 ? routes[0].id : null);
      setIsGenerating(false);
    }, 500);
  };

  const canGenerate = settings.startLocation && selectedCustomers.length >= 2;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="p-2 rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors"
        >
          <svg className="w-5 h-5 text-[var(--text-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div>
          <h2 className="text-2xl font-semibold text-[var(--text-primary)]">
            Generate Routes
          </h2>
          <p className="text-[var(--text-secondary)] text-sm">
            {selectedCustomers.length} customers selected
          </p>
        </div>
      </div>

      {!generatedRoutes ? (
        /* Settings Form */
        <div className="card p-6 space-y-6">
          {/* Number of Routes */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
              Number of Routes
            </label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min={1}
                max={Math.min(10, selectedCustomers.length)}
                value={settings.numberOfRoutes}
                onChange={(e) =>
                  setSettings((prev) => ({ ...prev, numberOfRoutes: parseInt(e.target.value) }))
                }
                className="flex-1 accent-[var(--accent-amber)]"
              />
              <span className="text-2xl font-semibold text-[var(--accent-amber)] w-8 text-center">
                {settings.numberOfRoutes}
              </span>
            </div>
            <p className="text-[var(--text-muted)] text-xs mt-1">
              ~{Math.ceil(selectedCustomers.length / settings.numberOfRoutes)} stops per route
            </p>
          </div>

          {/* Start Location */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
              Starting Location
            </label>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={startAddress}
                  onChange={(e) => setStartAddress(e.target.value)}
                  onBlur={handleGeocodeStart}
                  placeholder="Enter address (e.g., 123 Main St, Austin, TX 78701)"
                  className="input pr-10"
                />
                {settings.startLocation && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <svg className="w-5 h-5 text-[var(--accent-green)]" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>
              <button
                onClick={handleUseCurrentLocation}
                disabled={isGettingLocation}
                className="btn btn-secondary whitespace-nowrap"
              >
                {isGettingLocation ? (
                  <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )}
                <span className="hidden sm:inline">Use Current</span>
              </button>
            </div>
            {isGeocodingStart && (
              <p className="text-[var(--text-muted)] text-xs mt-1">Geocoding address...</p>
            )}
          </div>

          {/* Return to Start Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[var(--text-secondary)]">Return to Start</p>
              <p className="text-xs text-[var(--text-muted)]">End each route at the starting location</p>
            </div>
            <button
              onClick={handleReturnToStartToggle}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                settings.returnToStart ? 'bg-[var(--accent-amber)]' : 'bg-[var(--bg-tertiary)]'
              }`}
            >
              <span
                className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                  settings.returnToStart ? 'left-7' : 'left-1'
                }`}
              />
            </button>
          </div>

          {/* End Location (if not returning to start) */}
          {!settings.returnToStart && (
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                Ending Location
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={endAddress}
                  onChange={(e) => setEndAddress(e.target.value)}
                  onBlur={handleGeocodeEnd}
                  placeholder="Enter end address"
                  className="input pr-10"
                />
                {settings.endLocation && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <svg className="w-5 h-5 text-[var(--accent-green)]" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>
              {isGeocodingEnd && (
                <p className="text-[var(--text-muted)] text-xs mt-1">Geocoding address...</p>
              )}
            </div>
          )}

          {/* Generate Button */}
          <button
            onClick={handleGenerateRoutes}
            disabled={!canGenerate || isGenerating}
            className="btn btn-primary w-full text-lg py-4"
          >
            {isGenerating ? (
              <>
                <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Optimizing Routes...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Generate Optimized Routes
              </>
            )}
          </button>

          {!canGenerate && (
            <p className="text-center text-[var(--text-muted)] text-sm">
              {!settings.startLocation
                ? 'Enter a starting location to continue'
                : 'Select at least 2 customers'}
            </p>
          )}
        </div>
      ) : (
        /* Generated Routes Display */
        <div className="space-y-4">
          {/* Summary */}
          <div className="card p-4 flex items-center justify-between">
            <div>
              <p className="text-[var(--text-primary)] font-medium">
                {generatedRoutes.length} route{generatedRoutes.length !== 1 ? 's' : ''} generated
              </p>
              <p className="text-[var(--text-muted)] text-sm">
                Total: {generatedRoutes.reduce((sum, r) => sum + r.stops.length, 0)} stops
              </p>
            </div>
            <button
              onClick={() => setGeneratedRoutes(null)}
              className="btn btn-secondary text-sm"
            >
              Regenerate
            </button>
          </div>

          {/* Route Cards */}
          {generatedRoutes.map((route) => (
            <RouteCard
              key={route.id}
              route={route}
              isActive={activeRouteId === route.id}
              onToggle={() => setActiveRouteId(activeRouteId === route.id ? null : route.id)}
              showAppleMaps={showAppleMaps}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function RouteCard({
  route,
  isActive,
  onToggle,
  showAppleMaps,
}: {
  route: OptimizedRoute;
  isActive: boolean;
  onToggle: () => void;
  showAppleMaps: boolean;
}) {
  const distance = calculateRouteDistance(route);
  const hasMoreThan10Stops = route.stops.length > 10;

  return (
    <div
      className={`card overflow-hidden transition-all ${
        isActive ? 'ring-2 ring-[var(--accent-amber)]' : ''
      }`}
    >
      {/* Header */}
      <button
        onClick={onToggle}
        className="w-full p-4 flex items-center justify-between hover:bg-[var(--bg-tertiary)]/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div
            className="w-4 h-4 rounded-full"
            style={{ backgroundColor: route.color }}
          />
          <div className="text-left">
            <h3 className="font-medium text-[var(--text-primary)]">
              Route {route.id}
            </h3>
            <p className="text-[var(--text-muted)] text-sm">
              {route.stops.length} stops • {distance.toFixed(1)} miles
            </p>
          </div>
        </div>
        <svg
          className={`w-5 h-5 text-[var(--text-secondary)] transition-transform ${
            isActive ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Expanded Content */}
      {isActive && (
        <div className="border-t border-[var(--border-subtle)]">
          {/* Stops List */}
          <div className="p-4 space-y-2 max-h-64 overflow-y-auto">
            {/* Start Location */}
            <div className="flex items-start gap-3 text-sm">
              <div className="w-6 h-6 rounded-full bg-[var(--accent-green)] flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <p className="text-[var(--accent-green)] font-medium">Start</p>
                <p className="text-[var(--text-muted)] text-xs">
                  {route.startLocation.address || `${route.startLocation.lat.toFixed(4)}, ${route.startLocation.lng.toFixed(4)}`}
                </p>
              </div>
            </div>

            {/* Customer Stops */}
            {route.stops.map((stop, index) => (
              <div key={stop.id} className="flex items-start gap-3 text-sm">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-white text-xs font-bold"
                  style={{ backgroundColor: route.color }}
                >
                  {index + 1}
                </div>
                <div>
                  <p className="text-[var(--text-primary)]">{stop.name}</p>
                  <p className="text-[var(--text-muted)] text-xs">
                    {stop.address}, {stop.city}
                  </p>
                </div>
              </div>
            ))}

            {/* End Location */}
            <div className="flex items-start gap-3 text-sm">
              <div className="w-6 h-6 rounded-full bg-[var(--accent-red)] flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 6a3 3 0 013-3h10a1 1 0 01.8 1.6L14.25 8l2.55 3.4A1 1 0 0116 13H6a1 1 0 00-1 1v3a1 1 0 11-2 0V6z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <p className="text-[var(--accent-red)] font-medium">End</p>
                <p className="text-[var(--text-muted)] text-xs">
                  {route.endLocation.address || `${route.endLocation.lat.toFixed(4)}, ${route.endLocation.lng.toFixed(4)}`}
                </p>
              </div>
            </div>
          </div>

          {/* Warning for > 10 stops */}
          {hasMoreThan10Stops && (
            <div className="px-4 pb-2">
              <p className="text-[var(--accent-amber)] text-xs flex items-center gap-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                Google Maps supports max 10 waypoints. Only first 10 stops included.
              </p>
            </div>
          )}

          {/* Export Buttons */}
          <div className="p-4 pt-2 flex gap-2 border-t border-[var(--border-subtle)]">
            <a
              href={generateGoogleMapsUrl(route)}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary flex-1 text-sm"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
              </svg>
              Open in Google Maps
            </a>
            {showAppleMaps && (
              <a
                href={generateAppleMapsUrl(route)}
                className="btn btn-secondary flex-1 text-sm"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                </svg>
                Apple Maps
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
