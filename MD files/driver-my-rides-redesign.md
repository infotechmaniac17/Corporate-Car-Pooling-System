# Driver My Rides — Full Redesign Specification

**Screen route:** `/driver/my-rides`  
**File:** `carpooling-frontend/src/screens/DriverMyRidesScreen.jsx`  
**New file:** `carpooling-frontend/src/components/RideDetailSheet.jsx`

---

## 1. Page Layout — Conditional on Data

### Case A — Upcoming rides EXIST

**Desktop (≥ 900px):**
```
┌──────────────────────────────────────────────────────────────────┐
│  "My rides"  [subtitle]                        [+ New ride btn]  │
├─────────────────────────────┬────────────────────────────────────┤
│  LEFT 50%                   │  RIGHT 50%                         │
│  Upcoming ride card(s)      │  RoutePreviewMap                   │
│  (scrollable if multiple)   │  (shows selected ride route)       │
│  [Start] [End] [Cancel]     │  height: fill left panel height    │
│                             │  min-height: 320px                  │
├─────────────────────────────┴────────────────────────────────────┤
│  Stats bar  (3 chips, full width)                                │
├──────────────────────────────────────────────────────────────────┤
│  "Past rides" section heading                                    │
│  Compact list rows (scrollable)                                  │
└──────────────────────────────────────────────────────────────────┘
```

**Mobile (< 900px):**
```
┌────────────────────────────┐
│  WpAppBar "My rides"  dark │
├────────────────────────────┤
│  Upcoming ride card        │
│  (full width)              │
├────────────────────────────┤
│  RoutePreviewMap  220px    │
│  (white card, rounded)     │
├────────────────────────────┤
│  Stats bar (3 chips)       │
├────────────────────────────┤
│  "Past rides" heading      │
│  Compact list rows         │
└────────────────────────────┘
```

---

### Case B — NO upcoming rides (all COMPLETED / CANCELLED, or zero rides)

Hero zone (split layout + map) is **completely removed**.  
Past rides list expands to full width from the top.

**Desktop:**
```
┌──────────────────────────────────────────────────────────────────┐
│  "My rides"   [subtitle]                       [+ New ride btn]  │
├──────────────────────────────────────────────────────────────────┤
│  Stats bar (full width, 3 chips)                                 │
├──────────────────────────────────────────────────────────────────┤
│  Past rides list — full width, max-width: 860px, centred        │
└──────────────────────────────────────────────────────────────────┘
```

**Mobile:** Same stacked order, no map block.

---

### Case C — Zero rides at all (brand new driver)

Show a single empty-state card (full width, centred):
- Car icon (36px, `var(--asphalt-300)`)
- Heading: "No rides yet" (15px, 600 weight)
- Subtext: "Offer your first ride to start earning" (13px, muted)
- `WpButton kind="accent"` → `/driver/offer-ride`

---

## 2. State Variables

```js
const [rides, setRides]               = useState([]);          // all rides from API
const [loading, setLoading]           = useState(true);
const [selectedRideId, setSelectedRideId] = useState(null);    // drives map + card highlight
const [detailRide, setDetailRide]     = useState(null);        // opens RideDetailSheet
const [cancellingId, setCancellingId] = useState(null);
const [statusChangingId, setStatusChangingId] = useState(null);
```

**`selectedRideId` default:** On data load, set to first upcoming ride's id. If no upcoming rides, set to null.

**Derived lists:**
```js
const upcoming = rides.filter(r => !['COMPLETED','CANCELLED'].includes(r.status));
const past     = rides.filter(r =>  ['COMPLETED','CANCELLED'].includes(r.status));
const mapRide  = rides.find(r => r.id === selectedRideId) ?? null;
```

---

## 3. Component: `ActiveRideCard`

**Purpose:** Shows one upcoming/active ride. Multiple upcoming rides = stacked list in left panel.

### Visual design
- Background: `#fff`
- Border-radius: `var(--radius-xl)` (16px)
- Border: `1.5px solid` — default `var(--asphalt-100)`, **selected** `var(--ink-400)`
- Box-shadow: `var(--shadow-2)` when selected, `var(--shadow-1)` otherwise
- Padding: `20px`
- Cursor: `pointer` on card body (clicking selects it)
- Transition: `border-color 0.15s, box-shadow 0.15s`

### Content layout (top to bottom)

**Row 1 — Route + Status pill:**
```
[pickup area]  →  [dropoff area]        [STATUS PILL]
```
- Route text: extract area/city from label — take substring before first comma, truncate at 22 chars with ellipsis
- Font: 15px, 700 weight, `var(--asphalt-900)`
- Arrow `→`: `var(--asphalt-400)`, 13px
- Status pill: `WpPill` with tone mapping below

**Status → tone mapping:**
| Status | Tone | Display text |
|--------|------|--------------|
| CREATED | `matched` | SCHEDULED |
| ACTIVE | `matched` | ACTIVE |
| STARTED | `live` | ● LIVE |

