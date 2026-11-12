# React + TypeScript + Vite

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

Run `npm run check:styles` to check application class strings against Tailwind's compiler and
catch obsolete class names, class-based state selectors, arbitrary values, inline media variants and noncanonical
utility spellings. Selector variants and runtime chart variable references remain supported.
`MovementMap.tsx` is additionally checked against Tailwind's default theme to keep its
utilities independent of custom theme tokens.

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])

```

You can also install [eslint-plugin-react-x](https://npmx.dev/package/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://npmx.dev/package/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])

```
