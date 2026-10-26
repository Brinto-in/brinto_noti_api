# Brinto notification API

A small Fastify + TypeScript API that can run locally or as a Vercel Node.js
Function.

## Local development

```sh
npm install
npm run dev
```

The health endpoint is `http://localhost:3000/`. The local server runs the test
job every 30 seconds. You can also trigger it manually with:

```sh
curl http://localhost:3000/api/cron
```

The endpoint returns a timestamp and writes a `Cron test executed` message to
the server logs.

## Vercel cron

Deploy the project to Vercel. The schedule in `vercel.json` calls `/api/cron`
once per minute (UTC), the shortest interval supported by Vercel Cron. Vercel
does not support 30-second cron schedules, and the one-minute interval requires
a plan that permits per-minute cron jobs. On the Hobby plan, change the schedule
to `0 12 * * *` (once daily) or use the endpoint URL to test it manually.
