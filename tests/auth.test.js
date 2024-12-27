const request = require('supertest');
const bcrypt = require('bcrypt');
const { app, pool } = require('../index');

describe('Authentication Endpoints', () => {
  describe('POST /api/signup', () => {
    it('should create a new user with valid credentials', async () => {
      const response = await request(app).post('/api/signup').send({
        email: 'newuser@example.com',
        password: 'ValidPass123!',
      });

      expect(response.status).toBe(201);
      expect(response.text).toBe('User created');

      // Verify user was created in database
      const result = await pool.query(
        'SELECT * FROM Users WHERE email = $1',
        ['newuser@example.com']
      );
      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].email).toBe('newuser@example.com');
    });

    it('should reject weak passwords', async () => {
      const response = await request(app).post('/api/signup').send({
        email: 'test@example.com',
        password: 'weak',
      });

      expect(response.status).toBe(400);
      expect(response.text).toContain(
        'Password must be at least 8 characters long and include a mix of letters, numbers, or symbols.'
      );
    });

    it('should reject duplicate emails', async () => {
      // Create initial user
      await request(app).post('/api/signup').send({
        email: 'duplicate@example.com',
        password: 'ValidPass123!',
      });

      // Try to create duplicate
      const response = await request(app).post('/api/signup').send({
        email: 'duplicate@example.com',
        password: 'ValidPass123!',
      });

      expect(response.status).toBe(409);
      expect(response.text).toBe('Email already exists');
    });

    it('should reject missing email', async () => {
      const response = await request(app).post('/api/signup').send({
        password: 'ValidPass123!',
      });
      expect(response.status).toBe(400);
      expect(response.text).toContain('Email is required');
    });

    it('should reject missing password', async () => {
      const response = await request(app).post('/api/signup').send({
        email: 'newuser@example.com',
      });
      expect(response.status).toBe(400);
      expect(response.text).toContain('Password is required');
    });
  });

  describe('POST /api/login', () => {
    beforeEach(async () => {
      // Create a test user before each login test
      const hashedPassword = await bcrypt.hash('ValidPass123!', 10);
      await pool.query(
        'INSERT INTO Users (email, passwordhash) VALUES ($1, $2)',
        ['test@example.com', hashedPassword]
      );
    });

    it('should login with valid credentials', async () => {
      const response = await request(app).post('/api/login').send({
        email: 'test@example.com',
        password: 'ValidPass123!',
      });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(typeof response.body.token).toBe('string');
    });

    it('should reject invalid password', async () => {
      const response = await request(app).post('/api/login').send({
        email: 'test@example.com',
        password: 'WrongPass123!',
      });

      expect(response.status).toBe(401);
      expect(response.text).toBe('Invalid credentials');
    });

    it('should reject non-existent user', async () => {
      const response = await request(app).post('/api/login').send({
        email: 'nonexistent@example.com',
        password: 'ValidPass123!',
      });

      expect(response.status).toBe(401);
      expect(response.text).toBe('Invalid credentials');
    });

    it('should update last login at timestamp', async () => {
      await request(app).post('/api/login').send({
        email: 'test@example.com',
        password: 'ValidPass123!',
      });

      const result = await pool.query(
        'SELECT lastloginat FROM Users WHERE email = $1',
        ['test@example.com']
      );
      expect(result.rows[0].lastloginat).not.toBeNull();
    });
  });

  describe('Password Recovery', () => {
    it('should send recovery email for valid email', async () => {
      const response = await request(app).post('/api/recover').send({
        email: 'test@example.com',
      });
      expect(response.status).toBe(200);
      expect(response.text).toBe('Recovery email sent');
    });

    it('should return error for invalid email', async () => {
      const response = await request(app).post('/api/recover').send({
        email: 'invalid-email',
      });
      expect(response.status).toBe(400);
      expect(response.text).toBe('Invalid email format');
    });
  });
});
