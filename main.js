import express from 'express';
import cors from 'cors';
import v8 from 'v8';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { checkLabTable, checkTestTable, checkUserTable } from './tableCheck.js';
import { createLab, deleteLabById, getDataByKeyword, getListByMakerId, getListOrderedByLike, getListOrderedByNewest, getOneById, updateLab, updateLabLike } from './routes/lab.js';
import { labCachero, pool, redis } from './declare.js';
import { makeTestAPI } from './routes/test.js';
import { getUserById, upsertUser } from './routes/users.js';
import { getImageFile, getImagePresignURL } from './routes/image.js';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors());
app.use(helmet());

app.use((_, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('X-Frame-Options', 'DENY');
  next();
});

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15분 동안
  max: 1000,
});
app.use('/', limiter);

makeTestAPI(app);

app.get('/lab/popular/:page', getListOrderedByLike);
app.get('/lab/newest/:page', getListOrderedByNewest);
app.get('/lab/:id', getOneById);
app.get('/lab/maker/:makerId/:page', getListByMakerId);
app.get('/lab/search', getDataByKeyword);
app.post('/lab', createLab);
app.put('/lab/:id', updateLab);
app.put('/lab/like/:id/:userId', updateLabLike);
app.delete('/lab/:id', deleteLabById);

app.get('/image/presignurl', getImagePresignURL)
app.get('/image/:fileName', getImageFile)

app.get('/user/:id', getUserById);
app.put('/user/:id', upsertUser);

app.get('/memory', (_, res) => {
  const memoryUsage = process.memoryUsage();
  const maxMemory = v8.getHeapStatistics().heap_size_limit;

  const usedMemory = memoryUsage.heapUsed;
  const memoryPercentage = (usedMemory / maxMemory) * 100;

  res.json({
    usedMemory,
    maxMemory,
    memoryPercentage
  });
})

app.listen(3000, async () => {
  console.log('Server is running on port 3000');
  try {
    await pool.connect();
    console.log("Postgresql connected")

    const times = [[3, 0]];
    const scheduler = labCachero.scheduler(times)

    // redis.on('error', err => {
    //   console.log('Redis Client Error', err)
    //   scheduler.cancel()
    // });
    // await redis.connect();
    // console.log("Redis connected")

    const labCountResult = await pool.query("SELECT COUNT(*) FROM lab;")
    labCachero.setCount(labCountResult.rows[0].count)
    checkUserTable(pool);
    checkLabTable(pool);
    checkTestTable(pool);

  } catch (error) {
    console.log('Database connect failed : ' + error);
  }
});

process.on('SIGINT', () => {
  console.log("Server shut down")
  redis.quit();
  pool.end();
  process.exit();
});
