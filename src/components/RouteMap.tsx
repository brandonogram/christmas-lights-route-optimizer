'use client';

import { useEffect, useRef } from 'react';
import { OptimizedRoute } from '@/lib/types';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface RouteMapProps {
  routes: OptimizedRoute[];
  activeRouteId: number | null;
  onRouteClick?: (routeId: number) => void;
}

export default function RouteMap({ routes, activeRouteId, onRouteClick }: RouteMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mapContainerRef.current || routes.length === 0) return;

    // Initialize map if not already done
    if (!mapRef.current) {
      mapRef.current = L.map(mapContainerRef.current, {
        zoomControl: true,
        attributionControl: true,
      });

      // Add dark themed tile layer
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20,
      }).addTo(mapRef.current);
    }

    const map = mapRef.current;

    // Clear existing layers (except tile layer)
    map.eachLayer((layer) => {
      if (!(layer instanceof L.TileLayer)) {
        map.removeLayer(layer);
      }
    });

    // Collect all points for bounds
    const allPoints: L.LatLng[] = [];

    // Add routes
    routes.forEach((route) => {
      const isActive = activeRouteId === null || activeRouteId === route.id;
      const opacity = isActive ? 1 : 0.4;

      // Create polyline points
      const linePoints: L.LatLngExpression[] = [];

      // Start location
      linePoints.push([route.startLocation.lat, route.startLocation.lng]);
      allPoints.push(L.latLng(route.startLocation.lat, route.startLocation.lng));

      // Add start marker
      const startIcon = L.divIcon({
        className: 'custom-marker',
        html: `
          <div style="
            width: 32px;
            height: 32px;
            background: #22c55e;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            border: 3px solid white;
            opacity: ${opacity};
          ">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
            </svg>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      L.marker([route.startLocation.lat, route.startLocation.lng], { icon: startIcon })
        .bindPopup(`<strong>Start</strong><br/>${route.startLocation.address || 'Starting Point'}`)
        .addTo(map);

      // Customer stops
      route.stops.forEach((stop, index) => {
        if (stop.lat && stop.lng) {
          linePoints.push([stop.lat, stop.lng]);
          allPoints.push(L.latLng(stop.lat, stop.lng));

          // Create numbered marker
          const stopIcon = L.divIcon({
            className: 'custom-marker',
            html: `
              <div style="
                width: 28px;
                height: 28px;
                background: ${route.color};
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-weight: bold;
                font-size: 12px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                border: 2px solid white;
                opacity: ${opacity};
                cursor: pointer;
              ">
                ${index + 1}
              </div>
            `,
            iconSize: [28, 28],
            iconAnchor: [14, 14],
          });

          const marker = L.marker([stop.lat, stop.lng], { icon: stopIcon })
            .bindPopup(`
              <strong>${stop.name}</strong><br/>
              ${stop.address}<br/>
              ${stop.city}, ${stop.state} ${stop.zip}<br/>
              <em style="color: ${route.color};">Route ${route.id} - Stop ${index + 1}</em>
            `)
            .addTo(map);

          if (onRouteClick) {
            marker.on('click', () => onRouteClick(route.id));
          }
        }
      });

      // End location
      linePoints.push([route.endLocation.lat, route.endLocation.lng]);
      allPoints.push(L.latLng(route.endLocation.lat, route.endLocation.lng));

      // Add end marker (only if different from start)
      if (
        route.endLocation.lat !== route.startLocation.lat ||
        route.endLocation.lng !== route.startLocation.lng
      ) {
        const endIcon = L.divIcon({
          className: 'custom-marker',
          html: `
            <div style="
              width: 32px;
              height: 32px;
              background: #ef4444;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              box-shadow: 0 2px 8px rgba(0,0,0,0.3);
              border: 3px solid white;
              opacity: ${opacity};
            ">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                <path d="M14.4 6L14 4H5v17h2v-7h5.6l.4 2h7V6z"/>
              </svg>
            </div>
          `,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });

        L.marker([route.endLocation.lat, route.endLocation.lng], { icon: endIcon })
          .bindPopup(`<strong>End</strong><br/>${route.endLocation.address || 'Ending Point'}`)
          .addTo(map);
      }

      // Draw route line
      L.polyline(linePoints, {
        color: route.color,
        weight: isActive ? 4 : 2,
        opacity: opacity,
        dashArray: isActive ? undefined : '5, 10',
      }).addTo(map);
    });

    // Fit map to show all points
    if (allPoints.length > 0) {
      const bounds = L.latLngBounds(allPoints);
      map.fitBounds(bounds, { padding: [50, 50] });
    }

    // Cleanup
    return () => {
      // Don't destroy map on every re-render, just clear layers
    };
  }, [routes, activeRouteId, onRouteClick]);

  // Cleanup map on unmount
  useEffect(() => {
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  if (routes.length === 0) {
    return (
      <div className="h-64 bg-[var(--bg-secondary)] rounded-xl flex items-center justify-center">
        <p className="text-[var(--text-muted)]">No routes to display</p>
      </div>
    );
  }

  return (
    <div className="relative">
      <div
        ref={mapContainerRef}
        className="h-[400px] sm:h-[500px] rounded-xl overflow-hidden"
        style={{ background: 'var(--bg-secondary)' }}
      />

      {/* Route Legend */}
      <div className="absolute bottom-4 left-4 bg-[var(--bg-primary)]/90 backdrop-blur-sm rounded-lg p-3 shadow-lg">
        <p className="text-xs text-[var(--text-muted)] mb-2 font-medium">Routes</p>
        <div className="space-y-1">
          {routes.map((route) => (
            <button
              key={route.id}
              onClick={() => onRouteClick?.(route.id)}
              className={`flex items-center gap-2 w-full px-2 py-1 rounded transition-colors ${
                activeRouteId === route.id
                  ? 'bg-[var(--bg-tertiary)]'
                  : 'hover:bg-[var(--bg-secondary)]'
              }`}
            >
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: route.color }}
              />
              <span className="text-xs text-[var(--text-primary)]">
                Route {route.id} ({route.stops.length} stops)
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
