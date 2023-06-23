import { labCachero, pool } from "../declare.js";
import { v4 as uuidv4 } from 'uuid';

export const getDataByKeyword = async (req, res) => {
  const { page } = req.params;
  const { keywords } = req.body;
  const pageSize = 30; // 페이지당 항목 수
  const offset = (page - 1) * pageSize; // 오프셋 계산
  try {
    const searchQuery = keywords.map(keyword => `title ILIKE '%${keyword}%'`).join(' OR ');
    const result = await pool.query(`  
      SELECT lab.id, title, background_img, start_obj, end_obj, created_at, liked_user,
      COALESCE(ARRAY_LENGTH(liked_user, 1), 0) AS like_count,
      users.name AS maker_name, users.profile_img AS maker_img
      FROM lab
      WHERE ${searchQuery};
      ORDER BY COALESCE(ARRAY_LENGTH(liked_user, 1), 0) DESC, created_at DESC
      LIMIT $1 OFFSET $2;
    `, [pageSize, offset])
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'An error occurred' });
  }
}
export const getListOrderedByLike = async (req, res) => {
  const { page } = req.params;
  const pageSize = 30; // 페이지당 항목 수
  const offset = (page - 1) * pageSize; // 오프셋 계산
  const cachedKey = req.originalUrl;

  const cacheData = labCachero
    .cSort(["like_count", "created_at"], "DESC")
    .paginate(page, pageSize)
    .select(["id", "title", "background_img", "start_obj", "end_obj", "created_at", "like_count", "maker_name", "maker_img"])
    .get();

  if (String(cacheData.length) === String(labCachero.getCount()) || cacheData.length >= pageSize + offset) {
    console.log("cachero hit!")
    return res.json(cacheData)
  }

  try {
    const result = await pool.query(`
      SELECT lab.id, title, background_img, start_obj, end_obj, created_at, liked_user,
      COALESCE(ARRAY_LENGTH(liked_user, 1), 0) AS like_count,
      users.name AS maker_name, users.profile_img AS maker_img
      FROM lab 
      INNER JOIN users ON lab.maker_id = users.id
      ORDER BY COALESCE(ARRAY_LENGTH(liked_user, 1), 0) DESC, created_at DESC
      LIMIT $1 OFFSET $2;
    `, [pageSize * 2, offset]);
    console.log("labCachero miss!")
    labCachero.cMerge(result.rows, cachedKey);

    for (let i = 0; i < result.rows.length; i++) {
      delete result.rows[i].liked_user
    }
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
  const cachedKey = req.originalUrl;

  const cacheData = labCachero
    .cSort(["created_at"], "DESC")
    .paginate(page, pageSize)
    .select(["id", "title", "background_img", "start_obj", "end_obj", "created_at", "like_count", "maker_name", "maker_img"])
    .get();
  console.log(labCachero.isCached(cachedKey))
  if (String(cacheData.length) === String(labCachero.getCount()) || cacheData.length >= pageSize + offset) {
    console.log("cachero hit!")
    return res.json(cacheData)
  }

  try {
    const result = await pool.query(`
      SELECT lab.id, title, background_img, start_obj, end_obj, created_at, liked_user,
      COALESCE(ARRAY_LENGTH(liked_user, 1), 0) AS like_count,
      users.name AS maker_name, users.profile_img AS maker_img
      FROM lab 
      INNER JOIN users ON lab.maker_id = users.id
      ORDER BY created_at DESC
      LIMIT $1 OFFSET $2;
    `, [pageSize * 2, offset]);
    console.log("labCachero miss!")
    labCachero.cMerge(result.rows, cachedKey)
    for (let i = 0; i < result.rows.length; i++) {
      delete result.rows[i].liked_user
    }
    res.json(result.rows.slice(0, pageSize));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'An error occurred' });
  }
}

export const getOneById = async (req, res) => {
  const { id } = req.params;
  const { userId } = req.body;

  const cacheData = labCachero
    .cFilter("id", id)
    .unselect(["liked_user"])
    .get()[0]

  if (cacheData && cacheData.hasOwnProperty("find_obj")) {
    for (let key in cacheData.find_obj) {
      if (key !== userId) delete cacheData.find_obj[key];
    }
    console.log("labCachero Hit!")
    return res.json(cacheData);
  }

  try {
    const result = await pool.query(`
      SELECT lab.id, title, objects, background_img, combinate, start_obj, end_obj, find_obj, created_at, liked_user,
      COALESCE(ARRAY_LENGTH(liked_user, 1), 0) AS like_count,
      users.name AS maker_name, users.profile_img AS maker_img
      FROM lab
      INNER JOIN users ON lab.maker_id = users.id
      WHERE lab.id = $1;
    `, [id]);
    const resultData = result.rows[0]
    console.log("labCachero miss!")

    labCachero.cMerge([result.rows[0]])

    delete resultData.liked_user
    for (let key in resultData.find_obj) {
      if (key !== userId) delete resultData.find_obj[key];
    }

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

  const cacheData = labCachero
    .cFilter("maker_id", makerId)
    .paginate(page, pageSize)
    .unselect(['liked_user'])
    .select(["id", "title", "background_img", "start_obj", "end_obj", "created_at", "updated_at", "like_count"])
    .get();

  if (String(cacheData.length) === String(labCachero.getCount()) || cacheData.length >= pageSize + offset) {
    console.log("cachero hit!")
    return res.json(cacheData)
  }

  try {
    const result = await pool.query(`
      SELECT id, title, background_img, start_obj, end_obj, created_at, updated_at, liked_user,
      COALESCE(ARRAY_LENGTH(liked_user, 1), 0) AS like_count
      FROM lab
      WHERE maker_id = $1
      ORDER BY updated_at DESC
      LIMIT $2 OFFSET $3;
    `, [makerId, pageSize * 2, offset]);

    labCachero.cMerge(result.rows)
    for (let index = 0; index < result.rows.length; index++) {
      delete result.rows[index].liked_user
    }
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
    labCachero.cCreate({ id, title, maker_id, objects, background_img, combinate, start_obj, end_obj, find_obj, liked_user, like_count: 0, created_at: timestamp, updated_at: timestamp, maker_name, maker_img })
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
    const { title, objects, background_img, combinate, start_obj, end_obj } = data
    const cachedData = labCachero.cFilter("id", id).get()[0]

    if (cachedData) {
      const timestamp = new Date().toISOString();
      labCachero.cMerge([{ id, title, objects, background_img, combinate, start_obj, end_obj, updated_at: timestamp }])

      return res.json(`Updated lab, id:${id}`);
    }

    return res.json(`Please in update page`);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'An error occurred' });
  }
}

export const updateLabLike = async (req, res) => {
  const { id, userId } = req.params;
  try {
    const cacheData = labCachero.cFilter("id", id).get()[0]
    const likedUser = cacheData.liked_user
    console.log(cacheData)
    if (likedUser.includes(userId)) {
      likedUser.splice(likedUser.indexOf(userId), 1);
    } else {
      likedUser.push(userId)
    }
    labCachero.cMerge([{ id, like_count: likedUser.length, liked_user: likedUser }])

    res.json("Updated successfully");

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'An error occurred' });
  }
}

export const deleteLabById = async (req, res) => {
  const { id } = req.params;
  try {
    labCachero.cRemove(id)
    res.json({ message: 'Lab deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'An error occurred' });
  }
}