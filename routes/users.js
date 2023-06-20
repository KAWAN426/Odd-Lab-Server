import { pool, setCache } from "../declare.js";
import { v4 as uuidv4 } from 'uuid';

export const createUser = async (req, res) => {
  try {
    const { name, profile_img, email } = req.body;
    const id = uuidv4();
    const insertQuery = 'INSERT INTO users (id, name, profile_img, email) VALUES ($1, $2, $3, $4)';
    await pool.query(insertQuery, [id, name, profile_img, email]);
    res.status(201).json(`Created new user, id:${id}`);
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
    const { name, profile_img, email } = req.body;
    const updateQuery = 'UPDATE users SET name = $1, profile_img = $2, email = $3 WHERE id = $3';
    await pool.query(updateQuery, [name, profile_img, email, id]);
    res.json(`Updated user, id:${id}`);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'An error occurred' });
  }
};