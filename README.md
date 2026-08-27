# Marketly — Product Multi-Filter Sidebar

A demo-ready e-commerce catalog with an instant, combinatorial filter sidebar. Category, price, rating, and sorting controls are connected to a server-side catalog API.

## Features

- Sticky category checklist, dual-handle price range, and minimum rating controls (1–5 stars)
- Instant filtering on every interaction, with combined/intersection logic
- Sorting after filtering: Featured, Price: Low to High, and Top Rated First
- Responsive product grid with images, category, price, rating, and review count
- Empty result state with a Reset filters action
- API input validation and readable 400 error responses
- Mobile filter drawer

## Stack and structure

- Node.js 18+ and Express 4
- Vanilla HTML, CSS, and JavaScript frontend served by Express
- `server.js` — inventory, validation, filtering/sorting service, and API routes
- `public/index.html` — semantic page structure
- `public/styles.css` — responsive visual design
- `public/app.js` — UI state, API calls, and rendering

## Architecture

The browser owns presentation state and requests the catalog whenever a control changes. Express handles the request in `GET /api/catalog`; the server validates query parameters, filters the master inventory with AND logic, sorts the matched products, and returns JSON. The browser renders that response and shows loading, error, or empty states.

## Run locally

```bash
npm install
npm start
```

Open http://localhost:3000.

For development with automatic server restart:

```bash
npm run dev
```

## API

`GET /api/catalog/options` returns available categories and price bounds.

`GET /api/catalog` accepts:

```text
categories=Electronics,Apparel
minPrice=50
maxPrice=500
minRating=4
sort=featured|price-asc|rating-desc
```

Example:

```bash
curl "http://localhost:3000/api/catalog?categories=Electronics&minPrice=100&maxPrice=900&minRating=4&sort=rating-desc"
```

The server filters the master inventory first, then sorts the matched products. Empty or omitted filters return the complete inventory; an empty match returns `products: []` with HTTP 200 for the frontend empty state.

## Assumptions and limitations

The assessment does not specify a persistence layer or technology stack, so the inventory is an in-memory demo dataset and Express serves both frontend and backend. Product photos are loaded from Unsplash URLs and therefore need network access; the catalog/filtering behavior itself does not depend on those images.
