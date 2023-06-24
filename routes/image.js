import { s3 } from "../declare.js";

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
      return presignURL;
    }));
    console.log(url)
    return res.json(url);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'An error occurred' });
  }
}