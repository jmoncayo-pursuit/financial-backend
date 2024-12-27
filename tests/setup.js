const { Pool } = require('pg');
const { app, pool } = require('../index');

beforeAll(async () => {
  try {
    // Create test tables
    await pool.query(`
      CREATE TABLE IF NOT EXISTS Users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        passwordhash VARCHAR(255) NOT NULL,
        createdat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        lastloginat TIMESTAMP
      )
    `);
  } catch (error) {
    console.error('Test setup failed:', error);
    throw error;
  }
});

afterAll(async () => {
  try {
    // Clean up test database
    await pool.query('DROP TABLE IF EXISTS Users');
    await pool.end();
  } catch (error) {
    console.error('Test cleanup failed:', error);
    throw error;
  }
});

afterEach(async () => {
  try {
    // Clear test data after each test
    await pool.query('DELETE FROM Users');
  } catch (error) {
    console.error('Test data cleanup failed:', error);
    throw error;
  }
});

module.exports = {
  pool: pool,
};
