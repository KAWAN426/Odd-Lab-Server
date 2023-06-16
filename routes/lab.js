import { cache, cachero, pool, setCache } from "../declare.js";
import { v4 as uuidv4 } from 'uuid';


export const getListOrderedByLike = async (req, res) => {
  const { page } = req.params;
  const pageSize = 30; // 페이지당 항목 수
  const offset = (page - 1) * pageSize; // 오프셋 계산

  const cacheData = cachero.getSortedData("like_count", "number", "DESC")
  const pagedData = cachero.sliceDataByPage(cacheData, page, pageSize)
  if (pagedData) {
    console.log("cachero hit!")
    return res.json(pagedData);
  }

  try {
    const result = await pool.query(`
      SELECT lab.id, title, background_img, start_obj, end_obj, created_at, liked_user,
      users.name AS maker_name, users.profile_img AS maker_img
      FROM lab 
      INNER JOIN users ON lab.maker_id = users.id
      ORDER BY COALESCE(ARRAY_LENGTH(liked_user, 1), 0) DESC
      LIMIT $1 OFFSET $2;
    `, [pageSize * 2, offset]);
    console.log("cachero miss!")
    // setCache(req, result.rows);
    result.rows.forEach((data, key) => {
      result.rows[key].like_count = data.liked_user.length
      delete result.rows[key].liked_user
    })
    cachero.appendData(result.rows);
    res.json(result.rows.slice(0, pageSize));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'An error occurred' });
  }
}

export const getListOrderedByNewest = async (req, res) => {
  const { page } = req.params;
  const pageSize = 30; // 페이지당 항목 수
  const offset = (page - 1) * pageSize; // 오프셋 계산
  const cacheData = cachero.getSortedData("created_at", "date", "DESC")
  const pagedData = cachero.sliceDataByPage(cacheData, page, pageSize)

  if (pagedData) {
    return res.json(pagedData);
  }
  try {
    const result = await pool.query(`
      SELECT lab.id, title, background_img, start_obj, end_obj, created_at, liked_user, 
      users.name AS maker_name, users.profile_img AS maker_img
      FROM lab 
      INNER JOIN users ON lab.maker_id = users.id
      ORDER BY created_at DESC
      LIMIT $1 OFFSET $2;
    `, [pageSize * 2, offset]);
    result.rows.forEach((data, key) => {
      result.rows[key].like_count = data.liked_user.length
      delete result.rows[key].liked_user
    })
    cachero.appendData(result.rows)
    // setCache(req, result.rows);
    res.json(result.rows.slice(0, pageSize));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'An error occurred' });
  }
}

export const getOneById = async (req, res) => {
  const { id } = req.params;
  const { userId } = req.body;

  const cacheData = cachero.getOneData("id", id)
  if (cacheData) {
    for (let key in cacheData.find_obj) {
      if (key !== userId) delete cacheData.find_obj[key];
    }
    console.log("cachero Hit!")
    return res.json(cacheData);
  }

  try {
    const result = await pool.query(`
      SELECT lab.id, title, objects, background_img, combinate, start_obj, end_obj, find_obj, created_at,
      COALESCE(ARRAY_LENGTH(liked_user, 1), 0) AS like_count,
      users.name AS maker_name, users.profile_img AS maker_img
      FROM lab
      INNER JOIN users ON lab.maker_id = users.id
      WHERE lab.id = $1;
    `, [id]);
    const resultData = result.rows[0]
    resultData.
    console.log("cachero miss!")
    
    cachero.appendData([result.rows[0]])

    // * 보안을 위해 요청자의 find_obj만 전달
    for (let key in resultData.find_obj) {
      if (key !== userId) delete resultData.find_obj[key];
    }

    // setCache(req, resultData);
    res.json(resultData);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'An error occurred' });
  }
}

