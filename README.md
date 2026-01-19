This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

### 1. Environment Setup

First, create a `.env` file in the root directory by copying the template:

```bash
cp env.template .env
```

Then, edit `.env` with your database configuration:

```env
DATABASE_HOST=localhost
DATABASE_PORT=3306
DATABASE_USER=appuser
DATABASE_PASSWORD=app123
DATABASE_NAME=mistika
DATABASE_ROOT_PASSWORD=root123

# Database URL for MariaDB (Prisma uses mysql:// protocol for MariaDB)
DATABASE_URL=mysql://appuser:app123@localhost:3306/mistika

# Docker MariaDB Configuration
MARIADB_ROOT_PASSWORD=root123
MARIADB_DATABASE=mistika
MARIADB_USER=appuser
MARIADB_PASSWORD=app123
```

### 2. Start Database with Docker

```bash
docker-compose up -d
```

This will start MariaDB using the configuration from your `.env` file.

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

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