**Row 2 — Meta chips (small, spaced):**
```
🗓 Thu, 15 May  ·  ⏰ 08:30 AM  ·  👥 2/4 seats  ·  ₹120/seat
```
- Font: 12px, `var(--font-mono)`, `var(--asphalt-500)`
- Date+time: `toLocaleDateString('en-IN', {weekday:'short', day:'numeric', month:'short'})` + time
- Seats: `{bookedSeats}/{availableSeats}` — show in orange if full (`bookedSeats === availableSeats`)
- Fare: `₹{fare}/seat`

**Row 3 — Action buttons:**
- Always show: nothing (no action for CREATED with 0 bookings yet) — or "View bookings" link
- `CREATED` or `ACTIVE`: `[Start ride]` (green outline) + `[Cancel]` (red outline)
- `STARTED`: `[End ride]` (dark outline) — no cancel
- All buttons: height 36px, font 13px 600 weight, border-radius `var(--radius-md)`

**"View bookings" link:** small text link `View {bookedSeats} passenger(s) →` — only show if `bookedSeats > 0`, navigates to `/driver/trips/{id}/bookings`

### Props
```js
{
  ride,           // TripResponse object
  selected,       // bool — drives highlight border
  onSelect,       // () => setSelectedRideId(ride.id)
  onStart,        // (id) => ...
  onEnd,          // (id) => ...
  onCancel,       // (ride) => ...
  statusChanging, // bool
  cancelling,     // bool
}
```

---

## 4. Component: `PastRideRow`

**Purpose:** Compact single-row representation of COMPLETED or CANCELLED ride in the history list.

### Visual design
- Background: `#fff`
- Border-radius: `var(--radius-lg)` (12px)
- Border: `1px solid var(--asphalt-100)`
- Padding: `14px 16px`
- Cursor: `pointer` — clicking opens `RideDetailSheet`
- Hover: `background: var(--asphalt-50)` (transition 0.1s)
- Height: ~56px (single line on desktop, two lines mobile if route wraps)

### Desktop row layout (flex, space-between, align-center):
```
[date col]  [route col flex-1]  [passengers]  [earnings]  [co2]  [pill]  [›]
```

| Column | Width | Content |
|--------|-------|---------|
| Date | 64px fixed | "12 May" — `toLocaleDateString('en-IN', {day:'numeric', month:'short'})` — 12px mono, `var(--asphalt-500)` |
| Route | flex 1, min 0 | "Kothrud → Hinjewadi" — area extraction same as ActiveRideCard — 13px, 600, `var(--asphalt-800)`, overflow ellipsis nowrap |
| Passengers | 52px | `👥 {bookedSeats}` — 12px mono, `var(--asphalt-500)` |
| Earnings | 64px | `₹{fare × bookedSeats}` — 13px 700 `var(--asphalt-900)` — show `—` if CANCELLED or bookedSeats = 0 |
| CO₂ | 64px | `🌿 {co2}` — see formula section — show `—` if CANCELLED or bookedSeats = 0 |
| Pill | auto | `WpPill` — COMPLETED green, CANCELLED grey |
| Chevron | 16px | `›` — `var(--asphalt-300)` |

### Mobile row layout (two lines):
```
Line 1: [route short]                    [pill]
Line 2: [date]  [👥 N]  [₹ earnings]  [🌿 co2]
```

### Props
```js
{ ride, onClick }   // onClick = () => setDetailRide(ride)
```

---

## 5. Component: `StatsBar`

**Purpose:** Summary row between hero and past list. Always visible if `past.length > 0`.

### Visual design
- Background: `#fff`
- Border-radius: `var(--radius-xl)`
- Border: `1px solid var(--asphalt-100)`
- Padding: `16px 20px`
- Layout: 3 chips in a flex row, `justify-content: space-around`

### Three chips:

| Chip | Icon | Label | Value |
|------|------|-------|-------|
| Rides | `car` | "Total rides" | `rides.length` |
| Earned | `wallet` | "Total earned" | `₹{sum of fare×bookedSeats for COMPLETED}` |
| CO₂ | leaf SVG | "CO₂ saved" | `{total co2 kg} kg` |

Each chip:
- Icon in 28×28 rounded square (background color per chip — ink-50, success-100, green-50)
- Label: 10px uppercase mono `var(--asphalt-400)`
- Value: 16px 800 weight `var(--asphalt-900)` mono
- Vertical stacked layout per chip

---

## 6. Component: `RideDetailSheet`

**New file:** `src/components/RideDetailSheet.jsx`

**Purpose:** Full details of a past ride. Slide-up sheet on mobile, right-side panel or centred modal on desktop.

### Trigger
`detailRide` state in parent is non-null → sheet mounts and animates in.  
Dismissed by: backdrop click, `×` button, swipe-down (mobile).

### Animation
- Mobile: slide up from bottom — `translateY(100%) → translateY(0)`, 280ms ease-out
- Desktop: fade-in centred modal with backdrop blur
- Backdrop: `rgba(0,0,0,0.4)` with `backdropFilter: blur(4px)`
- z-index: 1200

### Sheet width/height
- Mobile: `width: 100%`, `max-height: 90vh`, `border-radius: 20px 20px 0 0`, positioned at bottom
- Desktop: `width: 560px`, `max-height: 85vh`, `border-radius: var(--radius-2xl)`, centred

