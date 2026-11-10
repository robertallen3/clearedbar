# ClearedBar

Next.js app for ClearedBar: marketing homepage plus email/password accounts stored in Neon Postgres.

## Routes

| Path         | What it is                                         |
| ------------ | -------------------------------------------------- |
| `/`          | Homepage (same design as the original `index.html`) |
| `/signup`    | Create an account (plan defaults to `free`)        |
| `/login`     | Log in                                             |
| `/dashboard` | Account info, AI school matching (reach / target / likely) and AI coach emails |

## Environment variables

| Name            | Where it comes from                                            |
| --------------- | -------------------------------------------------------------- |
| `DATABASE_URL`  | Added automatically when you connect Neon in Vercel → Storage |
| `DEMO_EMAIL`    | You set it in Vercel (e.g. `demo@demo.com`)                    |
| `DEMO_PASSWORD` | You set it in Vercel                                           |
| `ANTHROPIC_API_KEY` | Your Anthropic API key, set in Vercel (powers the AI feature) |
| `STRIPE_SECRET_KEY` | Stripe secret key (`sk_test_…` in test mode), set in Vercel |
| `STRIPE_WEBHOOK_SECRET` | Signing secret of the Stripe webhook for `/api/stripe/webhook` |

No secrets live in the code. See `.env.example`.

## AI feature

On the dashboard, athletes enter their event, PR, grad year, GPA and preferences. Claude
(`lib/ai.ts`) returns real college programs sorted into reach / target / likely, and drafts a
personalized email to each program's event coach. Free plan: 1 search with 3 schools and 1
email. Pro: unlimited searches (10 schools each) and unlimited emails. Results are saved in
the `match_runs` and `coach_emails` tables.

## Payments (Stripe)

Free users see **Upgrade to Pro** on the dashboard, which opens Stripe Checkout for a
$9.99/month subscription (`app/billing/actions.ts`). After paying, Stripe sends them to
`/billing/success`, which confirms the session with Stripe and sets `plan = 'pro'`. The webhook
at `/api/stripe/webhook` also handles `checkout.session.completed` and moves users back to
`free` when their subscription is canceled.

Test card in Stripe test mode: `4242 4242 4242 4242`, any future date, any CVC.

## Database

`npm run build` runs `scripts/migrate.mjs` first. It creates the `users` and `sessions`
tables if they don't exist, and creates or updates the demo account (plan `pro`) when
`DEMO_EMAIL` and `DEMO_PASSWORD` are set. It's safe to run repeatedly; you can also run it
yourself with `npm run db:migrate`.

Passwords are hashed with bcrypt (cost 12). Sessions are random tokens in an httpOnly
cookie; only a SHA-256 of each token is stored in the database.

To change someone's plan, run in the Neon SQL editor:

```sql
UPDATE users SET plan = 'pro' WHERE email = 'someone@example.com';
```

## Local development

```bash
npm install
vercel env pull .env.local   # or copy .env.example to .env.local and fill it in
node --env-file=.env.local scripts/migrate.mjs
npm run dev
```
