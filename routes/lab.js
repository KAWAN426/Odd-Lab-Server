import { labCachero, pool, userCachero } from "../declare.js";
import { v4 as uuidv4 } from 'uuid';

const removeItems = (dataList, itemList) => {
  for (let i = 0; i < dataList.length; i++) {
    itemList.forEach((item) => {
      delete dataList[i][item]
    })
  }
  return dataList
}

export const getDataByKeyword = async (req, res) => {
  const { page } = req.params;
  const { keywords } = req.body;
  const pageSize = 30; // 페이지당 항목 수
  const offset = (page - 1) * pageSize; // 오프셋 계산
  // try {
  //   const searchQuery = keywords.map(keyword => `title ILIKE '%${keyword}%'`).join(' OR ');
  //   const result = await pool.query(`  
  //     SELECT lab.*,
  //     COALESCE(ARRAY_LENGTH(liked_user, 1), 0) AS like_count,
  //     users.name AS maker_name, users.profile_img AS maker_img
  //     FROM lab
  //     JOIN users ON lab.maker_id = users.id
  //     WHERE ${searchQuery};
  //     ORDER BY COALESCE(ARRAY_LENGTH(liked_user, 1), 0) DESC, created_at DESC
  //     LIMIT $1 OFFSET $2;
  //   `, [pageSize, offset])
  //   for (let i = 0; i < result.rows.length; i++) {
  //     if (result.rows[i].id === labCachero.getDeleted()) result.rows[i].splice(i, 1)
  //   }
  //   // TODO: 기본 캐시키능 추가
  //   res.json(result.rows);
  // } catch (err) {
  //   console.error(err);
  //   res.status(500).json({ error: 'An error occurred' });
  // }
}
export const getListOrderedByLike = async (req, res) => {
  const { page } = req.params;
  const pageSize = 30; // 페이지당 항목 수
  const offset = (page - 1) * pageSize; // 오프셋 계산
  const cachedKey = req.originalUrl;


  const result = await labCachero.select({
    column: [
      "lab.*",
      "COALESCE(ARRAY_LENGTH(liked_user, 1), 0) AS like_count",
      "users.name AS maker_name",
      "users.profile_img AS maker_img"
    ],
    order: ["like_count DESC", "created_at DESC"],
    join: "users ON lab.maker_id = users.id",
    limit: pageSize,
    offset
  }, cachedKey)

  for (let i = 0; i < result.length; i++) {
    const { start_obj, objects } = result[i]
    start_obj.forEach((id, index) => {
      const foundItem = objects.find(item => item.id === id);
      if (foundItem) start_obj[index] = foundItem;
    });
    delete result[i].liked_user
    delete result[i].objects
  }

  res.json(result);
}

export const getListOrderedByNewest = async (req, res) => {
  const { page } = req.params;
  const pageSize = 30; // 페이지당 항목 수
  const offset = (page - 1) * pageSize; // 오프셋 계산
  const cachedKey = req.originalUrl;

  const result = await labCachero.select({
    column: [
      "lab.*",
      "COALESCE(ARRAY_LENGTH(liked_user, 1), 0) AS like_count",
      "users.name AS maker_name",
      "users.profile_img AS maker_img"
    ],
    order: ["created_at DESC"],
    join: "users ON lab.maker_id = users.id",
    limit: pageSize,
    offset
  }, cachedKey)

  for (let i = 0; i < result.length; i++) {
    const { start_obj, objects } = result[i]
    start_obj.forEach((id, index) => {
      const foundItem = objects.find(item => item.id === id);
      if (foundItem) start_obj[index] = foundItem;
    });
    delete result[i].liked_user
    delete result[i].objects
  }

  removeItems(result, ["liked_user", "objects", "end_obj", "combinate", "find_obj"])

  res.json(result);
}

export const getOneById = async (req, res) => {
  const { id } = req.params;
  const { userId } = req.body;

  const result = await labCachero.select({
    column: [
      "lab.*",
      "COALESCE(ARRAY_LENGTH(liked_user, 1), 0) AS like_count",
      "users.name AS maker_name",
      "users.profile_img AS maker_img"
    ],
    join: "users ON lab.maker_id = users.id",
    where: {
      cond1: ['lab.id', '=', id],
      result: ['cond1']
    }
  })

  delete result[0].liked_user
  for (let key in result[0].find_obj) {
    if (key !== userId) delete result[0].find_obj[key];
  }

  res.json(result[0]);
}

export const getListByMakerId = async (req, res) => {
  const { makerId, page } = req.params;
  const pageSize = 30; // 페이지당 항목 수
  const offset = (page - 1) * pageSize; // 오프셋 계산
  const cachedKey = req.originalUrl;

  const result = await labCachero.select({
    column: [
      "lab.*",
      "COALESCE(ARRAY_LENGTH(liked_user, 1), 0) AS like_count",
    ],
    order: ["updated_at DESC"],
    where: {
      cond1: ['maker_id', '=', makerId],
      result: ['cond1']
    },
    limit: pageSize,
    offset,
  }, cachedKey)

  for (let i = 0; i < result.length; i++) {
    const { start_obj, objects } = result[i]
    start_obj.forEach((id, index) => {
      const foundItem = objects.find(item => item.id === id);
      if (foundItem) start_obj[index] = foundItem;
    });
    delete result[i].liked_user
    delete result[i].objects
  }

  res.json(result);
}

export const createLab = async (req, res) => {
  const data = req.body;
  try {
    const getUserData = await userCachero.select({
      column: ["*"],
      where: {
        condition: ["id", "=", data.maker_id],
        result: ["condition"]
      }
    })
    if (getUserData.length === 0)
      return res.status(404).json({ error: `Cannot found user, id:${data.maker_id}` });

    const id = uuidv4();
    const { title, maker_id, objects, background_img, combinate, start_obj, end_obj } = data
    const maker_name = getUserData[0].name
    const maker_img = getUserData[0].profile_img
    const timestamp = new Date().toISOString();
    const find_obj = data.find_obj || "{}"
    const liked_user = []

    labCachero.create({ id, title, maker_id, objects, background_img, combinate, start_obj, end_obj, find_obj, liked_user, like_count: 0, created_at: timestamp, updated_at: timestamp, maker_name, maker_img })
    res.json(`Created new lab, id:${id}`);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'An error occurred' });
  }
}

export const updateLab = async (req, res) => {
  const { id } = req.params;
  const data = req.body;
  const timestamp = new Date().toISOString();
  const updateData = { id, updated_at: timestamp }
  Object.keys(data).forEach((key) => {
    updateData[key] = data[key]
  })
  labCachero.update([updateData])

  return res.json(`Updated lab, id:${id}`);
}

export const updateLabLike = async (req, res) => {
  const { id, userId } = req.params;
  const result = await labCachero.select({
    column: ['*'],
    where: {
      condition1: ['id', '=', id],
      result: ["condition1"]
    }
  })
  const cacheData = result[0]
  if (!cacheData || result.length === 0) return res.status(400).json({ error: `Cannot found data, id: ${id}` });
  const likedUser = [...cacheData.liked_user]
  if (likedUser.includes(userId)) {
    likedUser.splice(likedUser.indexOf(userId), 1);
  } else {
    likedUser.push(userId)
  }
  labCachero.update({ id, like_count: likedUser.length, liked_user: likedUser })

  return res.json(`Updated lab like, id:${id}`);
}

export const deleteLabById = async (req, res) => {
  const { id } = req.params;
  try {
    labCachero.delete({ id })
    res.json({ message: 'Lab deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'An error occurred' });
  }
}