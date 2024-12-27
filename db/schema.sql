-- Drop the table if it already exists
DROP TABLE IF EXISTS Users;

-- Create the Users table
CREATE TABLE Users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    passwordhash VARCHAR(255) NOT NULL,
    createdat TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updatedat TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    lastloginat TIMESTAMP WITH TIME ZONE
);

-- Create an index on email for faster lookups
CREATE INDEX users_email_idx ON Users(email); 