# Brinto notification API

A small Fastify + TypeScript API that can run locally or as a Vercel Node.js
Function.

## Local development

```sh
npm install
npm run dev
```

The health endpoint is `http://localhost:3000/`. The local server checks for
notifications every 10 seconds. You can also trigger it manually with:

```sh
curl http://localhost:3000/api/cron/jeemain
```

The endpoint scrapes the Public Notices list on the JEE Main homepage, returns
the notification titles and URLs with a timestamp, and logs the results. The
collector reports non-success HTTP responses and unexpected page markup as
errors rather than treating them as an empty notification list.

## Vercel cron

Deploy the project to Vercel. The only scheduled job in `vercel.json` calls
`/api/cron/jeemain` once per minute (UTC), the shortest interval supported by
Vercel Cron. Vercel does not support 10-second cron schedules, and the one-minute
interval requires a plan that permits per-minute cron jobs. On the Hobby plan,
change the schedule to `0 12 * * *` (once daily) or use the endpoint URL to test
it manually.
