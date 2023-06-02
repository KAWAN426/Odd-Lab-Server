import express from 'express';
import multer from 'multer';
import cors from 'cors';
import pg from 'pg';
import { v4 as uuidv4 } from 'uuid';
import { checkLabTable, checkTestTable, checkUserTable } from './tableCheck.js';
import redis from 'redis';
import NodeCache from 'node-cache';

// const redisClient = redis.createClient({
//   url: `redis://${process.env.REDIS_USERNAME}:${process.env.REDIS_PASSWORD}@${process.env.REDIS_HOST}:${process.env.REDIS_PORT}/0`,
//   legacyMode: true, // 반드시 설정 !!
// });
const { Pool } = pg

// const connectRedisClient = async () => {
//   redisClient.on('connect', () => {
//     console.info('Redis connected!');
//   });
//   redisClient.on('error', (err) => {
//     console.error('Redis Client Error', err);
//   });
//   await redisClient.connect();
//   return redisClient.v4;
// }
// const redisCli = connectRedisClient();

const pool = new Pool({
  user: 'kawan',
  host: 'haskal.cfvbadipfzzy.ap-northeast-2.rds.amazonaws.com',
  database: 'haskal_db',
  password: 'gnxQQ08xg!!x',
  port: 5432,
});

// multer 미들웨어 설정
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Express 애플리케이션 생성
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors());
const cache = new NodeCache();

const getFromCache = (req, res, next) => {
  const key = req.originalUrl;
  const cachedData = cache.get(key);
  if (cachedData !== undefined) {
    console.log('Cache hit:', key);
    return res.send(cachedData);
  }
  console.log('Cache miss:', key);
  next();
};

const setToCache = (req, res, next) => {
  const key = req.originalUrl;
  const { data } = req.body;

  cache.set(key, data, 60000);

  console.log('Data stored in cache:', key);
  next();
};

// 1. getListOrderedByLike() => Lab[]
app.get('/lab/popular', getFromCache, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM lab ORDER BY array_length(like, 1) DESC');
    cache.set(req.originalUrl, result.rows, 60000);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'An error occurred' });
  }
});

// 2. getListOrderedByNewest() => Lab[]
app.get('/lab/newest', getFromCache, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM lab ORDER BY createdAt DESC');
    cache.set(req.originalUrl, result.rows, 60000);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'An error occurred' });
  }
});

// 3. getOneById(id: string) => Lab
app.get('/lab/:id', getFromCache, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(`
      SELECT lab.*, 
      users.name AS maker_name, 
      users.profileImg AS maker_profileImg, 
      FROM lab 
      JOIN users ON lab.makerId = users.id
      WHERE id = $1
    `, [id]); // TODO: Test 해보기
    res.json(result.rows[0]);
    cache.set(req.originalUrl, result.rows, 60000);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'An error occurred' });
  }
});

// 4. getListByMakerId(makerId: string) => Lab[]
app.get('/lab/maker/:makerId', getFromCache, async (req, res) => {
  const { makerId } = req.params;
  try {
    const result = await pool.query('SELECT * FROM lab WHERE makerId = $1', [makerId]);
    cache.set(req.originalUrl, result.rows, 60000);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'An error occurred' });
  }
});

// 5. createLab(data: CreateLab)
app.post('/lab', async (req, res) => {
  const data = req.body;
  try {
    const id = uuidv4();
    await pool.query(
      'INSERT INTO lab (id, title, makerId, objects, backgroundimg, combinate, endObj) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [id, data.title, data.makerId, data.objects, data.backgroundImg, data.combinate, data.endObj]
    );
    res.json(`Created new lab, id:${id}`);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'An error occurred' });
  }
});

// 6. updateLabObject(data: UpdateLab)
app.put('/lab/:id', async (req, res) => {
  const { id } = req.params;
  const data = req.body;
  try {
    const getResult = await pool.query(`
      SELECT users.id AS user_Id, 
      FROM lab 
      JOIN users ON lab.makerId = users.id
      WHERE id = $1
    `, [id]); // TODO: Test 해보기
    if(getResult.rows[0] === undefined || getResult.rows[0].user_Id !== data.makerId) res.status(500).json({ error: 'Data availability error for update' });
    const result = await pool.query(
      'UPDATE lab SET title = $1, objects = $2, backgroundimg = $3, combinate = $4, endobj = $5 WHERE id = $6 RETURNING *',
      [data.title, data.objects, data.backgroundImg, data.combinate, data.endObj, id]
    );
    const cacheData = cache.get
    cache.del(id);
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'An error occurred' });
  }
});

// 7. updateLabLike(id: string)
app.put('/lab/like/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('UPDATE lab SET like = like + 1 WHERE id = $1 RETURNING *', [id]);
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'An error occurred' });
  }
});

// 8. deleteLabById(id: string)
app.delete('/lab/:id', async (req, res) => {
  const { id } = req.params;
  try {
    cache.del(id);
    await pool.query('DELETE FROM lab WHERE id = $1', [id]);
    res.json({ message: 'Lab deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'An error occurred' });
  }
});



app.get('/test/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM test WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Test not found' });
    } else {
      res.json(result.rows[0]);
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'An error occurred' });
  }
});

app.get('/test', async (req, res) => {
  try {
    const query = 'SELECT * FROM test';
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).json({ error: 'An error occurred' });
  }
});

// 2. createTest(data: Test)
app.post('/test', async (req, res) => {
  const { title, description } = req.body;
  const id = uuidv4();
  try {
    const result = await pool.query(
      'INSERT INTO test (id, title, description) VALUES ($1, $2, $3) RETURNING *',
      [id, title, description]
    );
    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'An error occurred' });
  }
});

app.delete('/test/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM test WHERE id = $1', [id]);
    if (result.rowCount === 0) {
      res.status(404).json({ error: 'Test not found' });
    } else {
      res.json({ message: 'Test deleted successfully' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'An error occurred' });
  }
});


app.listen(3000, async () => {
  console.log('Server is running on port 3000');

  // try {
  //   await pool.connect();
  //   console.log("Database connected")
  // } catch (error) {
  //   console.log('Database connect failed : ' + error);
  // }

  // checkUserTable(pool);
  // checkLabTable(pool);
  // checkTestTable(pool);
  // removeAllTable()
});

const removeAllTable = () => {
  pool.query(`
    DROP SCHEMA public CASCADE;
    CREATE SCHEMA public;
  `)
}