### Content sections (scrollable body)

**Header:**
- Drag handle (mobile only): 4×36px rounded bar, `var(--asphalt-200)`, centred top
- Title: "Ride details" 18px 800
- Close `×` button top-right: 32×32px circle, `var(--asphalt-100)` bg

**Section 1 — Route map thumbnail:**
- `RoutePreviewMap` height 180px with `pickup` and `dropoff` from the ride
- Non-interactive (`pointer-events: none` wrapper) — just visual

**Section 2 — Trip info (grid 2×N):**
| Label | Value |
|-------|-------|
| Date | full date string |
| Departure | time |
| Vehicle | vehicleNumber |
| Fare | ₹{fare}/seat |
| Available seats | availableSeats |
| Status | coloured text |
| Recurring | recurringDays or "One-time" |

**Section 3 — Passengers:**
- Heading: "Passengers ({count})"
- If 0 bookings: "No passengers booked" muted text
- Each passenger row: avatar circle (initials, `var(--ink-100)` bg) + name + pickup→dropoff short labels + status pill
- Load via `GET /trips/{tripId}/bookings` — fetch inside sheet on mount

**Section 4 — Earnings:**
- "Earnings from this ride"
- `₹{fare} × {bookedSeats} passengers = ₹{total}` — large display
- Show `—` / "No earnings" if CANCELLED

**Section 5 — CO₂:**
- "Environmental impact"
- `🌿 ~{co2}` with description: "Estimated CO₂ avoided by sharing this ride"
- Distance: `~{haversineKm}km route`

**Section 6 — Status timeline:**
- Vertical stepper: CREATED → ACTIVE → STARTED → COMPLETED (or CANCELLED)
- Completed steps: filled green circle + dark text
- Pending/skipped steps: empty circle + muted text
- CANCELLED: last filled step is red

### Props
```js
{ ride, onClose }
```

---

## 7. CO₂ & Earnings Helper Functions

These go in a shared helper (top of `DriverMyRidesScreen.jsx` or a separate `src/utils/rideCalc.js`):

```js
function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const toRad = d => d * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat/2)**2 +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Returns formatted string: "1.4 kg" or "840 g"
function co2Saved(ride) {
  if (!ride.pickupLat || !ride.dropoffLat || !ride.bookedSeats) return null;
  const km = haversineKm(ride.pickupLat, ride.pickupLng, ride.dropoffLat, ride.dropoffLng);
  const grams = ride.bookedSeats * km * 120; // 120g CO₂/km per displaced car
  if (grams >= 1000) return `${(grams / 1000).toFixed(1)} kg`;
  return `${Math.round(grams)} g`;
}

function totalEarnings(ride) {
  if (ride.status !== 'COMPLETED' || !ride.bookedSeats) return 0;
  return (ride.fare ?? 0) * ride.bookedSeats;
}

function areaLabel(fullLabel) {
  if (!fullLabel) return '—';
  const part = fullLabel.split(',')[0].trim();
  return part.length > 22 ? part.slice(0, 21) + '…' : part;
}
```

---

## 8. Map Wiring

```jsx
// In render, compute mapRide:
const mapRide = rides.find(r => r.id === selectedRideId) ?? null;

const mapPickup  = mapRide ? { lat: mapRide.pickupLat,  lng: mapRide.pickupLng,  label: mapRide.pickupLabel  } : null;
const mapDropoff = mapRide ? { lat: mapRide.dropoffLat, lng: mapRide.dropoffLng, label: mapRide.dropoffLabel } : null;

// Pass to RoutePreviewMap:
<RoutePreviewMap pickup={mapPickup} dropoff={mapDropoff} height={320} />
```

Map updates automatically when `selectedRideId` changes because `RoutePreviewMap` watches `pickup?.lat` / `dropoff?.lat` in its effect dependency array.

---

## 9. Loading & Error States

**Loading skeleton:**
- 2 skeleton cards (upcoming section): `height: 120px`, shimmer animation (`linear-gradient` background, `backgroundSize: 200%`, `animation: shimmer 1.4s infinite`)
- 4 skeleton rows (past section): `height: 56px`, same shimmer

**API error:**
- Inline banner: red outline, "Failed to load rides. Tap to retry." with retry button
- No full-page error

**Cancel confirmation:**
- Replace `window.prompt` with an inline confirmation state on the card
- Show: "Cancel this ride? [Yes, cancel] [Keep it]" inside the card (no browser dialogs)

---

## 10. Responsive Behaviour Details

**Desktop left panel (upcoming cards):**
- If 1 upcoming ride: full height of left panel
- If 2–3: vertically stacked, panel scrollable
- If 4+: same, with subtle fade gradient at bottom indicating scroll

**Desktop right panel (map):**
- `position: sticky`, `top: 24px` — stays in view while user scrolls upcoming cards
- `height: calc(100vh - 160px)`, `max-height: 500px`

**Mobile:**
- Upcoming card: full width
- Map: 220px height, white card wrapper with `border-radius: var(--radius-2xl)` and `overflow: hidden`
- Past list rows: two-line layout (see PastRideRow mobile spec above)

---

