import { pool, setCache } from "../declare.js";

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

export const upsertUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, profile_img, email } = req.body;
    const updateQuery = `INSERT INTO users (id, name, email, profile_img)
    VALUES ($1, $2, $3, $4)
    ON CONFLICT (id) DO UPDATE
    SET name = EXCLUDED.name
        email = EXCLUDED.email
        profile_img = EXCLUDED.profile_img;`;
    await pool.query(updateQuery, [id, name, email, profile_img]);
    res.json(`Upserted user, id:${id}`);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'An error occurred' });
  }
};