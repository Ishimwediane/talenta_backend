# Talenta Backend API

Backend API for Talenta - Rwandan Youth Creative Platform. Built with Node.js, Express, and PostgreSQL.

## 🚀 Features

- **User Authentication**: Registration, login, email verification, password reset
- **JWT Token Management**: Secure token-based authentication
- **Input Validation**: Comprehensive validation using express-validator
- **Error Handling**: Standardized error responses
- **Security**: Helmet, CORS, rate limiting
- **Database**: PostgreSQL with Prisma ORM
- **ES6 Modules**: Modern JavaScript syntax

## 📁 Project Structure

```
backend/
├── prisma/              # Database schema and migrations
│   └── schema.prisma    # Prisma schema definition
├── lib/                 # Library configurations
│   └── prisma.js        # Prisma client configuration
├── controllers/         # Route controllers
│   └── auth.controller.js # Authentication logic
├── services/           # Business logic
│   └── auth.service.js # Authentication service
├── routes/             # API routes
│   ├── auth.routes.js  # Authentication endpoints
│   ├── user.routes.js  # User management endpoints
│   └── content.routes.js # Content management endpoints
├── middleware/         # Custom middleware
│   ├── auth.middleware.js    # Authentication middleware
│   └── validation.middleware.js # Input validation
├── utils/             # Utility functions
│   └── apiResponse.js # Standardized API responses
├── server.js         # Main server file
├── package.json      # Dependencies and scripts
└── env.example       # Environment variables template
```

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env
   ```
   Edit `.env` with your configuration values.

4. **Set up the database**
   ```bash
   # Generate Prisma client
   npm run db:generate
   
   # Push schema to database (for development)
   npm run db:push
   
   # Or run migrations (for production)
   npm run db:migrate
   ```

5. **Start the server**
   ```bash
   # Development
   npm run dev
   
   # Production
   npm start
   ```

## 🔧 Environment Variables

Create a `.env` file with the following variables:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
DATABASE_URL="postgresql://username:password@localhost:5432/talenta?schema=public"

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=7d

# Frontend URL
FRONTEND_URL=http://localhost:3000
```

## 📚 API Endpoints

### Authentication

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "password": "SecurePass123!",
  "confirmPassword": "SecurePass123!"
}
```

#### Login User
```http
POST /api/auth/login
Content-Type: application/json

{
  "emailOrPhone": "john@example.com",
  "password": "SecurePass123!"
}
```

#### Verify Email
```http
GET /api/auth/verify-email/:token
```

#### Forgot Password
```http
POST /api/auth/forgot-password
Content-Type: application/json

{
  "emailOrPhone": "john@example.com"
}
```

#### Reset Password
```http
POST /api/auth/reset-password/:token
Content-Type: application/json

{
  "newPassword": "NewSecurePass123!",
  "confirmPassword": "NewSecurePass123!"
}
```

#### Get Current User
```http
GET /api/auth/me
Authorization: Bearer <token>
```

#### Refresh Token
```http
POST /api/auth/refresh-token
Authorization: Bearer <token>
```

#### Logout
```http
POST /api/auth/logout
Authorization: Bearer <token>
```

### Health Check
```http
GET /api/health
```

## 🔐 Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## 📝 Validation Rules

### Registration
- **firstName**: Required, 2-50 characters, letters and spaces only
- **lastName**: Required, 2-50 characters, letters and spaces only
- **email**: Optional, valid email format
- **phone**: Optional, valid phone number format
- **password**: Required, minimum 8 characters, must contain uppercase, lowercase, number, and special character
- **confirmPassword**: Must match password

### Login
- **emailOrPhone**: Required, valid email or phone number
- **password**: Required

## 🚨 Error Handling

All errors follow a standardized format:

```json
{
  "status": "error",
  "message": "Error description",
  "errors": [
    {
      "field": "email",
      "message": "Please enter a valid email address"
    }
  ],
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## 🔒 Security Features

- **Password Hashing**: bcryptjs with salt rounds
- **JWT Tokens**: Secure token-based authentication
- **Input Validation**: Comprehensive validation rules
- **CORS**: Configurable cross-origin requests
- **Helmet**: Security headers
- **Rate Limiting**: Protection against brute force attacks
- **Account Locking**: Temporary lock after failed login attempts

## 🗄️ Database Schema

### User Model
- Basic info: firstName, lastName, email, phone
- Authentication: password, verification tokens
- Profile: bio, location, dateOfBirth, gender, interests
- Social: social media links (related table)
- Security: login attempts, account lock, verification status
- Stats: earnings, views, likes, shares, content count (related tables)
- Timestamps: createdAt, updatedAt, lastLogin

### Related Models
- **SocialLinks**: User social media profiles
- **Earnings**: User earnings tracking
- **UserStats**: User statistics and metrics
- **Content**: User uploaded content
- **UserInterest**: Many-to-many relationship for user interests

## 🚧 Future Enhancements

- [ ] Google OAuth integration
- [ ] Facebook OAuth integration
- [ ] SMS verification with Twilio
- [ ] Email service integration
- [ ] File upload functionality
- [ ] Content management system
- [ ] Payment integration
- [ ] Real-time notifications
- [ ] Analytics and reporting
- [ ] Admin dashboard

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the ISC License.

---

**Create in silence. Be heard worldwide.** 🌍✨ 