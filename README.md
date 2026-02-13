# Mistika - E-commerce Platform

This is a [Next.js](https://nextjs.org) e-commerce platform built with TypeScript and Firebase (Firestore).

## Getting Started

### 1. Environment Setup

First, create a `.env` file in the root directory by copying the example:

```bash
cp .env.example .env
```

Then, edit `.env` with your local values. The required variables are:

- `JWT_SECRET` - Secret key for JWT token signing
- `JWT_EXPIRES_IN` - Token expiration time (default: `8h`)

Firebase is configured in `src/firebase/firebase.ts`. For production, use environment variables and update that file as needed.

**Never commit `.env` to version control.**

### 2. Data (Firebase Firestore)

The app uses **Firebase Firestore** as the database. Collections:

- `admins` – Admin users for login
- `categories` – Product categories
- `products` – Products
- `orders` – Orders
- `order_items` – Order line items

Configure your Firebase project and set the client config in `src/firebase/firebase.ts` (or via env vars). No local database or Docker is required.

Use the Firebase Console to view and edit Firestore data: [Firebase Console](https://console.firebase.google.com).

### 3. Run the Development Server

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## Project Structure

```
├── app/                    # Next.js app directory
│   ├── (webapp)/          # Web application routes
│   │   ├── admin/         # Admin panel (protected)
│   │   ├── cart/          # Shopping cart
│   │   └── orders/        # Order management
│   └── api/               # API routes
│       ├── auth/          # Authentication endpoints
│       ├── products/      # Product management
│       ├── categories/    # Category management
│       └── orders/        # Order management
├── src/
│   ├── components/        # React components
│   ├── firebase/          # Firebase config and repository
│   ├── lib/               # Utility libraries
│   │   └── auth/          # Authentication modules
│   ├── store/             # Redux store
│   └── views/             # Page views
└── proxy.ts               # Next.js proxy (subdominio admin + auth API)
```

## Deploy en Vercel (subdominio admin)

Para que **admin.tudominio.vercel.app** funcione (panel de administración):

1. **Añadir el dominio en Vercel**
   - En el dashboard: tu proyecto → **Settings** → **Domains**.
   - Pulsa **Add** e introduce: `admin.mistika-seven.vercel.app` (o tu subdominio).
   - Acepta; Vercel asignará el mismo deployment a ese dominio.

2. **Variables de entorno en producción**
   - `NEXT_PUBLIC_SITE_URL` = URL del sitio de ventas (raíz), ej: `https://mistika-seven.vercel.app`.
   - Así "Ver tienda" desde el admin redirige al sitio correcto.

Sin añadir el subdominio en **Domains**, Vercel no enruta esa URL a tu proyecto y verás error de página.

## Learn More

To learn more about Next.js, look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