## 11. API Calls Used

| Call | Endpoint | When |
|------|----------|------|
| Load all driver rides | `GET /trips/driver/published` | on mount + after status change |
| Start ride | `PUT /rides/{id}/status` body `{status:"STARTED"}` | Start button |
| End ride | `PUT /rides/{id}/status` body `{status:"COMPLETED"}` | End button |
| Cancel ride | `DELETE /rides/{id}/cancel` body `{reasonCode:"OTHER", note}` | Cancel confirm |
| Load bookings for detail | `GET /trips/{id}/bookings` | RideDetailSheet mount |

No new backend endpoints needed.

---

## 12. Files Changed

| File | Action |
|------|--------|
| `src/screens/DriverMyRidesScreen.jsx` | Full rewrite |
| `src/components/RideDetailSheet.jsx` | New file |

**Reused unchanged:**
- `RoutePreviewMap.jsx`
- `WpAppBar`, `WpButton`, `WpPill`, `WpIcon`
- `useDriverLocationStream`, `useIsDesktop`
- `getMyDriverTrips`, `cancelSchedule`, `updateScheduleStatus`

---

## 13. Date & Time Validation (Offer Ride Screen)

These validations apply in `DriverOfferRideScreen.jsx` on form submit and in real-time.

### Rules

| Field | Rule | Error message |
|-------|------|---------------|
| Date | Must not be in the past (today or future only) | "Departure date cannot be in the past" |
| Date | Max 30 days in advance | "You can schedule at most 30 days ahead" |
| Time | If date = today, departure time must be ≥ now + 30 min | "Departure time must be at least 30 minutes from now" |
| Time | Not before 05:00 or after 23:00 | "Rides can only be scheduled between 5 AM and 11 PM" |
| Date + time combined | Build `departureTime = new Date(\`${date}T${time}:00\`)` and validate the full timestamp | — |

### Real-time validation behaviour
- Date field: validate `onBlur` and on change
- Time field: validate `onBlur`
- Error shown below the field in red (12px), not just on submit
- Submit button stays disabled while any validation error exists

### Backend-side guard (already present in `RideScheduleServiceImpl`)
- Backend checks driver has no open ride — frontend shows: "You already have an active or upcoming ride. Cancel it first."
- Vehicle must belong to driver — frontend shows: "This vehicle is not registered to your account."

---

## 14. Pre-Departure Notification Banner

### Trigger logic
Runs as a `setInterval` (every 60 seconds) while the My Rides screen is mounted, checking all upcoming rides.

```js
useEffect(() => {
  const tick = () => {
    const now = Date.now();
    upcoming.forEach(ride => {
      const dep = new Date(ride.departureTime).getTime();
      const diffMin = (dep - now) / 60000;
      if (diffMin > 0 && diffMin <= 30 && ride.status !== 'STARTED') {
        setImminent(ride); // store the imminent ride
      }
    });
  };
  tick(); // run immediately on mount
  const id = setInterval(tick, 60_000);
  return () => clearInterval(id);
}, [upcoming]);
```

### Imminent ride banner (shown at top of screen, above hero)
- Background: `var(--voltage-50)` or amber `#fff8e1`
- Border: `1px solid #ffe082`
- Text: `"⏰ Your ride to {dropoffArea} starts in {X} min — tap to start"`
- Countdown: live minute counter, updates every 60s
- CTA button: `[Start ride →]` — calls `handleStartRide(ride.id)` directly
- Dismiss `×`: hides banner for this ride in current session (localStorage key `dismissed_imminent_{rideId}`)
- Auto-dismisses when ride status becomes STARTED

### Time thresholds

| Time to departure | Banner colour | Message |
|-------------------|--------------|---------|
| ≤ 30 min, > 15 min | Amber `#fff8e1` | "Starts in X min" |
| ≤ 15 min, > 0 | Orange `#fff3e0` | "Starting soon — X min left" |
| 0 to -30 min (overdue) | Red `var(--danger-50)` | "Was scheduled X min ago — start or mark delayed" |
| > -30 min (very late) | Red bold | See Section 16 (Expired/Overdue) |

---

## 15. Ride Lifecycle — UI Behaviour per Status Transition

### CREATED → ACTIVE
- Triggered by driver manually (or future automation)
- Currently no UI button for this transition — `STARTED` is the driver's first manual action
- If needed later, `ACTIVE` means "driver confirmed, accepting passengers"
- UI: status pill changes from "SCHEDULED" to "ACTIVE", same card layout

### CREATED / ACTIVE → STARTED (driver taps "Start ride")

**Pre-start confirmation (inline, not browser dialog):**
```
Card expands to show:
  "Start this ride now?"
  Passengers booked: {N}
  Departure was: {time}
  [Confirm start]   [Not yet]
```
- `[Confirm start]` calls `PUT /rides/{id}/status` `{status: "STARTED"}`
- On success:
  - Status pill → `● LIVE` (red pulsing dot)
  - `Start ride` button disappears
  - `End ride` button appears
  - `useDriverLocationStream(rideId)` activates — begins sending GPS to `/topic/ride/{id}/location`
  - Imminent banner auto-dismisses
  - Map switches to live mode (blue GPS dot prominent)
  - Toast: "Ride started — passengers notified"

