import { v4 as uuidv4 } from 'uuid';
import { pool } from './declare.js';

export const makeTestAPI = (app) => {
  app.get('/test/:id', async (req, res) => {
    const { id } = req.params;
    try {
      const result = await pool.query('SELECT * FROM test WHERE id = $1', [id]);
      if (result.rows.length === 0) {
        res.status(404).json({ error: 'Test not found' });
      } else {
        res.json(result.rows[0]);
      }
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'An error occurred' });
    }
  });

  app.get('/test', async (req, res) => {
    try {
      const query = 'SELECT * FROM test';
      const result = await pool.query(query);
      res.json(result.rows);
    } catch (error) {
      console.error('Error fetching data:', error);
      res.status(500).json({ error: 'An error occurred' });
    }
  });

  app.post('/test', async (req, res) => {
    const { title, description } = req.body;
    const id = uuidv4();
    try {
      const result = await pool.query(
        'INSERT INTO test (id, title, description) VALUES ($1, $2, $3) RETURNING *',
        [id, title, description]
      );
      res.status(200).json(result.rows[0]);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'An error occurred' });
    }
  });

  app.delete('/test/:id', async (req, res) => {
    const { id } = req.params;
    try {
      const result = await pool.query('DELETE FROM test WHERE id = $1', [id]);
      if (result.rowCount === 0) {
        res.status(404).json({ error: 'Test not found' });
      } else {
        res.json({ message: 'Test deleted successfully' });
      }
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'An error occurred' });
    }
  });
}