import path from "path";
import { ImagePath, s3 } from "../declare.js";
import fs from "fs"

async function makePresignURL(fileName) {
  const params = {
    Bucket: "odda-lab",
    Key: fileName,
    Expires: 60
  }

  const signedURL = await s3.getSignedUrlPromise('putObject', params);
  return signedURL
}

export const getImagePresignURL = async (req, res) => {
  const { fileNames } = req.body;
  try {
    const url = await Promise.all(fileNames.map(async (data) => {
      const presignURL = await makePresignURL(data);
      return { [data]: presignURL };
    }));
    return res.json(url);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'An error occurred' });
  }
}

const imageData = []

export const refreshImage = () => {
  imageData.map(({ id, expire }) => {
    if (!(expire <= new Date())) return;
    const imagePath = path.join(ImagePath, id);
    fs.unlink(imagePath, (err) => err ? console.log(`파일 삭제 오류 (${id}):`, err) : null);
  })
}
export const getImageFile = async (req, res) => {
  const { fileName } = req.params;
  const imagePath = path.join(ImagePath, fileName);
  const targetIndex = imageData.findIndex(item => item.id === fileName);
  if (fs.existsSync(imagePath) && targetIndex) {
    const newExpire = new Date(imageData[targetIndex].expire.getTime() + 15 * 60 * 1000);
    imageData[targetIndex] = { ...imageData[targetIndex], expire: newExpire }
    return res.sendFile(imagePath)
  }
  const params = {
    Bucket: "odda-lab",
    Key: fileName,
  }
  s3.getObject(params, (err, data) => {
    if (err) return res.status(404).json("Image not found");
    const imageBuffer = data.Body;
    res.contentType(data.ContentType);
    res.send(imageBuffer);

    imageData.push({ id: fileName, expire: new Date() })
    // @ts-ignore
    fs.writeFileSync(imagePath, imageBuffer);
  })
}