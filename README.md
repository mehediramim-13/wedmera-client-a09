# WedMera

WedMera is a wedding-planning marketplace for discovering local services and
managing bookings. Customers can explore vendors and follow their booking
requests; vendors can manage listings, bookings, and subscriptions; admins can
review marketplace activity.

## Requirements

- Node.js 20.9 or later
- npm
- The WedMera API running locally or at a configured URL
- MongoDB for Better Auth user and session storage

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env.local` and set the required values:

   ```dotenv
   NEXT_PUBLIC_API_URL=http://localhost:5000/api
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   BETTER_AUTH_URL=http://localhost:3000
   BETTER_AUTH_SECRET=<a-random-secret-at-least-32-characters>
   MONGODB_URL=<mongodb-connection-string>
   DB_NAME=wedmera
   GOOGLE_CLIENT_ID=<google-oauth-client-id>
   GOOGLE_CLIENT_SECRET=<google-oauth-client-secret>
   ```

   Use the same MongoDB database and user identifiers expected by the API.
   Configure the Google OAuth callback as
   `http://localhost:3000/api/auth/callback/google` for local development.
   For deployment, use the deployed app URL for `NEXT_PUBLIC_APP_URL` and
   `BETTER_AUTH_URL`, and add its Google OAuth callback URL. Keep secrets
   private and out of version control.

3. Start the development server:

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

## Available scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Next.js development server |
| `npm run lint` | Run ESLint |
| `npx tsc --noEmit` | Check TypeScript types |
| `npm run build` | Create a production build |
| `npm run start` | Serve the production build |

## Main features

- Public service discovery, category filters, service details, and booking
  requests
- Email/password and Google sign-in with customer and vendor roles
- Customer booking overview, request details, cancellation, and profile settings
- Vendor listing management, booking responses, profile settings, and Premium
  subscription checkout
- Admin overview, user access controls, service moderation, and transaction
  history
- Responsive dashboard navigation, light/dark themes, and shared loading,
  error, and not-found states

Admin accounts are provisioned by the platform and cannot be created through
public sign-up. Premium is displayed as $49/month. The API remains responsible
for the actual checkout amount and payment confirmation; Stripe secret and
webhook keys belong in the backend environment, never the frontend environment.
