# ClearedBar

Next.js app for ClearedBar: marketing homepage plus email/password accounts stored in Neon Postgres.

## Routes

| Path         | What it is                                         |
| ------------ | -------------------------------------------------- |
| `/`          | Homepage (same design as the original `index.html`) |
| `/signup`    | Create an account (plan defaults to `free`)        |
| `/login`     | Log in                                             |
| `/dashboard` | Shows your email and plan, with a Log out button   |

## Environment variables

| Name            | Where it comes from                                            |
| --------------- | -------------------------------------------------------------- |
| `DATABASE_URL`  | Added automatically when you connect Neon in Vercel → Storage |
| `DEMO_EMAIL`    | You set it in Vercel (e.g. `demo@demo.com`)                    |
| `DEMO_PASSWORD` | You set it in Vercel                                           |

No secrets live in the code. See `.env.example`.

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
