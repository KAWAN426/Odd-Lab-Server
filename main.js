import express from 'express';
import cors from 'cors';
import { checkLabTable, checkTestTable, checkUserTable } from './tableCheck.js';
import { createLab, deleteLabById, getListByMakerId, getListOrderedByLike, getListOrderedByNewest, getOneById, updateLab, updateLabLike } from './routes/lab.js';
import { getFromCache, pool } from './declare.js';
import { makeTestAPI } from './routes/test.js';
import { createUser, getUserById, updateUser } from './routes/users.js';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors());

makeTestAPI(app)


// !!!!!!! cachero 기능 추가한거 테스트

app.get('/lab/popular/:page', getListOrderedByLike);
app.get('/lab/newest/:page', getListOrderedByNewest);
app.get('/lab/:id', getOneById);
app.get('/lab/maker/:makerId/:page', getListByMakerId);
// app.get('/lab/search', getListOrderedByLike); // ! 검색 기능 개발해야함
app.post('/lab', createLab);
app.put('/lab/:id', updateLab);
app.put('/lab/like/:id/:userId', updateLabLike);
app.delete('/lab/:id', deleteLabById);

app.get('/user/:id', getUserById);
app.post('/user', createUser);
app.put('/user/:id', updateUser);

app.listen(3000, async () => {
  console.log('Server is running on port 3000');
  try {
    await pool.connect();
    console.log("Database connected")
  } catch (error) {
    console.log('Database connect failed : ' + error);
  }

  checkUserTable(pool);
  checkLabTable(pool);
  checkTestTable(pool);
});
