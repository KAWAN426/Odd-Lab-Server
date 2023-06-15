import { pool, setCache } from "../declare.js";
import { v4 as uuidv4 } from 'uuid';

export const createUser = async (req, res) => {
  try {
    const { name, profile_img } = req.body;
    const id = uuidv4();
    const insertQuery = 'INSERT INTO users (id, name, profile_img) VALUES ($1, $2, $3)';
    await pool.query(insertQuery, [id, name, profile_img]);
    res.status(201).json({ id, name, profile_img });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'An error occurred' });
  }
};

export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const selectQuery = 'SELECT * FROM users WHERE id = $1';
    const result = await pool.query(selectQuery, [id]);
    const user = result.rows[0];
    if (user) {
      setCache(req, user)
      res.json(user);
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  } catch (error) {
    console.error('Error retrieving user:', error);
    res.status(500).json({ error: 'An error occurred' });
  }
};

export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, profile_img } = req.body;
    const updateQuery = 'UPDATE users SET name = $1, profile_img = $2 WHERE id = $3';
    await pool.query(updateQuery, [name, profile_img, id]);
    res.json({ id, name, profile_img });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'An error occurred' });
  }
};