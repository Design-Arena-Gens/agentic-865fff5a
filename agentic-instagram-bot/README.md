## Instagram DM Agent

Automate direct messages to anyone who follows your Instagram account or likes one of your posts. This dashboard lets you configure message templates, manage Meta credentials, inspect delivery logs, and manually trigger retries.

### Features

- Webhook endpoint (`/api/instagram/webhook`) for Meta Messenger API for Instagram.
- Customizable DM templates with `{{username}}` placeholder support.
- Toggle automation separately for new followers and likes.
- Message delivery log with success and error tracking.
- Manual controls for rerunning the processor and sending test DMs.

### Prerequisites

- Instagram Business Account connected to a Facebook Page.
- Meta App with Messenger API for Instagram enabled.
- Long-lived Instagram access token with `instagram_manage_messages` and `pages_messaging` permissions.
- Database connection string supplied through `DATABASE_URL` (SQLite for local development, Postgres/MySQL in production).

### Local Setup

```bash
npm install
cp .env.example .env.local # update values
npx prisma db push
npm run dev
```

Visit `http://localhost:3000` to open the dashboard.

### Webhook Configuration

1. Set the verify token in the dashboard or `.env.local`.
2. Point your Meta webhook subscription to `<your-domain>/api/instagram/webhook`.
3. For signature validation, set `INSTAGRAM_APP_SECRET` to your Meta App secret.

### Vercel Deployment

Provide the following environment variables in Vercel:

- `DATABASE_URL`
- `INSTAGRAM_APP_SECRET` (optional but recommended)
- Any secrets for your database provider

Deploy via:

```bash
vercel deploy --prod --yes --token $VERCEL_TOKEN --name agentic-865fff5a
```

### Scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Start the Next.js development server |
| `npm run build` | Create an optimized production build |
| `npm start` | Run the production server |
| `npm run lint` | Lint all source files |
| `npm run prisma:generate` | Re-generate Prisma client |
| `npm run prisma:db-push` | Push Prisma schema to the database |
