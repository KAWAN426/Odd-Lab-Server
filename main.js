import express from 'express';
import cors from 'cors';
import { checkLabTable, checkTestTable, checkUserTable } from './tableCheck.js';
import { createLab, deleteLabById, getDataByKeyword, getListByMakerId, getListOrderedByLike, getListOrderedByNewest, getOneById, updateLab, updateLabLike } from './routes/lab.js';
import { labCachero, pool, redis } from './declare.js';
import { makeTestAPI } from './routes/test.js';
import { getUserById, upsertUser } from './routes/users.js';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors());

makeTestAPI(app)

app.get('/lab/popular/:page', getListOrderedByLike);
app.get('/lab/newest/:page', getListOrderedByNewest);
app.get('/lab/:id', getOneById);
app.get('/lab/maker/:makerId/:page', getListByMakerId);
app.get('/lab/search', getDataByKeyword);
app.post('/lab', createLab);
app.put('/lab/:id', updateLab);
app.put('/lab/like/:id/:userId', updateLabLike);
app.delete('/lab/:id', deleteLabById);

app.get('/user/:id', getUserById);
app.put('/user/:id', upsertUser);

app.listen(3000, async () => {
  console.log('Server is running on port 3000');
  try {
    await pool.connect();
    console.log("Postgresql connected")

    redis.on('error', err => {
      console.log('Redis Client Error', err)
      // job.cancel()
    });
    await redis.connect();
    console.log("Redis connected")

    // const job = scheduler(3, 0, saveAllDatas)
    const labCountResult = await pool.query("SELECT COUNT(*) FROM lab;")
    labCachero.setCount(labCountResult.rows[0].count)
    checkUserTable(pool);
    checkLabTable(pool);
    checkTestTable(pool);

    const times = [[3, 0]];
    labCachero.scheduler(times)

  } catch (error) {
    console.log('Database connect failed : ' + error);
  }
});