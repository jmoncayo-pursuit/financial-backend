# Financial Backend API

Backend service for the Financial Tracking Application. Provides authentication endpoints and database management for user accounts.

## Tech Stack

- Node.js
- Express.js
- PostgreSQL
- Jest

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- PostgreSQL (v12 or higher)
- npm

### Installation

1. Clone the repository:

```bash
git clone https://github.com/jmoncayo-pursuit/financial-backend.git
cd financial-backend
```

2. Install dependencies:

```bash
npm install
```

3. Create environment files:

Create `.env`:

```env
DATABASE_URL=postgresql://localhost:5432/financial_dev
JWT_SECRET=your-secret-key
PORT=5500
```

Create `.env.test`:

```env
NODE_ENV=test
DATABASE_URL=postgresql://localhost:5432/financial_test
JWT_SECRET=test-secret-key
```

4. Set up the database:

```bash
# Initialize database schema
npm run db:init
```

## Available Scripts

### Development

```bash
# Start development server
npm start

# Start with auto-reload
npm run dev
```

### Database

```bash
# Initialize database schema
npm run db:init

# Reset database
npm run db:reset
```

## API Endpoints

### Authentication

#### POST /api/signup

Create a new user account.

Request:

```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

#### POST /api/login

Authenticate a user.

Request:

```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

## Database Schema

### Users Table

```sql
CREATE TABLE Users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  passwordhash VARCHAR(255) NOT NULL,
  createdat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  lastloginat TIMESTAMP
);
```

## Email Configuration

To enable email recovery functionality, you need to set up your email credentials in the `.env` file:

1. Create a `.env` file in the `financial-backend` directory if it doesn't exist.
2. Add the following lines to the `.env` file:

```env
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-email-password-or-app-password
```


Make sure to replace `your-email@gmail.com` and `your-email-password-or-app-password` with your actual email and password. If you are using Gmail, you may need to enable "Less secure app access" or use an App Password if you have 2-Step Verification enabled.

