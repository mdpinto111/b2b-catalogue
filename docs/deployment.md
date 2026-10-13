# Deployment

Two tested setups, both of which can run on free tiers.

## Option A: VPS with Docker Compose and Caddy

Any Linux host with Docker works. On Oracle Cloud "Always Free", for example, a
`VM.Standard.A1.Flex` instance is enough. A free DuckDNS subdomain can provide the
domain name.

1. **Open ports 80 and 443** in the cloud firewall (security list or security group)
   and on the host:
   ```bash
   sudo ufw allow OpenSSH && sudo ufw allow 80/tcp && sudo ufw allow 443/tcp && sudo ufw enable
   ```
2. **Point a domain** to the server's public IP and check it resolves:
   `nslookup your-subdomain.duckdns.org`.
3. **Install Docker**:
   ```bash
   curl -fsSL https://get.docker.com | sudo sh
   sudo usermod -aG docker $USER && newgrp docker
   ```
4. **Configure**:
   ```bash
   git clone https://github.com/mdpinto111/b2b-catalogue.git && cd b2b-catalogue
   cp .env.production.example .env
   openssl rand -hex 32   # use as SESSION_SECRET
   nano .env
   ```
5. **Start**. Caddy obtains a Let's Encrypt certificate automatically, and the app
   applies pending Prisma migrations on startup:
   ```bash
   docker compose -f docker-compose.prod.yml up -d --build
   ```
6. **Create the admin account** once, from `ADMIN_EMAIL` / `ADMIN_PASSWORD`:
   ```bash
   docker compose -f docker-compose.prod.yml exec app npx tsx prisma/seed.prod.ts
   ```

Maintenance:

```bash
docker compose -f docker-compose.prod.yml logs -f app                       # logs
git pull && docker compose -f docker-compose.prod.yml up -d --build         # update
docker compose -f docker-compose.prod.yml exec db pg_dump -U catalogue catalogue > backup.sql
cat backup.sql | docker compose -f docker-compose.prod.yml exec -T db psql -U catalogue catalogue
```

## Option B: Vercel and Neon (serverless)

1. Create a Neon project and copy the **pooled** connection string (the host contains
   `-pooler`). Serverless functions need the pooled endpoint.
2. Import the repository into Vercel and set these environment variables:

   | Name | Value |
   |------|-------|
   | `DATABASE_URL` | Neon pooled connection string |
   | `SESSION_SECRET` | `openssl rand -hex 32` |
   | `MAILTRAP_API_TOKEN` | Mailtrap API token |
   | `MAIL_FROM` | e.g. `Catalogue <hello@your-domain>` |
   | `OWNER_EMAIL` | Address that receives every order |

3. Deploy. `vercel.json` runs `prisma migrate deploy` before the build, so the schema
   is created on the first deployment.
4. Create the admin account from your machine, pointing at the Neon database:
   ```bash
   DATABASE_URL="<pooled url>" ADMIN_EMAIL="admin@your-domain" ADMIN_PASSWORD="<strong>" \
     npx tsx prisma/seed.prod.ts
   ```

Every push to `main` then redeploys, including pending migrations.

Notes:
- Vercel's Hobby plan is meant for non-commercial use. A real business should move to Pro.
- Neon's free tier suspends idle databases, so the first request after a pause takes about a second longer.
