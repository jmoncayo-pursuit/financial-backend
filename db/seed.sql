-- Connect to the database
\c financial_dev;

-- Insert sample users (passwords should be hashed in production)
INSERT INTO Users (email, passwordhash) VALUES 
('test@example.com', '$2b$10$xLrYvyqkVE8IlxU9LbJIAeIQ9y1O2tS3Vf3XQ3K9Q4XQ9y1O2tS3V'),
('demo@example.com', '$2b$10$xLrYvyqkVE8IlxU9LbJIAeIQ9y1O2tS3Vf3XQ3K9Q4XQ9y1O2tS3V'); 