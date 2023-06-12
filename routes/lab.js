import { pool, setCache } from "../declare.js";
import { v4 as uuidv4 } from 'uuid';

export const getListOrderedByLike = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM lab ORDER BY ARRAY_LENGTH(liked_user, 1) DESC');
    setCache(req, result.rows);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'An error occurred' });
  }
}

export const getListOrderedByNewest = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM lab ORDER BY created_at DESC');
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
      SELECT lab.*, users.name AS maker_name, users.profile_img AS maker_img
      FROM lab
      INNER JOIN users ON lab.maker_id = users.id
      WHERE lab.id = $1;
    `, [id]);
    // delete result.rows[0].maker_id;
    setCache(req, result.rows[0]);
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'An error occurred' });
  }
}

export const getListByMakerId = async (req, res) => {
  const { makerId } = req.params;
  try {
    const result = await pool.query('SELECT * FROM lab WHERE maker_id = $1', [makerId]);
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
    const find_obj = data.find_obj || "{}"
    await pool.query(
      'INSERT INTO lab (id, title, maker_id, objects, background_img, combinate, start_obj, end_obj, liked_user, find_obj) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)',
      [id, data.title, data.maker_id, JSON.stringify(data.objects), data.background_img, data.combinate, data.start_obj, data.end_obj, [], JSON.stringify(find_obj)]
    );
    res.json(`Created new lab, id:${id}`);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'An error occurred' });
  }
}

export const updateLab = async (req, res) => {
  const { id } = req.params;
  const data = req.body;
  try {
    const getUserData = await pool.query(`
      SELECT id, 
      FROM users 
      WHERE id = $1
    `, [data.maker_id]);

    if (getUserData.rows[0] === undefined) // 받아온 데이터의 user id가 올바른지 체크
      return res.status(500).json({ error: 'Data availability error for update' });

    const result = await pool.query(
      'UPDATE lab SET title = $1, objects = $2, background_img = $3, combinate = $4, end_obj = $5 WHERE id = $6 RETURNING *',
      [data.title, data.objects, data.background_img, data.combinate, data.end_obj, id]
    );

    if (result.rows.length === 0)
      return res.status(404).json({ error: 'Data not found' });

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
      'UPDATE lab SET "liked_user" = array_append("liked_user", $1) WHERE id = $2 RETURNING *',
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