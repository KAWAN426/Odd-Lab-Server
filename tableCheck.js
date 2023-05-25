import { createLabTableQuery, createTestTableQuery, createUserTableQuery } from "./query.js";

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