export const getListByMakerId = async (req, res) => {
  const { makerId, page } = req.params;
  const pageSize = 30; // 페이지당 항목 수
  const offset = (page - 1) * pageSize; // 오프셋 계산

  const cacheData = cachero.getFilteredData("maker_id", makerId)
  const pagedData = cachero.sliceDataByPage(cacheData, page, pageSize)

  if (pagedData) {
    return res.json(pagedData);
  }

  try {
    const result = await pool.query(`
      SELECT id, title, maker_id, background_img, start_obj, end_obj, created_at, updated_at,
      COALESCE(ARRAY_LENGTH(liked_user, 1), 0) AS like_count 
      FROM lab
      WHERE maker_id = $1
      ORDER BY updated_at DESC
      LIMIT $2 OFFSET $3;
    `, [makerId, pageSize * 2, offset]);

    cachero.appendData([result.rows[0]])
    // setCache(req, result.rows);
    res.json(result.rows.slice(0, pageSize));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'An error occurred' });
  }
}

export const createLab = async (req, res) => {
  const data = req.body;
  try {
    const getUserData = await pool.query(`
      SELECT *
      FROM users
      WHERE id = $1;
    `, [data.maker_id]);
    if (getUserData.rows.length === 0)
      return res.status(404).json({ error: 'Data not found' });

    const id = uuidv4();
    const { title, maker_id, objects, background_img, combinate, start_obj, end_obj } = data
    const maker_name = getUserData.rows[0].name
    const maker_img = getUserData.rows[0].profile_img
    const timestamp = new Date().toISOString();
    const find_obj = data.find_obj || "{}"
    const liked_user = []
    cachero.appendData([{ id, title, maker_id, objects, background_img, combinate, start_obj, end_obj, find_obj, liked_user, created_at: timestamp, updated_at: timestamp, maker_name, maker_img }])
    // const result = await pool.query(
    //   'INSERT INTO lab (id, title, maker_id, objects, background_img, combinate, start_obj, end_obj, liked_user, find_obj) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *',
    //   [id, title, maker_id, JSON.stringify(objects), background_img, combinate, start_obj, end_obj, liked_user, JSON.stringify(find_obj)]
    // );
    // const { created_at, updated_at } = result.rows[0]
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
    // const getUserData = await pool.query(`
    //   SELECT id
    //   FROM users
    //   WHERE id = $1;
    // `, [data.maker_id]);

    // if (getUserData.rows.length === 0)
    //   return res.status(404).json({ error: 'Data not found' });
    const { title, objects, background_img, combinate, start_obj, end_obj } = data
    // const result = await pool.query(
    //   'UPDATE lab SET title = $1, objects = $2, background_img = $3, combinate = $4, start_obj = $5, end_obj = $6 WHERE id = $7 RETURNING *',
    //   [title, objects, background_img, combinate, start_obj, end_obj, id]
    // );

    // if (result.rows[0] === undefined)
    //   return res.status(500).json({ error: 'Data availability error for update' });
    const cachedData = cachero.getOneData("id", id)

    if (cachedData) {
      const timestamp = new Date().toISOString();
      cachero.appendData([{ id, title, objects, background_img, combinate, start_obj, end_obj, updated_at: timestamp }])
      return res.json(`Updated lab, id:${id}`);
    }
    return res.json(`Please in update page`);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'An error occurred' });
  }
}

export const updateLabLike = async (req, res) => {
  const { id } = req.params;
  const { userId } = req.body;
  try {
    // * 캐시 방식 변경 구상

    const liked_user = await pool.query(`
      SELECT liked_user 
      FROM lab
      WHERE id = $1;
    `, [id]);

    if (liked_user.rows.length === 0)
      return res.status(404).json({ error: 'Data not found' });

    let queryText = "array_append"
    const likedUser = liked_user.rows[0].liked_user.length
    if (likedUser.includes(userId)) {
      queryText = "array_remove";
      cachero.appendData([{ id, like_count: likedUser.length - 1 }])
    } else {
      cachero.appendData([{ id, like_count: likedUser.length + 1 }])
    }
    await pool.query(`
      UPDATE lab 
      SET "liked_user" = ${queryText}("liked_user", $1) 
      WHERE id = $2;`,
      [userId, id]
    );

    res.json("Updated successfully");

    // * 캐시 제거
    // cache.del("GET/lab/newest");
    // cache.del("GET/lab/popular");
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
    // * 캐시 제거 추가
    // cache.set(`GET/lab/${id}`, undefined, 30000);
    cachero.removeData(id)
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'An error occurred' });
  }
}