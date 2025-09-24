import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

const connection = new IORedis(process.env.REDIS_URL);

export const imageQueue = new Queue("image-processing", {connection});
export const redisClient = connection;