### STARTED → COMPLETED (driver taps "End ride")

**Pre-end confirmation (inline):**
```
"Complete this ride?"
  Duration: {start time → now}
  Passengers: {N}
  [Complete ride]   [Still going]
```
- On confirm: `PUT /rides/{id}/status` `{status: "COMPLETED"}`
- On success:
  - `useDriverLocationStream` stops (hook cleans up)
  - Card moves to past rides list
  - Status pill → COMPLETED (green)
  - Stats bar updates (earnings + CO₂ recalculated)
  - Toast: "Ride completed! ₹{earnings} earned"
  - Selected ride in map panel resets to next upcoming ride (if any)

### CREATED / ACTIVE / STARTED → CANCELLED (driver cancels)

**Cancel flow (inline, replaces browser prompt):**
- Tap `Cancel` → card shows inline confirmation:
```
"Cancel this ride?"
  Reason (optional): [______________________]
  ⚠ {N} passenger(s) will be notified
  [Yes, cancel]   [Keep ride]
```
- On confirm: `DELETE /rides/{id}/cancel` `{reasonCode: "OTHER", note}`
- On success:
  - Card moves to past list with CANCELLED pill (grey)
  - If had passengers: toast "Ride cancelled — {N} passenger(s) notified"
  - If no passengers: toast "Ride cancelled"
  - Map panel deselects this ride, selects next upcoming (if any)

---

## 16. Edge Cases — Expired / Overdue Rides

### Definition
Ride is EXPIRED/OVERDUE when:
- `status` is `CREATED` or `ACTIVE`
- `departureTime` is more than **30 minutes in the past**
- Driver never tapped "Start ride"

Backend has a scheduler (`RideExpiryScheduler` / `@Scheduled`) that auto-cancels stale rides — check `findByStatusInAndDepartureTimeBefore`. Frontend must also handle gracefully.

### Frontend handling

**On load:** Scan all upcoming rides. Any ride where `now > departureTime + 30min` is treated as overdue.

**Overdue ride card visual:**
- Border: `1.5px solid var(--danger-200)`
- Background: `var(--danger-50)` tint (very light red)
- Status pill: "OVERDUE" — tone `cancelled` (grey-red)
- Banner inside card: `"This ride was scheduled for {timeAgo}. It may have been auto-cancelled."`
- Actions shown: `[Mark as completed]` + `[Cancel]` — no "Start ride" (too late to start)
- `[Mark as completed]` calls End ride flow → COMPLETED
- Refresh button: "Reload" — re-fetches rides (backend may have auto-cancelled)

**Auto-cancelled by backend:**
- Ride disappears from upcoming on next load — moves to past as CANCELLED
- If screen was open during auto-cancel: polling interval (see Section 18) catches it

---

## 17. Edge Case — Delayed Ride (Driver Running Late)

### Definition
Ride is **delayed** when:
- `departureTime` has passed (0–30 min ago)
- Status is still `CREATED` or `ACTIVE`
- Driver has NOT started it yet

### UI behaviour

**Overdue banner on card:**
- "Your ride was scheduled {X} min ago"
- Options: `[Start now — {X} min late]` · `[Notify passengers of delay]` · `[Cancel ride]`

**"Notify passengers of delay" action:**
- Opens inline delay notice input: "How long will you be delayed? [15 min ▾]"  
- Options: 10 min / 15 min / 30 min / Other
- Sends (future feature — log only for now): calls `POST /rides/{id}/events` with `{type: "DELAYED", metadata: {delayMinutes: 15}}`
- Toast: "Passengers notified of delay" (optimistic, even if endpoint not yet live)
- Card shows: "🕐 Delayed — starting {originalTime + delay}"

**Note for backend:** `POST /rides/{id}/events` custom event endpoint not yet implemented. Frontend should gracefully degrade — show toast regardless, log to console if call fails. Mark as TODO in code.

---

## 18. Edge Case — Ride Started with 0 Passengers

- Valid scenario: driver offered ride, nobody booked, driver still wants to start
- No validation block — allow start
- Card shows: "No passengers on this ride"
- Confirmation dialog text changes: "Start ride with no passengers?"
- CO₂ saved = 0 (nothing to calculate)
- Earnings = 0
- Still creates a STARTED→COMPLETED lifecycle (valid for tracking driver activity)

---

## 19. Edge Case — Passenger Cancels After Ride Starts

- Backend: `TripBooking.status` → CANCELLED, `bookedSeats` decrements
- Frontend: `bookedSeats` shown on STARTED card should reflect live count
- Re-fetch rides on `visibilitychange` event (tab comes back into focus) to get fresh counts
- If `bookedSeats` drops to 0 mid-ride: show subtle banner "All passengers have cancelled — you may end the ride early"

---

## 20. Edge Case — Multiple Upcoming Rides (Stacked Cards)

- Driver can have at most 1 open ride at a time — enforced by backend (`existsByDriverIdAndStatusIn` check)
- So left panel will always show **at most 1 upcoming ride card**
- If somehow 2 exist (data inconsistency): show both, warn "You have multiple open rides — this may be a data issue. Contact support."
- Map shows the selected one (first by default)

