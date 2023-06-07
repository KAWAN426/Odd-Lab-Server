import express from 'express';
import cors from 'cors';
import { checkLabTable, checkTestTable, checkUserTable } from './tableCheck.js';
import { createLab, deleteLabById, getListByMakerId, getListOrderedByLike, getListOrderedByNewest, getOneById, updateLabLike, updateLabObject } from './routes/lab.js';
import { getFromCache, pool } from './declare.js';
import { makeTestAPI } from './routes/test.js';
import { createUser, getUserById, updateUser } from './routes/user.js';

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

app.get('/user', getFromCache, getUserById);
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
