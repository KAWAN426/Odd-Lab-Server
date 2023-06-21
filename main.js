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

function myFunction() {
  console.log('함수가 실행되었습니다.');
}

app.listen(3000, async () => {
  console.log('Server is running on port 3000');
  scheduleFunctionAtSpecificTime(times, myFunction)
  try {
    await pool.connect();
    console.log("Database connected")
    const labCountResult = await pool.query("SELECT COUNT(*) FROM lab;")
    labCachero.setCount(labCountResult.rows[0].count)
    checkUserTable(pool);
    checkLabTable(pool);
    checkTestTable(pool);

    // const job = scheduler(3, 0, saveDatas)

    redis.on('error', err => {
      console.log('Redis Client Error', err)
      // job.cancel()
    });
    await redis.connect();

  } catch (error) {
    console.log('Database connect failed : ' + error);
  }
});

async function saveDatas(data) {
  const datas = labCachero.getData()
  const insertQuery = `

    INSERT INTO lab (id, name , visit) 
      VALUES(1, 'Mary', 1), (2, 'Anna', 1)
    ON CONFLICT (id)
    DO UPDATE
    SET 
      visit = lab.visit + 1,
      name = excluded.name

    INSERT INTO lab (your_column1, your_column2)
    VALUES ${datas.map((_, index) => `($${index * 2 + 1}, $${index * 2 + 2})`).join(', ')}
  `;

  // 데이터를 저장하기 위한 매개변수 생성
  const params = [];
  datas.forEach(data => {
    params.push(data.your_column1, data.your_column2);
  });

  // 쿼리 실행
  await pool.query(insertQuery, params);

}

function scheduler(hour, minute, task) {
  const now = new Date();
  const nextRunTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, minute, 0);
  let timeUntilNextRun = nextRunTime.getTime() - now.getTime();

  if (timeUntilNextRun < 0) {
    // 이미 오늘의 목표 시간이 지났다면 다음 날로 설정
    nextRunTime.setDate(nextRunTime.getDate() + 1);
    timeUntilNextRun = nextRunTime.getTime() - now.getTime();
  }

  let isClear = false;

  const cancel = () => isClear = true
  setTimeout(function () {
    task(); // 입력받은 함수 실행
    if (!isClear) scheduler(hour, minute, task); // 다음 날 같은 시간에 다시 실행
  }, timeUntilNextRun);

  return { cancel }
}

function scheduleFunctionAtSpecificTime(times, fn) {
  // 주기적으로 현재 시간 체크
  const intervalId = setInterval(() => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    // times 배열을 순회하며 특정 시간에 함수 실행
    for (let i = 0; i < times.length; i++) {
      const [hour, minute] = times[i];

      // 시간과 분이 일치하는 경우 함수 실행
      if (currentHour === hour && currentMinute === minute) {
        fn();
        break;
      }
    }
  }, 60000); // 1분(60초)마다 체크

  // 스케줄러 중지 함수
  function stopScheduler() {
    clearInterval(intervalId);
  }

  // 스케줄러 중지 함수를 반환
  return stopScheduler;
}

const times = [
  [21, 45],  // 09:30
  [21, 46],  // 12:00
  [21, 47]  // 15:45
];