import NodeCache from 'node-cache';
import pg from 'pg';
import dotenv from "dotenv"
import S3 from "aws-sdk/clients/s3.js"
import { createCachero } from './cachero/index.js';
import { createClient } from 'redis';
import { fileURLToPath } from "url";
import path from 'path';

const { Pool } = pg


dotenv.config();

// @ts-ignore
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const ImagePath = path.join(__dirname, 'image');

export const s3 = new S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: 'ap-northeast-2',
});

export const pool = new Pool({
  user: process.env.PG_NAME,
  host: process.env.PG_HOST,
  database: process.env.PG_DATABASE,
  password: process.env.PG_PASSWORD,
  port: 5432,
});

export const cache = new NodeCache();

export const getFromCache = (req, res, next) => {
  const key = req.method + req.originalUrl;
  const cachedData = cache.get(key);
  if (cachedData !== undefined) {
    console.log('Cache hit:', key);
    return res.send(cachedData);
  }
  console.log('Cache miss:', key);
  next();
};

export const setCache = (req, data) => {
  cache.set(req.method + req.originalUrl, data, 30000);
}

export const redis = createClient({
  url: `redis://${process.env.REDIS_USERNAME}:${process.env.REDIS_PASSWORD}@${process.env.REDIS_HOST}:${process.env.REDIS_PORT}/0`,
  // legacyMode: true
});

const cachero = createCachero()

export const labCachero = cachero.getTable("lab")