# PRD: Christmas Lights Route Optimizer

## Introduction

A mobile-first web application for home services companies to optimize daily driving routes. The app pulls customer addresses from Supabase, groups them by geographic proximity, and generates efficient multi-route plans that minimize total travel time. Users can view optimized routes on an interactive map and export them to Google Maps or Apple Maps for turn-by-turn navigation.

## Goals

- Import customer addresses from Supabase database
- Generate optimized routes based on geographic proximity
- Support flexible number of routes/drivers per day
- Display routes on interactive map with clear visualization
- Export routes to Google Maps and Apple Maps for navigation
- Handle variable customer counts (5 to 50+ per day)
- Mobile-first design for field use

## User Stories

### US-001: Set up customer database schema
**Description:** As a developer, I need a database schema to store customer addresses so routes can be generated from real data.

**Acceptance Criteria:**
- [ ] Create `customers` table with: id, name, address, city, state, zip, lat, lng, created_at
- [ ] Create `routes` table with: id, name, date, created_at
- [ ] Create `route_stops` table with: id, route_id, customer_id, stop_order, created_at
- [ ] Run migration successfully on Supabase
- [ ] Typecheck passes

### US-002: Build customer list view
**Description:** As a user, I want to see all my customers in a list so I can verify the addresses before generating routes.

**Acceptance Criteria:**
- [ ] Display customers in a scrollable list showing name, address, city
- [ ] Show total customer count at top
- [ ] Empty state when no customers exist
- [ ] Mobile-responsive layout (card-based on mobile, table on desktop)
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-003: Add customer manually
**Description:** As a user, I want to add a customer address manually so I can include new customers not yet in my CRM.

**Acceptance Criteria:**
- [ ] "Add Customer" button opens modal/drawer
- [ ] Form fields: name, address, city, state, zip
- [ ] Address is geocoded to lat/lng on save (using geocoding API)
- [ ] Success toast on save, customer appears in list
- [ ] Validation: all fields required
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-004: Import customers from GoHighLevel
**Description:** As a user, I want to sync customers from my GoHighLevel CRM so I can use my existing client database.

**Acceptance Criteria:**
- [ ] "Connect GoHighLevel" button in settings/import section
- [ ] OAuth flow to authenticate with GHL API
- [ ] Fetch contacts from GHL with address data
- [ ] Map GHL contact fields to customer fields (name, address, city, state, zip)
- [ ] Show list of contacts to import with checkboxes
- [ ] Geocode selected contacts on import
- [ ] Store GHL contact ID for future sync
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-005: Import customers from CSV
**Description:** As a user, I want to upload a CSV of customer addresses so I can bulk import from my existing systems.

**Acceptance Criteria:**
- [ ] "Import CSV" button opens file picker
- [ ] Accept .csv files with columns: name, address, city, state, zip
- [ ] Preview imported data before confirming
- [ ] Geocode all addresses on import
- [ ] Show progress indicator during import
- [ ] Report success count and any failed rows
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-005: Select customers for today's routes
**Description:** As a user, I want to select which customers to include in today's route optimization so I can plan for specific service calls.

**Acceptance Criteria:**
- [ ] Checkbox on each customer row for selection
- [ ] "Select All" / "Deselect All" buttons
- [ ] Selected count displayed prominently
- [ ] Selection persists while navigating the page
- [ ] Minimum 2 customers required to generate routes
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-006: Configure route generation settings
**Description:** As a user, I want to specify route settings including start/end locations so routes begin and end where I need them.

**Acceptance Criteria:**
- [ ] Number input for "Number of Routes" (1-10, default 1)
- [ ] Starting location address input with geocoding
- [ ] Ending location address input with geocoding (can be same as start or different)
- [ ] "Use current location" button for start location
- [ ] Toggle for "Return to start" (sets end = start)
- [ ] "Generate Routes" button (disabled if < 2 customers selected or no start location)
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-007: Implement route optimization algorithm
**Description:** As a developer, I need a route optimization algorithm that groups customers by proximity and orders stops efficiently, respecting start/end locations.

**Acceptance Criteria:**
- [ ] Cluster customers into N groups using k-means or similar algorithm
- [ ] Within each cluster, order stops using nearest-neighbor heuristic
- [ ] Each route starts from the specified starting location
- [ ] Each route ends at the specified ending location
- [ ] Algorithm runs client-side for small datasets (<50 customers)
- [ ] Returns array of routes, each with ordered customer stops plus start/end
- [ ] Completes in under 2 seconds for 50 customers
- [ ] Typecheck passes

### US-008: Display optimized routes on map
**Description:** As a user, I want to see my optimized routes on a map so I can visualize the driving plan.

