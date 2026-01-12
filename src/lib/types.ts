// Database types for Christmas Lights Route Optimizer

export interface Customer {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  lat: number | null;
  lng: number | null;
  ghl_contact_id: string | null;
  created_at: string;
}

export interface Route {
  id: string;
  name: string;
  date: string;
  start_address: string | null;
  start_lat: number | null;
  start_lng: number | null;
  end_address: string | null;
  end_lat: number | null;
  end_lng: number | null;
  created_at: string;
}

export interface RouteStop {
  id: string;
  route_id: string;
  customer_id: string;
  stop_order: number;
  created_at: string;
  customer?: Customer;
}

export interface Settings {
  id: string;
  ghl_access_token: string | null;
  ghl_refresh_token: string | null;
  ghl_location_id: string | null;
  updated_at: string;
}

// For route optimization
export interface Location {
  lat: number;
  lng: number;
  address?: string;
}

export interface OptimizedRoute {
  id: number;
  color: string;
  stops: Customer[];
  startLocation: Location;
  endLocation: Location;
}

export interface RouteSettings {
  numberOfRoutes: number;
  startLocation: Location | null;
  endLocation: Location | null;
  returnToStart: boolean;
}

// Form types
export interface CustomerFormData {
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
}

// Geocoding response
export interface GeocodingResult {
  lat: number;
  lng: number;
  display_name: string;
}
