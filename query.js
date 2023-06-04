export const createUserTableQuery = `
CREATE TABLE users (
  id UUID PRIMARY KEY,
  name VARCHAR(255),
  profileImg VARCHAR(255)
);`;

export const createLabTableQuery = `
CREATE TABLE lab (
  id UUID PRIMARY KEY,
  title VARCHAR(255),
  makerId char(36),
  objects JSONB,
  backgroundImg Text,
  combinate JSONB,
  endObj char(36)[],
  likedUser char(36)[],
  findObj JSONB,
  createdAt TIMESTAMPTZ DEFAULT NOW(),
  updatedAt TIMESTAMPTZ DEFAULT NOW()
);`; //TODO: findObj 자료구조 정리하기

export const createTestTableQuery = `
CREATE TABLE test (
  id UUID PRIMARY KEY,
  title VARCHAR(255),
  description VARCHAR(255)
);`;