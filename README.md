# Mistika - E-commerce Platform

This is a [Next.js](https://nextjs.org) e-commerce platform built with TypeScript, Prisma, and MariaDB.

## Getting Started

### 1. Environment Setup

First, create a `.env` file in the root directory by copying the example:

```bash
cp .env.example .env
```

Then, edit `.env` with your local values. The required variables are:

- `DATABASE_HOST` - Database host (default: `localhost`)
- `DATABASE_PORT` - Database port (default: `3306`)
- `DATABASE_USER` - Database user
- `DATABASE_PASSWORD` - Database password
- `DATABASE_NAME` - Database name (default: `mistika`)
- `DATABASE_URL` - Full Prisma connection string (format: `mysql://user:password@host:port/database`)
- `JWT_SECRET` - Secret key for JWT token signing
- `JWT_EXPIRES_IN` - Token expiration time (default: `8h`)

**Never commit `.env` to version control.**

### 2. Database Management

#### Start Database

Start MariaDB using Docker Compose:

```bash
docker-compose up -d
```

This will:
- Start MariaDB container in detached mode
- Create the database if it doesn't exist
- Run initialization scripts from `./mysql/` directory
- Mount a persistent volume for data storage

#### Stop Database

Stop the database container (data is preserved):

```bash
docker-compose stop
```

#### Restart Database

Restart the database container:

```bash
docker-compose restart
```

#### View Database Logs

View real-time logs from the database container:

```bash
docker-compose logs -f mariadb
```

#### Stop and Remove Database

Stop and remove the container (data is preserved in volume):

```bash
docker-compose down
```

#### Complete Database Reset

⚠️ **Warning**: This will delete all data!

Stop, remove container, and delete the volume:

```bash
docker-compose down -v
```

Then start fresh:

```bash
docker-compose up -d
```

#### Check Database Status

Check if the database is running:

```bash
docker-compose ps
```

#### Access Database CLI

Connect to MariaDB directly:

```bash
docker-compose exec mariadb mariadb -u root -p
```

Or using the app user:

```bash
docker-compose exec mariadb mariadb -u ${MARIADB_USER:-appuser} -p${MARIADB_PASSWORD:-app123} ${MARIADB_DATABASE:-mistika}
```

### 3. Database Schema

The database schema is managed with Prisma. After starting the database:

#### Generate Prisma Client

```bash
npx prisma generate
```

#### Apply Database Schema

If you have Prisma migrations:

```bash
npx prisma migrate dev
```

Or if you're using the SQL file directly (`mysql/mistika.sql`), it will be automatically executed when the container starts for the first time.

#### View Database in Prisma Studio

Open Prisma Studio to view and edit data:

```bash
npx prisma studio
```

This will open a web interface at `http://localhost:5555`

### 4. Run the Development Server

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
│   ├── lib/               # Utility libraries
│   │   └── auth/          # Authentication modules
│   ├── store/             # Redux store
│   └── views/             # Page views
├── prisma/                # Prisma schema
├── mysql/                 # SQL initialization scripts
└── middleware.ts          # Next.js middleware for auth
```

## Learn More

To learn more about Next.js, look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
