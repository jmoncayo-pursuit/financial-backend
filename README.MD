# Financial Backend API

Backend service for the Financial Tracking Application. Provides authentication endpoints and database management for user accounts.

## Tech Stack

- Node.js
- Express.js
- PostgreSQL
- Jest (Testing)
- JWT (Authentication)

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

# (Optional) Add sample data
npm run db:seed
```

## Available Scripts

### Development

```bash
# Start development server with hot-reload
npm run dev

# Start production server
npm start
```

### Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Set up test database
npm run test:setup
```

### Database Management

```bash
# Reset database to initial state
npm run db:reset

# Initialize database schema
npm run db:init

# Add sample data
npm run db:seed
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

Responses:

- 201: User created
- 400: Invalid password
- 409: Email already exists
- 500: Server error

#### POST /api/login

Authenticate a user.

Request:

```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

Responses:

- 200: Success with JWT token
- 401: Invalid credentials
- 500: Server error

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
