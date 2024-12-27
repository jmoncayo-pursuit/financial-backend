-- Drop database if exists and recreate
DROP DATABASE IF EXISTS financial_dev;
CREATE DATABASE financial_dev;

\c financial_dev;

-- Create Users table
CREATE TABLE Users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  passwordhash VARCHAR(255) NOT NULL,
  createdat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  lastloginat TIMESTAMP,
  resetToken VARCHAR(255),
  resetTokenExpiration TIMESTAMP
);

-- Create index on email for faster lookups
CREATE INDEX users_email_idx ON Users(email); 