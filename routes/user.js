import { pool, setCache } from "../declare.js";
import { v4 as uuidv4 } from 'uuid';

export const createUser = async (req, res) => {
  try {
    const { name, profileImg } = req.body;
    const id = uuidv4();
    const insertQuery = 'INSERT INTO users (id, name, profileImg) VALUES ($1, $2, $3)';
    await pool.query(insertQuery, [id, name, profileImg]);
    res.status(201).json({ id, name, profileImg });
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
    const { name, profileImg } = req.body;
    const updateQuery = 'UPDATE users SET name = $1, profileImg = $2 WHERE id = $3';
    await pool.query(updateQuery, [name, profileImg, id]);
    res.json({ id, name, profileImg });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'An error occurred' });
  }
};