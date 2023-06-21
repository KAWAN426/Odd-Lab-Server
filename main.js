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
    console.log("Database connected")
    const labCountResult = await pool.query("SELECT COUNT(*) FROM lab;")
    labCachero.setCount(labCountResult.rows[0].count)
    checkUserTable(pool);
    checkLabTable(pool);
    checkTestTable(pool);

    redis.on('error', err => {
      console.log('Redis Client Error', err)
      // job.cancel()
    });
    await redis.connect();

  } catch (error) {
    console.log('Database connect failed : ' + error);
  }
});

function scheduler(time, task) {
  // time.forEach(([hour, minute]) => {

  // })
  const now = new Date();
  const nextRunTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, minute, 0);
  let timeUntilNextRun = nextRunTime.getTime() - now.getTime();

  if (timeUntilNextRun < 0) {
    // 이미 오늘의 목표 시간이 지났다면 다음 날로 설정
    nextRunTime.setDate(nextRunTime.getDate() + 1);
    timeUntilNextRun = nextRunTime.getTime() - now.getTime();
  }

  let isClear = false;

  const clear = () => isClear = true
  setTimeout(function () {
    task(); // 입력받은 함수 실행
    if (!isClear) scheduler(hour, minute, task); // 다음 날 같은 시간에 다시 실행
  }, timeUntilNextRun);

  return { clear }
}