**Acceptance Criteria:**
- [ ] Interactive map showing all route stops as markers
- [ ] Each route displayed in different color
- [ ] Route lines connecting stops in order
- [ ] Click marker to see customer name and address
- [ ] Map auto-zooms to fit all stops
- [ ] Route legend showing color per route
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-009: Display route details list
**Description:** As a user, I want to see each route as an ordered list so I know the exact sequence of stops.

**Acceptance Criteria:**
- [ ] Tabbed or accordion view showing each route
- [ ] Each route shows: route name/number, stop count, estimated distance
- [ ] Stops listed in order with: stop number, customer name, address
- [ ] Highlight currently selected route on map
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-010: Export route to Google Maps
**Description:** As a user, I want to export a route to Google Maps so I can use turn-by-turn navigation while driving.

**Acceptance Criteria:**
- [ ] "Open in Google Maps" button for each route
- [ ] Opens Google Maps with all stops as waypoints in correct order
- [ ] Works on mobile (opens Google Maps app) and desktop (opens web)
- [ ] Handles up to 10 waypoints per route (Google Maps limit)
- [ ] Shows warning if route has >10 stops
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-011: Export route to Apple Maps
**Description:** As a user, I want to export a route to Apple Maps so iPhone users can navigate with their preferred app.

**Acceptance Criteria:**
- [ ] "Open in Apple Maps" button for each route
- [ ] Opens Apple Maps with all stops as waypoints in correct order
- [ ] Button only visible on Apple devices (iOS/macOS)
- [ ] Falls back gracefully on non-Apple devices
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-012: Save generated routes
**Description:** As a user, I want to save my generated routes so I can reference them later or share with drivers.

**Acceptance Criteria:**
- [ ] "Save Routes" button after generation
- [ ] Prompt for route date (defaults to today)
- [ ] Routes saved to Supabase with all stop data
- [ ] Success confirmation with link to saved routes
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-013: View saved routes history
**Description:** As a user, I want to see my previously saved routes so I can reference past service days.

**Acceptance Criteria:**
- [ ] "Route History" page/tab showing saved routes by date
- [ ] Each entry shows: date, number of routes, total stops
- [ ] Click to view route details and map
- [ ] Sorted by date descending (newest first)
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

## Functional Requirements

- FR-1: Store customers with geocoded lat/lng coordinates in Supabase
- FR-2: Support manual customer entry with address geocoding
- FR-3: Support CSV import with bulk geocoding
- FR-4: Allow selection of customers for route generation
- FR-5: Accept configurable number of routes (1-10)
- FR-6: Accept starting location with geocoding and optional "use current location"
- FR-7: Accept ending location with geocoding or "return to start" toggle
- FR-8: Cluster customers by geographic proximity using k-means algorithm
- FR-9: Order stops within each route using nearest-neighbor heuristic, starting from start location
- FR-10: Display routes on interactive map with colored markers and route lines
- FR-11: Generate Google Maps URL with waypoints for each route
- FR-12: Generate Apple Maps URL with waypoints for each route
- FR-13: Save route configurations to database for history
- FR-14: Display route history sorted by date

## Non-Goals

- No real-time traffic consideration (future enhancement)
- No time window constraints for appointments (future enhancement)
- No service duration estimates (future enhancement)
- No driver assignment or scheduling
- No customer notifications or SMS
- No integration with specific CRM systems (manual import only for now)
- No route re-optimization after generation

## Design Considerations

- Mobile-first responsive design using Tailwind CSS
- Bottom navigation for mobile, sidebar for desktop
- Map should be primary focus on route view
- Use existing Tailwind color palette for route differentiation
- Touch-friendly controls (large tap targets, swipe gestures)
- Dark mode support (matches system preference)

## Technical Considerations

- **Geocoding:** Use Google Maps Geocoding API or OpenStreetMap Nominatim
- **Maps:** Use Leaflet.js (free) or Google Maps JavaScript API
- **Clustering:** Implement k-means clustering client-side for <50 customers
- **Routing:** Use nearest-neighbor heuristic (not full TSP) for performance
- **Google Maps URL:** Use `https://www.google.com/maps/dir/` format with waypoints
- **Apple Maps URL:** Use `maps://` URL scheme with waypoints
- **Database:** Supabase with PostGIS extension for geographic queries (optional optimization)

## Success Metrics

- Route generation completes in under 3 seconds for 30 customers
- Generated routes reduce total estimated driving distance by 20%+ vs random order
- Users can go from customer selection to navigation in under 60 seconds
- Export to maps works on both iOS and Android devices

## Open Questions

- Should we use a free geocoding service (rate limited) or require user's Google API key?
- Do we need offline support for viewing saved routes?
- Should route optimization run server-side for larger datasets?
