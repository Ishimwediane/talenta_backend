# Setting Up Render Database Connection

## Step 1: Get Your Render Database URL

1. Go to your Render dashboard (https://dashboard.render.com)
2. Navigate to your database service (named "talenta")
3. Click on the database service
4. Find the "Connection String" or "Internal Database URL"
5. Copy the connection string. It should look like:
   ```
   postgresql://username:password@dpg-xxxxx-a/talenta
   ```

## Step 2: Update Your .env File

1. Open `talenta_backend/.env` file
2. Update the `DATABASE_URL` with your Render database connection string:

```env
# Database Configuration
DATABASE_URL="postgresql://username:password@dpg-xxxxx-a/talenta?sslmode=require"
```

**Important Notes:**
- Render databases require SSL, so add `?sslmode=require` at the end
- If your password contains special characters, make sure to URL-encode them
- Use the **Internal Database URL** if your backend is also on Render, or **External Database URL** if running locally

## Step 3: Run Database Migrations

After updating your DATABASE_URL, run these commands:

```bash
cd talenta_backend

# Generate Prisma Client
npm run db:generate

# Push schema to database (creates tables)
npm run db:push

# OR use migrations (recommended for production)
npm run db:migrate
```

## Step 4: Verify Connection

Test the connection by starting your server:

```bash
npm run dev
```

You should see:
```
✅ Connected to PostgreSQL database
```

## Troubleshooting

### Connection Issues

If you get connection errors:

1. **Check SSL Mode**: Make sure `?sslmode=require` is in your DATABASE_URL
2. **Check Firewall**: If connecting from outside Render, ensure your IP is whitelisted
3. **Check Credentials**: Verify username and password are correct
4. **Check Database Name**: Ensure the database name matches (should be "talenta")

### Migration Issues

If migrations fail:

1. **Clear existing data** (if needed):
   ```bash
   npx prisma migrate reset
   ```

2. **Create fresh migration**:
   ```bash
   npx prisma migrate dev --name init
   ```

3. **Apply migrations**:
   ```bash
   npx prisma migrate deploy
   ```

## Environment Variables for Render

If deploying your backend to Render as well, add these environment variables in Render dashboard:

- `DATABASE_URL` - Your Render database connection string
- `JWT_SECRET` - Your JWT secret key
- `NODE_ENV` - Set to `production`
- `PORT` - Usually set automatically by Render
- `FRONTEND_URL` - Your frontend URL (e.g., `https://your-app.onrender.com`)

## Connection String Format

Render PostgreSQL connection strings typically look like:
```
postgresql://username:password@dpg-xxxxx-a.oregon-postgres.render.com/talenta?sslmode=require
```

Or for internal connections:
```
postgresql://username:password@dpg-xxxxx-a/talenta?sslmode=require
```

