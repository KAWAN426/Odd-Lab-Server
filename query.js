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
  makerId REFERENCES users(id),
  objects Text,
  backgroundImg VARCHAR(255),
  combinate char(36)[][],
  endObj char(36)[],
  like char(36)[],
  findObj:Text[] 
  createdAt TIMESTAMPTZ DEFAULT NOW(),
  updatedAt TIMESTAMPTZ DEFAULT NOW()
);`; //TODO: findObj 자료구조 정리하기

export const createTestTableQuery = `
CREATE TABLE test (
  id UUID PRIMARY KEY,
  title VARCHAR(255),
  description VARCHAR(255)
);`;