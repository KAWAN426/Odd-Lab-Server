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

export const getImage = async (req, res) => {
  const { fileName } = req.params;
  const imagePath = path.join(ImagePath, fileName);
  if (fs.existsSync(imagePath)) {
    return res.sendFile(imagePath)
  }
  const params = {
    Bucket: "odda-lab",
    Key: fileName,
  }
  s3.getObject(params, (err, data) => {
    if (err) {
      return res.status(404).json("Image not found");
    }
    const imageBuffer = data.Body;
    res.contentType(data.ContentType);
    res.send(imageBuffer);
    // @ts-ignore
    fs.writeFileSync(imagePath, imageBuffer);
  })
}