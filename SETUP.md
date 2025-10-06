# Sprout Financial Literacy - Setup Guide

## Prerequisites

- Node.js 18+ and npm
- PostgreSQL database
- Resend account (for production emails)

## Quick Start

### 1. Clone and Install

```bash
npm install
```

### 2. Configure Environment

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` with your values:

```env
# Database - Replace with your PostgreSQL connection string
DATABASE_URL="postgresql://username:password@localhost:5432/sprout_db?schema=public"

# JWT Secret - Generate a random 64-character string
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"

# Email (Resend) - Get API key from https://resend.com
RESEND_API_KEY="re_..."
RESEND_FROM_EMAIL="Sprout <noreply@yourdomain.com>"

# Application URL
NEXT_PUBLIC_BASE_URL="http://localhost:3000"

# Environment
NODE_ENV="development"
```

### 3. Set Up Database

Run migrations to create database schema:

```bash
npx prisma migrate dev
```

Seed the database with sample data:

```bash
npm run seed
```

### 4. Start Development Server

```bash
npm run dev
```

Visit `http://localhost:3000`

## Demo Accounts

After seeding, use these accounts to login:

- **Student**: `demo.student@msu.edu` / `Demo123!`
- **Teacher**: `demo.teacher@msu.edu` / `Demo123!`
- **Super Admin**: `admin@sprout.edu` / `Demo123!`

## Email Setup

### Development Mode
- Emails print to console
- No API key required

### Production Mode
1. Sign up at [Resend](https://resend.com)
2. Get API key from dashboard
3. Verify your sending domain
4. Add credentials to `.env`

## Database Management

### View Database
```bash
npx prisma studio
```

### Reset Database
```bash
npx prisma migrate reset
```

### Create Migration
```bash
npx prisma migrate dev --name description_of_changes
```

## Deployment

### Environment Variables

Set these in your production environment:

- `DATABASE_URL` - Production PostgreSQL URL
- `JWT_SECRET` - Strong random secret (64+ characters)
- `RESEND_API_KEY` - Production Resend API key
- `RESEND_FROM_EMAIL` - Verified sender email
- `NEXT_PUBLIC_BASE_URL` - Your production URL
- `NODE_ENV="production"`

### Build

```bash
npm run build
npm start
```

### Recommended Platforms

- **Vercel** - Easiest for Next.js
- **Railway** - Includes PostgreSQL database
- **Render** - Good free tier
- **AWS/GCP** - Enterprise deployment

## Troubleshooting

### Database Connection Issues
- Ensure PostgreSQL is running
- Check DATABASE_URL format
- Verify database exists

### Email Not Sending
- Check RESEND_API_KEY is set
- Verify domain in Resend dashboard
- In development, emails log to console

### Build Errors
- Delete `node_modules` and run `npm install`
- Clear Next.js cache: `rm -rf .next`
- Regenerate Prisma client: `npx prisma generate`

## Next Steps

1. **Add Content**: Create lessons for more courses
2. **Customize Branding**: Update school colors and logos
3. **Configure Email**: Set up production email service
4. **Test Workflows**: Enroll students and assign courses
5. **Deploy**: Choose a hosting platform and deploy

## Support

- Issues: GitHub Issues
- Documentation: `/docs` folder
- Email: support@sprout.edu
