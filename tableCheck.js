const createUserTableQuery = `
CREATE TABLE users (
  id UUID PRIMARY KEY,
  name VARCHAR(255),
  profileImg VARCHAR(255)
);`;

const createLabTableQuery = `
CREATE TABLE lab (
  id UUID PRIMARY KEY,
  title VARCHAR(255),
  makerId UUID,
  objects JSONB,
  backgroundImg Text,
  combinate VARCHAR(36)[][],
  startObj VARCHAR(36)[],
  endObj VARCHAR(36)[],
  likedUser VARCHAR(36)[],
  findObj JSONB,
  createdAt TIMESTAMPTZ DEFAULT NOW(),
  updatedAt TIMESTAMPTZ DEFAULT NOW()
);`; //TODO: findObj 자료구조 정리하기

const createTestTableQuery = `
CREATE TABLE test (
  id UUID PRIMARY KEY,
  title VARCHAR(255),
  description VARCHAR(255)
);`;

export async function checkUserTable(pool) {
  try {
    const client = await pool.connect();
    const result = await client.query(`
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_name = 'users'
      );
    `);

    if (!result.rows[0].exists) {
      // User 테이블이 없을 경우 생성
      await client.query(createUserTableQuery);
      console.log('User table created successfully');
    }
  } catch (error) {
    console.error('Error checking User table:', error);
  }
}

// Lab 테이블 존재 여부 체크
export async function checkLabTable(pool) {
  try {
    const client = await pool.connect();
    const result = await client.query(`
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_name = 'lab'
      );
    `);

    if (!result.rows[0].exists) {
      // Lab 테이블이 없을 경우 생성
      await client.query(createLabTableQuery);
      console.log('Lab table created successfully');
    }
  } catch (error) {
    console.error('Error checking Lab table:', error);
  }
}

export async function checkTestTable(pool) {
  try {
    const client = await pool.connect();
    const result = await client.query(`
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_name = 'test'
      );
    `);

    if (!result.rows[0].exists) {
      // Test 테이블이 없을 경우 생성
      await client.query(createTestTableQuery);
      console.log('Test table created successfully');
    }
  } catch (error) {
    console.error('Error checking Test table:', error);
  }
}