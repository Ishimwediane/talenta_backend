# Quick Setup: Connect to Render Database

## 🔑 Get Your Render Database Connection String

1. Go to https://dashboard.render.com
2. Click on your database service (named "talenta")
3. Copy the **Internal Database URL** or **External Database URL** depending on where your backend runs:
   - **Internal URL**: If your backend is also on Render
   - **External URL**: If your backend runs locally or elsewhere

## 📝 Update Your .env File

Open `talenta_backend/.env` and update the `DATABASE_URL`:

```env
DATABASE_URL="postgresql://username:password@dpg-xxxxx-a.oregon-postgres.render.com/talenta?sslmode=require"
```

**Important:**
- Replace with your actual Render database URL
- Add `?sslmode=require` at the end (required for Render)
- If password has special characters, URL-encode them

## 🚀 Run Database Setup

```bash
cd talenta_backend

# Generate Prisma Client
npm run db:generate

# Push schema to database (creates all tables)
npm run db:push

# OR use migrations (recommended for production)
npm run db:migrate
```

## ✅ Test Connection

Start your server:
```bash
npm run dev
```

You should see: `✅ Connected to PostgreSQL database`

## 🆘 Common Issues

**Connection refused?**
- Make sure `?sslmode=require` is in your DATABASE_URL
- Check if you're using the correct URL (Internal vs External)

**Schema errors?**
- Run `npm run db:push` to sync your schema
- Or run `npm run db:migrate` if you have migrations

**Need to reset?**
- Run `npm run db:reset` (⚠️ WARNING: This deletes all data!)

