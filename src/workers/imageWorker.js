import {Worker} from 'bullmq';
import IORedis from 'ioredis';
import dotenv from 'dotenv';
import {s3}  from "../utils/s3Client.js";
import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import sharp from 'sharp';

dotenv.config();

const connection = new IORedis(process.env.REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
});
const BUCKET = process.env.AWS_BUCKET;
const redisClient = connection;

const VARIANTS = [
    {name: "thumbnail", width: 200, format: "webp", quality: 70},
    {name: "medium", width: 800, format: "webp", quality: 80},
    {name: "original_webp", width: null, format: "webp", quality: 80}
];

async function fetchObjectFromS3(key) {
    const command = new GetObjectCommand({Bucket: BUCKET, Key: key});
    const response = await s3.send(command);

    const chunks = [];
    for await (const chunk of response.Body) chunks.push(chunk);
    return Buffer.concat(chunks);
}

async function uploadBuffer(key, buffer, contentType) {
    const cmd = new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        Body: buffer,
        ContentType: contentType,
        ACL: "private",
    });
    await s3.send(cmd);
}

const worker = new Worker("image-processing", async (job) => {
    const {fileId, originalKey} = job.data;
    const metadataKey = `image:meta:${fileId}`;

    try {
        await redisClient.hset(metadataKey, "status", "processing", "startedAt", Date.now());

        const originalBuffer = await fetchObjectFromS3(originalKey);

        const uploadedVariants = [];

        for (const v of VARIANTS) {
            let img = sharp(originalBuffer).rotate();
            if (v.width) img = img.resize({width: v.width, withoutEnlargement: true});
            img = img.toFormat(v.format, {quality: v.quality});

            const outBuffer = await img.toBuffer();
            const variantKey = `images/${fileId}_${v.name}${v.format}`;

            await uploadBuffer(variantKey, outBuffer, `image/${v.format === "jpg" ? "jpeg" : v.format}`);

            uploadedVariants.push({name: v.name, key: variantKey, contentType: `image/${v.format}`});
        }

        await redisClient.hset(metadataKey, {
            status: "done",
            processedAt: Date.now(),
            variants: JSON.stringify(uploadedVariants),
        });

        return {uploadedVariants};
    } catch (error) {
        console.error('Worker error:', error);
        await redisClient.hset(metadataKey, "status", "failed", "error", error.message || String(error));
        throw error;
    }
}, {connection});

worker.on("failed", (job, error) => {
    console.error("Job failed:", job.id, error);
});

console.log("Image worker started");