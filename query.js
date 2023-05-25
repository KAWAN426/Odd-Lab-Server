export const createUserTableQuery = `
CREATE TABLE users (
  id UUID PRIMARY KEY,
  name VARCHAR(255),
  profileImg VARCHAR(255)
);`;

export const createRabotoryTableQuery = `
CREATE TABLE rabotory (
  id UUID PRIMARY KEY,
  title VARCHAR(255),
  makerId UUID,
  objects JSONB,
  backgroundImg VARCHAR(255),
  combinate JSONB,
  endObj JSONB,
  "like" INTEGER,
  createdAt TIMESTAMPTZ DEFAULT NOW(),
  updatedAt TIMESTAMPTZ DEFAULT NOW()
);`;

export const createTestTableQuery = `
CREATE TABLE test (
  id UUID PRIMARY KEY,
  title VARCHAR(255),
  description VARCHAR(255)
);`;