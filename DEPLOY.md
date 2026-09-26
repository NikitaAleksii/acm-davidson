# Deploying the ACM Davidson website

The site is one Node.js server with a SQLite database file and an uploads folder. It needs a
host that gives you a **persistent disk**, **HTTPS**, and lets you set **environment
variables**. The repo ships with a `Dockerfile`, so any Docker-based host works.

Recommended: **Railway** (simplest, about $5/month, deploys from GitHub, automatic HTTPS).
Alternatives at the end: Fly.io, Render, a VPS with Docker Compose.

## What you need before you start

1. **The code on GitHub.** From the project folder:
   ```bash
   git remote add origin https://github.com/YOUR-ORG/acm-davidson.git
   git push -u origin main
   ```
   (Create an empty repo on GitHub first. Private is fine. `.env` and the database are
   git-ignored, so no secrets are pushed.)

2. **An SMTP account for outgoing email.** This is required: admin sign-in codes and
   password-reset links are emailed, and contact-form messages are forwarded. Pick one:
   - **Brevo** (free, 300 emails/day, no domain needed): sign up at brevo.com, then
     Settings → SMTP & API → create an SMTP key. Host `smtp-relay.brevo.com`, port `587`,
     user = your Brevo login email, pass = the SMTP key. Verify the sender address you'll use
     in `SMTP_FROM`.
   - **Gmail** (personal account, 500/day): turn on 2-step verification, create an
     App Password (myaccount.google.com/apppasswords). Host `smtp.gmail.com`, port `587`,
     user = your Gmail address, pass = the 16-character app password. `SMTP_FROM` must be
     that Gmail address.
   - **Davidson Microsoft 365** (the `acm@davidson.edu` mailbox): host `smtp.office365.com`,
     port `587`, user/pass = the mailbox login. IT must have "SMTP AUTH" enabled for the
     mailbox; ask T&I if sends fail with an authentication error.

3. **A strong owner password** (10+ characters). You'll set it as `ADMIN_PASSWORD`. The
   first start creates your owner account from it if the database is empty.

## Railway (recommended)

1. Go to railway.com, sign in with GitHub, **New Project → Deploy from GitHub repo**, pick
   `acm-davidson`. Railway detects the `Dockerfile` and starts building.

2. **Add a volume** so data survives redeploys: click the service → **Settings → Volumes →
   Add Volume**, mount path **`/data`**.

3. **Set variables**: service → **Variables → Raw Editor**, paste and edit:
   ```
   DATABASE_URL=file:/data/acm.db
   UPLOAD_DIR=/data/uploads
   NEXT_PUBLIC_SITE_URL=https://acm-davidson.up.railway.app
   CHAPTER_EMAIL=acm@davidson.edu
   SMTP_HOST=smtp-relay.brevo.com
   SMTP_PORT=587
   SMTP_USER=you@example.com
   SMTP_PASS=your-smtp-key
   SMTP_FROM=ACM Davidson Website <acm@davidson.edu>
   ADMIN_EMAIL=nialeksii@davidson.edu
   ADMIN_NAME=Nikita
   ADMIN_PASSWORD=a-long-password-you-choose
   ```
   Use the real public URL for `NEXT_PUBLIC_SITE_URL` once you know it (next step), then
   redeploy so it's baked into the build.

4. **Get a URL**: **Settings → Networking → Generate Domain**. You get
   `something.up.railway.app` with HTTPS. Put that in `NEXT_PUBLIC_SITE_URL` and redeploy
   (**Deployments → ⋮ → Redeploy**).

5. **Check the logs** (Deployments → View logs). You should see:
   ```
   [start] applying database migrations
   [bootstrap] created owner account nialeksii@davidson.edu
   [start] starting Next.js on port 3000
   ```
   Any `[bootstrap] WARNING` line tells you exactly which variable to fix.

6. **Sign in** at `https://your-domain/admin/login`, enter the emailed code, go to
   **Admins** and change your password. Then add the other officers.

7. **Custom domain (optional)**: **Settings → Networking → Custom Domain**, enter e.g.
   `acmdavidson.org` or `www.acmdavidson.org`. Railway shows a CNAME record; add it at your
   registrar (Namecheap, Cloudflare, etc.). HTTPS is automatic. Update `NEXT_PUBLIC_SITE_URL`
   and redeploy. For a `davidson.edu` subdomain, ask Davidson T&I to create the CNAME.

Every `git push` to `main` redeploys automatically. Migrations run on every start, so
schema changes ship safely.

**Cost**: Railway's Hobby plan is $5/month and includes $5 of usage; this site uses well under
that. Put the subscription on the chapter's card, not a personal one.

## Backups

- **Database**: Admins page → **Download backup** (owners only). Do this before big changes and
  once a semester. It's a single `.db` file; restoring means copying it to `/data/acm.db`.
- **Uploaded images**: on Railway, service → Volumes → ⋮ → Backups (paid feature), or keep
  originals elsewhere. Images are also optional: admins can paste image URLs instead.

## Handing over to next year's officers

1. Transfer the Railway project (Project → Settings → Transfer) and the GitHub repo to the
   new webmaster's account, or keep both under a shared chapter account.
2. In the dashboard, add the new officers as admins, make one of them an owner
   (`npm run create-admin -- email "Name" "password" owner` in Railway's shell, or ask me to add a
   "promote" button), then remove people who graduated.
3. Rotate the SMTP key and the owner password.

## Alternatives

### Fly.io
```bash
fly launch --no-deploy          # accept the Dockerfile; say no to Postgres
fly volumes create data --size 1 --region iad
```
Add to `fly.toml`:
```toml
[mounts]
  source = "data"
  destination = "/data"
[http_service]
  internal_port = 3000
  force_https = true
```
Then `fly secrets set DATABASE_URL=file:/data/acm.db UPLOAD_DIR=/data/uploads SMTP_HOST=... ADMIN_EMAIL=... ADMIN_PASSWORD=... NEXT_PUBLIC_SITE_URL=https://acm-davidson.fly.dev` and `fly deploy`.

### Render
New → Web Service → connect the repo → Runtime: Docker. Add a **Disk** mounted at `/data`
(disks require the Starter plan). Set the same environment variables as above.
Health check path: `/api/health`.

### A VPS (DigitalOcean, Hetzner, a department server)
Install Docker, clone the repo, `cp .env.example .env`, fill it in, then:
```bash
docker compose up -d --build
```
The site listens on port 3000; put Caddy or nginx in front for HTTPS. Caddyfile example:
```
acmdavidson.org {
    reverse_proxy localhost:3000
}
```

### Vercel / Netlify
Not without changes: they have no persistent disk, so SQLite and local uploads won't work.
You'd need Postgres (Neon) and blob storage. Possible, but Railway is far less work for this
site.

## Checklist before announcing the site

- [ ] `https://` URL loads and the padlock shows
- [ ] `NEXT_PUBLIC_SITE_URL` matches that URL (check a post's link preview in Slack/iMessage)
- [ ] Admin sign-in code arrives by email within a minute
- [ ] Contact form message arrives at `CHAPTER_EMAIL`
- [ ] Owner password changed from the initial value
- [ ] Sample officers replaced with real ones; sample post edited or deleted
- [ ] `/api/health` returns `{"ok":true}`
- [ ] A backup downloaded and stored somewhere safe
