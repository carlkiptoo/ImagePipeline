import { Router } from "express";
import upload from "../middleware/upload.js";
import { getSignedUrlForGet, uploadBufferToS3 } from "../utils/s3.js";
import { redisClient } from "../queue/queue.js";
import { imageQueue } from "../queue/queue.js";
import {v4 as uuidv4} from 'uuid';
const router = Router();

router.post('/', upload.single('image'), async (req, res, next) => {
    try {
        if (!req.file) {
            throw new Error('No file uploaded');
        }

        const fileId = uuidv4();
        const originalKey = `images/${fileId}_original${getExtFromMime(req.file.mimetype)}`;

        await uploadBufferToS3(req.file.buffer, originalKey, req.file.mimetype, "private");

        const metadataKey = `image:meta:${fileId}`;
        await redisClient.hset(metadataKey, {
            fileId,
            originalKey,
            status: "queued",
            createdAt: Date.now(),
        });

        const job = await imageQueue.add("generate-variants", {fileId, originalKey});
        const signedOriginal = await getSignedUrlForGet(originalKey, Number(process.env.SIGNED_URL_EXPIRES || 600));

        return res.status(202).json({
            success: true,
            fileId,
            jobId: job.id,
            original: {key: originalKey, url: signedOriginal},
        });
    } catch (error) {
        console.error(error);
        next(error);
    }
});

function getExtFromMime(mime) {
    switch (mime) {
        case 'image/jpeg':
            return '.jpg';
        case 'image/png':
            return '.png';
        case 'image/webp':
            return '.webp';
        case 'image/avif':
            return '.avif';
        default:
            return '';
    }
}

router.get('/signed-url/:key', async (req, res) => {
    try {
        const {key} = req.params;

        if (!key) {
            return res.status(400).json({error: 'File key is required'});
        }

        const url = await getSignedUrlForGet(`images/${key}`, 60 * 10);

        res.json({
            success: true,
            url,
        });
    } catch (error) {
        console.error('Error getting signed URL:', error);
        res.status(500).json({error: 'Error getting signed URL'});
    }
})

export default router;