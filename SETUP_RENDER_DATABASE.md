# Setting Up Render PostgreSQL Database

## ✅ Your Database Configuration

- **Database Name**: `talenta`
- **Username**: `talenta_user`
- **Internal URL**: `postgresql://talenta_user:q69IPhyQ61oBwSJfIYSmQYMaHj0Dbmdu@dpg-d44hqjadbo4c73evbabg-a/talenta`

## 📝 Step 1: Update Your .env File

1. Open `talenta_backend/.env` file
2. Update the `DATABASE_URL` with your Render database connection string:

```env
DATABASE_URL="postgresql://talenta_user:q69IPhyQ61oBwSJfIYSmQYMaHj0Dbmdu@dpg-d44hqjadbo4c73evbabg-a/talenta?sslmode=require"
```

**Important**: Added `?sslmode=require` at the end - this is **required** for Render databases!

## 🚀 Step 2: Generate Prisma Client

```bash
cd talenta_backend
npm run db:generate
```

This will generate the Prisma Client with the correct database connection.

## 📊 Step 3: Push Schema to Database

This will create all tables in your Render database:

```bash
npm run db:push
```

**OR** if you prefer to use migrations:

```bash
npm run db:migrate
```

## ✅ Step 4: Verify Connection

Start your server:

```bash
npm run dev
```

You should see:
```
✅ Connected to PostgreSQL database
```

## 🌱 Step 5: Seed Database (Optional)

If you want to seed initial data (categories, etc.):

```bash
npm run seed
```

## 🔍 Troubleshooting

### Connection Issues

If you get connection errors:

1. **Check SSL Mode**: Make sure `?sslmode=require` is in your DATABASE_URL
2. **Check Firewall**: Render databases are accessible from anywhere, but if issues persist, check Render dashboard
3. **Verify Credentials**: Double-check username and password in Render dashboard

### Migration Issues

If migrations fail:

1. **Reset database** (⚠️ WARNING: This deletes all data):
   ```bash
   npm run db:reset
   ```

2. **Create fresh migration**:
   ```bash
   npm run migrate
   ```

3. **Apply migrations**:
   ```bash
   npm run db:migrate
   ```

## 📋 Environment Variables for Render (If deploying backend)

If you're also deploying your backend to Render, add these environment variables in Render dashboard:

- `DATABASE_URL` - Your Render database connection string (same as above)
- `JWT_SECRET` - Your JWT secret key
- `NODE_ENV` - Set to `production`
- `PORT` - Usually set automatically by Render (default: 5000)
- `FRONTEND_URL` - Your frontend URL

## 🔐 Security Notes

- Never commit your `.env` file to Git
- Keep your database password secure
- Use environment variables in production
- Consider using Render's environment variable management for secrets

## ✨ Next Steps

After successful connection:

1. ✅ Database is connected
2. ✅ Tables are created
3. ✅ You can start using the application
4. ✅ All data will be stored in Render database

