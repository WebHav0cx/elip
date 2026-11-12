# ELIP

Election logistics dashboard built with React, TypeScript, Vite and Tailwind CSS.

## Development

- `npm install` installs dependencies.
- `npm run dev` starts the development server.
- `npm run build` checks TypeScript and builds the production app.
- `npm run lint` checks source code with ESLint.
- `npm run preview` serves the production build locally.

## Deployment

Vercel configuration lives in `vercel.json`. It builds the app with `npm run build`,
serves `dist`, and rewrites page requests to `index.html` so React Router can handle
direct links and page refreshes. Deploy from the repository root so Vercel reads
this configuration. Redeploy after changing it.

Other static hosts also need an SPA fallback to `index.html` for application routes.

## Mobile layouts

Navigation collapses below Tailwind's `lg` breakpoint. Phone layouts use readable text,
larger touch controls and delivery cards; desktop layouts retain their tables. Wide workspace
tables scroll inside their panels. Dialogs fit the dynamic viewport, lock background scrolling,
keep focus inside, and support Escape to close. Login content remains scrollable on short screens.
Custom maximum-width variants are declared from widest to narrowest so phone rules win when
multiple breakpoints apply.

## Routing

Application URL patterns live in `src/routes.ts`. Use `ROUTES` for route definitions and
permission rules, and `buildRoute(ROUTES.MOVEMENT_MAP)` for navigation. The builder uses
React Router's `generatePath()` and infers required and optional parameters from the pattern.
Static routes require no parameter argument. Add new URL patterns to `ROUTES` first.

`src/app/router.ts` configures the browser router; `src/app/ProtectedApplication.tsx` handles
authentication and role access. The root URL redirects to sign-in. API endpoints stay in their
service modules.

Use `movementMapPath({ deliveryId, vehicleId })` for delivery map links. The map selects by
delivery first, preserves that selection in the URL, and focuses the journey rather than the
national view. Route overview fits the whole journey; Street detail focuses the vehicle and
the closest road segment.

Road geometry is requested only for the selected journey and cached for the session. The
default provider is the public OSRM routing service, using existing journey waypoints rather
than the user's live location. Configure `VITE_ROUTING_SERVICE_URL` with an OSRM-compatible
route endpoint for deployment. If it is unavailable, the map shows dashed waypoint geometry
with an availability message. Road routes are estimates; recorded GPS trails must come from
the tracking API.

## Styling

Application styling uses Tailwind CSS utilities directly in component `className` attributes.
Document defaults, heading styles, focus rings and mobile control sizing are declared on the
`body` in `index.html`. There are no separate TypeScript style modules. `src/index.css` defines
the Tailwind theme for exact typography, layout, shadow and animation values, plus SVG utilities.
Use standard utilities where available and named theme tokens for custom design values.
Responsive layouts use named Tailwind variants defined with `@custom-variant` in
`src/index.css`; their width cutoffs match the existing layouts.

Component composition and state use `data-slot` and `data-state` attributes with Tailwind
variants. `className` values contain only Tailwind utilities. Important utilities preserve the previous
cascade, including styles on nested elements. Runtime chart values use CSS custom properties
consumed by Tailwind width and height utilities.

Leaflet's package stylesheet is retained for its map engine, tiles, controls and popups. App
overrides use Tailwind utilities on the map container. Leaflet vector style options configure
map geometry through the library API.
