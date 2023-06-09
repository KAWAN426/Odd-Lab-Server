import { pool, setCache } from "../declare.js";
import { v4 as uuidv4 } from 'uuid';

export const getListOrderedByLike = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM lab ORDER BY ARRAY_LENGTH(likedUser, 1) DESC');
    setCache(req, result.rows);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'An error occurred' });
  }
}

export const getListOrderedByNewest = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM lab ORDER BY createdAt DESC');
    setCache(req, result.rows);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'An error occurred' });
  }
}

export const getOneById = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(`
      SELECT lab.*, 
      users.name AS maker_name, 
      users.profileImg AS maker_profileImg, 
      FROM lab 
      JOIN users ON lab.makerId = users.id
      WHERE id = $1
    `, [id]);
    setCache(req, result[0].rows);
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'An error occurred' });
  }
}

export const getListByMakerId = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM lab WHERE makerId = $1', [id]);
    setCache(req, result.rows);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'An error occurred' });
  }
}

export const createLab = async (req, res) => {
  const data = req.body;
  try {
    const id = uuidv4();
    const findObj = data.findObj || "{}"
    await pool.query(
      'INSERT INTO lab (id, title, makerId, objects, backgroundImg, combinate, startObj, endObj, likedUser, findObj) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *',
      [id, data.title, data.makerId, JSON.stringify(data.objects), data.backgroundImg, data.combinate, data.startObj, data.endObj, [], JSON.stringify(findObj)]
    );
    res.json(`Created new lab, id:${id}`);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'An error occurred' });
  }
}

export const updateLabObject = async (req, res) => {
  const { id } = req.params;
  const data = req.body;
  try {
    const getUserData = await pool.query(`
      SELECT id, 
      FROM users 
      WHERE id = $1
    `, [data.makerId]);
    if (getUserData.rows[0] === undefined) // 받아온 데이터의 user id가 올바른지 체크
      res.status(500).json({ error: 'Data availability error for update' });
    const result = await pool.query(
      'UPDATE lab SET title = $1, objects = $2, backgroundImg = $3, combinate = $4, endobj = $5 WHERE id = $6 RETURNING *',
      [data.title, data.objects, data.backgroundImg, data.combinate, data.endObj, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'An error occurred' });
  }
}

export const updateLabLike = async (req, res) => {
  const { id } = req.params;
  const { userId } = req.body;
  try {
    const result = await pool.query(
      'UPDATE lab SET "like" = array_append("like", $1) WHERE id = $2 RETURNING *',
      [userId, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'An error occurred' });
  }
}

export const deleteLabById = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM lab WHERE id = $1', [id]);
    res.json({ message: 'Lab deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'An error occurred' });
  }
}