---

## 21. Edge Case — Network Errors During Status Change

**If `updateScheduleStatus` fails:**
- Do NOT change local state
- Show inline error on the card: "Failed to start ride. Check connection and try again."
- Error auto-clears after 5 seconds
- Button re-enables immediately after failure (no stuck spinner)

**If `cancelSchedule` fails:**
- Show inline error, keep card in current status
- "Failed to cancel. Try again." with retry button

**Optimistic update:** Do NOT use optimistic UI for status changes — too risky to show wrong state. Always wait for API response.

---

## 22. Polling / Auto-Refresh

Screen auto-refreshes ride data in two cases:

1. **Tab focus:** `document.addEventListener('visibilitychange', ...)` — re-fetch when tab becomes visible (user returning from another tab)
2. **STARTED rides:** Poll every **30 seconds** while any ride has status `STARTED` — catches backend auto-completion, passenger changes
3. **No polling otherwise** — avoid unnecessary requests

```js
useEffect(() => {
  const onVisible = () => { if (!document.hidden) load(); };
  document.addEventListener('visibilitychange', onVisible);
  return () => document.removeEventListener('visibilitychange', onVisible);
}, []);

useEffect(() => {
  if (!rides.some(r => r.status === 'STARTED')) return;
  const id = setInterval(load, 30_000);
  return () => clearInterval(id);
}, [rides]);
```

---

## 23. Ride Status — Complete State Machine (Frontend)

```
CREATED ──────────────────────────────────────────► CANCELLED
   │                                                     ▲
   │ (auto or future "activate")                         │
   ▼                                                     │
ACTIVE ───────────────────────────────────────────► CANCELLED
   │                                                     ▲
   │ driver taps "Start ride"                            │
   ▼                                                     │
STARTED ──────────────────────────────────────────► CANCELLED
   │
   │ driver taps "End ride"
   ▼
COMPLETED


VIRTUAL STATES (frontend-only, derived from data):
  OVERDUE  = status IN [CREATED, ACTIVE] AND departureTime < now - 30min
  DELAYED  = status IN [CREATED, ACTIVE] AND departureTime < now AND departureTime > now - 30min
  IMMINENT = status IN [CREATED, ACTIVE] AND departureTime > now AND departureTime < now + 30min
```

### Button visibility matrix

| Status | Start ride | End ride | Cancel | Mark completed |
|--------|-----------|----------|--------|----------------|
| CREATED | ✓ | — | ✓ | — |
| ACTIVE | ✓ | — | ✓ | — |
| STARTED | — | ✓ | ✓ | — |
| OVERDUE | — | — | ✓ | ✓ |
| DELAYED | ✓ (late) | — | ✓ | — |
| COMPLETED | — | — | — | — |
| CANCELLED | — | — | — | — |

---

## 24. Toast Notification System

All action feedback shown as toasts (not browser alert/confirm). Toast component to be created or reused.

| Action | Toast | Colour | Duration |
|--------|-------|--------|----------|
| Ride started | "Ride started — passengers notified" | Green | 3s |
| Ride completed | "Ride completed! ₹{N} earned" | Green | 4s |
| Ride cancelled | "Ride cancelled" / "…{N} passengers notified" | Grey | 3s |
| Start failed | "Failed to start. Try again." | Red | 5s |
| Cancel failed | "Failed to cancel. Try again." | Red | 5s |
| Delay notified | "Passengers notified of delay" | Amber | 3s |

Toast position: bottom-center (mobile), top-right (desktop). z-index: 1500.

---

## 25. Accessibility & UX Details

- All action buttons have `aria-label` attributes
- Keyboard: `Enter`/`Space` on `PastRideRow` opens detail sheet
- Focus trap inside `RideDetailSheet` while open
- `RideDetailSheet` close on `Escape` key
- All status colours also have icon/text indicator (not colour-only)
- Confirmation inline flows (cancel/start/end) must be cancellable with `Escape`

---

---

# Passenger My Trips — Redesign & Sync Specification

**Screen route:** `/passenger/my-trips` (or `/my-trips`)  
**File:** `carpooling-frontend/src/screens/PassengerTripsScreen.jsx`

This section documents changes needed to bring `PassengerTripsScreen` to parity with the driver redesign above. Shared patterns (toasts, inline confirmations, polling, virtual states) follow the same rules as §§14–25.

---

## P1. Page Layout

### Case A — Active bookings EXIST

**Desktop (≥ 900px):**
```
┌──────────────────────────────────────────────────────────────────┐
│  "My trips"  [subtitle]                     [Find a ride btn]    │
├─────────────────────────────┬────────────────────────────────────┤
│  LEFT 50%                   │  RIGHT 50%                         │
│  Active booking card(s)     │  RoutePreviewMap                   │
│  (scrollable if multiple)   │  (shows selected booking route)    │
│  [Track] [Chat] [Cancel]    │  height: fill left panel height    │
│                             │  min-height: 320px                 │
├─────────────────────────────┴────────────────────────────────────┤
│  Stats bar  (3 chips, full width)                                │
├──────────────────────────────────────────────────────────────────┤
│  "Past trips" section heading                                    │
│  Compact list rows (scrollable)                                  │
└──────────────────────────────────────────────────────────────────┘
```

