import express from 'express';
import multer from 'multer';
import cors from 'cors';
import { checkLabTable, checkTestTable, checkUserTable } from './tableCheck.js';
import redis from 'redis';
import { createLab, deleteLabById, getListByMakerId, getListOrderedByLike, getListOrderedByNewest, getOneById, updateLabLike, updateLabObject } from './routes/lab.js';
import { getFromCache } from './declare.js';
import { makeTestAPI } from './test.js';

// const redisClient = redis.createClient({
//   url: `redis://${process.env.REDIS_USERNAME}:${process.env.REDIS_PASSWORD}@${process.env.REDIS_HOST}:${process.env.REDIS_PORT}/0`,
//   legacyMode: true, // 반드시 설정 !!
// });
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

// const storage = multer.memoryStorage();
// const upload = multer({ storage: storage });

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors());

makeTestAPI(app)

app.get('/lab/popular', getFromCache, getListOrderedByLike);
app.get('/lab/newest', getFromCache, getListOrderedByNewest);
app.get('/lab/:id', getFromCache, getOneById);
app.get('/lab/maker/:makerId', getFromCache, getListByMakerId);
app.post('/lab', createLab);
app.put('/lab/:id', updateLabObject);
app.put('/lab/like/:id', updateLabLike);
app.delete('/lab/:id', deleteLabById);


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
});
