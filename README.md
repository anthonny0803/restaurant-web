# restaurant-web

Client-facing SPA for a restaurant reservation system. Browse menus, book tables, pay deposits via Stripe, pre-order meals and manage reservations.

## Stack

- React 19
- TypeScript
- Vite
- React Router
- Stripe.js

## Setup

```bash
cp .env.example .env   # set your VITE_API_URL and VITE_STRIPE_PUBLIC_KEY
npm install
npm run dev            # http://localhost:5173
```

## API

Consumes the REST API at `http://localhost:8000/api` (see [restaurant-api](https://github.com/anthonny0803/restaurant-api)).