**Mobile (< 900px):**
```
┌────────────────────────────┐
│  WpAppBar "My trips"  dark │
├────────────────────────────┤
│  Active booking card       │
│  (full width)              │
├────────────────────────────┤
│  RoutePreviewMap  220px    │
│  (white card, rounded)     │
├────────────────────────────┤
│  Stats bar (3 chips)       │
├────────────────────────────┤
│  "Past trips" heading      │
│  Compact list rows         │
└────────────────────────────┘
```

### Case B — No active bookings, past trips EXIST

- Hero zone collapses (no map panel, no active card)
- Past trips list fills the top of the page immediately after the header
- Stats bar stays above the list

### Case C — No trips at all

- Show empty state with dashed border card, "Find a ride" CTA button

---

## P2. State Variables

```js
const [bookings, setBookings]           = useState([]);
const [loading, setLoading]             = useState(true);
const [selectedBookingId, setSelectedBookingId] = useState(null); // drives map
const [detailBooking, setDetailBooking] = useState(null);         // BookingDetailSheet
const [cancellingId, setCancellingId]   = useState(null);
const [confirmCancel, setConfirmCancel] = useState(null);         // inline confirm
const [toast, setToast]                 = useState(null);
```

`selectedBookingId` defaults to first active booking on load. Clicking a past row sets `detailBooking`.

---

## P3. Active Booking Card

Same visual weight as driver's `ActiveRideCard`. Shows:

| Field | Value |
|-------|-------|
| Route | `areaLabel(pickupLabel)` → `areaLabel(dropoffLabel)` (abbreviated, not full address) |
| Date & time | `{dateStr} · {timeStr}` in mono font |
| Driver | Name + avatar placeholder |
| Vehicle | Plate number in mono |
| Fare | `₹{fare}` bold |
| Status pill | Virtual status (see §P7) |
| Seats | "Seat {seatNumber}" or "1 seat booked" |

### Action buttons per status

| scheduleStatus | Actions shown |
|----------------|---------------|
| CREATED / ACTIVE | `[Cancel booking]` |
| STARTED | `[Track ride]` · `[Chat]` · `[Cancel booking]` |
| COMPLETED | `[Rate driver]` (if not yet rated) |
| CANCELLED | No actions — greyed card |

- `[Track ride]` → navigate to `/tracking/{rideId}`
- `[Chat]` → navigate to `/chat/{rideId}`
- `[Rate driver]` → navigate to `/rate/{rideId}?driverId={driverId}` (only if `!hasRated`)
- `[Cancel booking]` → inline confirmation (see §P8)

---

## P4. Past Trips — Compact Row

Replace full-card layout for past trips with compact rows, same pattern as driver's `PastRideRow`.

**Desktop row columns:**

| Column | Content |
|--------|---------|
| Date | `{day} {Mon}` |
| Route | `{pickupArea} → {dropoffArea}` |
| Driver | Driver name |
| Fare | `₹{fare}` |
| CO₂ | `{co2g}g saved` |
| Status | Pill (COMPLETED / CANCELLED) |

**Mobile row:** Date · route area · fare on one line, status pill on right.

Tap anywhere on row → opens `BookingDetailSheet` (see §P6).

---

## P5. Stats Bar

3 chips, full-width strip, same visual style as driver stats bar:

| Chip | Value | Icon |
|------|-------|------|
| Total trips | count of COMPLETED bookings | car |
| Total spent | sum of `fare` for COMPLETED | wallet |
| CO₂ saved | sum across all COMPLETED trips | leaf |

### Passenger CO₂ formula

```js
// Per completed trip: sharing a ride displaces one car journey
// Each booked seat saves (km × 120g/km) — same 120g/km baseline as driver
function passengerCo2Saved(trips) {
  return trips
    .filter(t => t.status === 'COMPLETED' && t.pickupLat && t.dropoffLat)
    .reduce((sum, t) => {
      const km = haversineKm(t.pickupLat, t.pickupLng, t.dropoffLat, t.dropoffLng);
      return sum + km * 120; // grams
    }, 0);
}
// Display: if >= 1000g → "{(val/1000).toFixed(1)} kg", else "{Math.round(val)} g"
```

`haversineKm` is the same helper used in driver screen (extract to `src/utils/rideCalc.js`).

---

## P6. BookingDetailSheet

Slide-up overlay (same mechanics as driver's `RideDetailSheet`):

**Sections:**

1. **Route** — full pickup + dropoff labels with map markers
2. **Trip info** — departure date/time, booking status, booking ID
3. **Driver & vehicle** — driver name, vehicle number, vehicle type
4. **Fare** — `₹{fare}` paid, payment status if available
5. **CO₂ saved** — calculated value for this trip
6. **Passenger actions** — Rate driver (if completed + unrated), Download receipt (stub)

**Open/close:** tap past row → open. `×` button or `Escape` → close. Background overlay tap → close.

---

## P7. Virtual States (Passenger-side)

Derived from `booking.status` + `booking.scheduleStatus` + `departureTime`:

```
UPCOMING  = booking.status = CONFIRMED/ACTIVE AND scheduleStatus IN [CREATED, ACTIVE]
LIVE      = booking.status = CONFIRMED/ACTIVE AND scheduleStatus = STARTED
IMMINENT  = UPCOMING AND departureTime < now + 30min
OVERDUE   = UPCOMING AND departureTime < now - 30min (driver never started)
```

| Virtual state | Status pill | Pill tone |
|--------------|-------------|-----------|
| UPCOMING | "UPCOMING" | matched (yellow) |
| IMMINENT | "SOON" | amber |
| LIVE | "● LIVE" | live (red pulsing) |
| OVERDUE | "DELAYED" | cancelled |
| COMPLETED | "COMPLETED" | completed |
| CANCELLED | "CANCELLED" | cancelled |

---

## P8. Cancel Booking — Inline Confirmation

Replace `window.confirm` (current line 159) with inline card expansion:

```
"Cancel this booking?"
  Ride to {dropoffArea} on {date} at {time}
  ⚠ Cancellations may affect your reliability score
  [Yes, cancel]   [Keep booking]
```

- `[Yes, cancel]` → `DELETE /trips/{tripId}/bookings/{bookingId}`
- On success: move booking to past list with CANCELLED pill, toast "Booking cancelled"
- On failure: inline error "Failed to cancel. Try again.", button re-enables

---

## P9. Pre-Departure Notification Banner

Same mechanism as driver §14, adapted for passenger:

| Time to departure | Banner colour | Message |
|-------------------|--------------|---------|
| ≤ 30 min, > 15 min | Amber `#fff8e1` | "Your ride starts in {X} min — be at pickup" |
| ≤ 15 min, > 0 | Orange `#fff3e0` | "Ride starting soon — {X} min left" |
| 0 to -30 min | Red `var(--danger-50)` | "Driver may be delayed — check ride status" |

- CTA button: `[Track ride]` → navigate to `/tracking/{rideId}` (only if scheduleStatus = STARTED)
- Dismiss `×`: hides for current session (`localStorage` key `dismissed_passenger_imminent_{bookingId}`)

---

## P10. Cancel Window Validation

Passenger cannot cancel if `scheduleStatus = STARTED`. Cancel button hidden in that state.  
Show instead: "Ride is in progress — you cannot cancel now."

If driver has already cancelled (scheduleStatus = CANCELLED but booking still ACTIVE): auto-surface as cancelled on next load. No manual action needed.

---

## P11. Rating Guard

`[Rate driver]` button only shown when:
- `booking.status = COMPLETED`
- `booking.hasRated !== true`

Backend must return `hasRated: boolean` in booking response, OR:  
Frontend fallback: store rated bookingIds in localStorage key `rated_bookings` as `Set<bookingId>`. Check before showing button. Write to set after successful rating navigation.

---

## P12. Polling / Auto-Refresh

Same rules as driver §22:

1. `visibilitychange` → re-fetch when tab regains focus
2. Poll every **30 seconds** while any booking has `scheduleStatus = STARTED`
3. No polling otherwise

```js
useEffect(() => {
  const onVisible = () => { if (!document.hidden) load(); };
  document.addEventListener('visibilitychange', onVisible);
  return () => document.removeEventListener('visibilitychange', onVisible);
}, []);

useEffect(() => {
  if (!bookings.some(b => b.scheduleStatus === 'STARTED')) return;
  const id = setInterval(load, 30_000);
  return () => clearInterval(id);
}, [bookings]);
```

---

## P13. Toast Messages

Same toast system as driver §24. Messages:

| Action | Toast | Colour | Duration |
|--------|-------|--------|----------|
| Booking cancelled | "Booking cancelled" | Grey | 3s |
| Cancel failed | "Failed to cancel. Try again." | Red | 5s |
| Rating submitted | "Thanks! Rating saved" | Green | 3s |

---

## P14. Map Wiring (Desktop)

```js
const mapBooking = bookings.find(b => b.id === selectedBookingId);
const mapPickup  = mapBooking ? { lat: mapBooking.pickupLat,  lng: mapBooking.pickupLng,  label: mapBooking.pickupLabel  } : null;
const mapDropoff = mapBooking ? { lat: mapBooking.dropoffLat, lng: mapBooking.dropoffLng, label: mapBooking.dropoffLabel } : null;
```

`selectedBookingId` set to first active booking on load. Clicking a different active card updates it.

---

## P15. Files Changed

| File | Action |
|------|--------|
| `src/screens/PassengerTripsScreen.jsx` | Major rewrite |
| `src/components/BookingDetailSheet.jsx` | New file (mirrors RideDetailSheet) |
| `src/utils/rideCalc.js` | New file — shared `haversineKm`, `formatCo2`, `passengerCo2Saved`, `driverCo2Saved` |

**Reused unchanged:**
- `RoutePreviewMap.jsx`
- `WpAppBar`, `WpButton`, `WpPill`, `WpIcon`
- `useIsDesktop`
- `getMyBookings`, `cancelBooking`
