import { Router } from "express";
import upload from "../middleware/upload.js";
import { processAndSaveImage } from "../services/imageService.js";
import crypto from "crypto";
import { getSignedUrlForGet } from "../utils/s3.js";


const router = Router();

router.post('/', upload.single('image'), async (req, res, next) => {
    try {
        if (!req.file) {
            throw new Error('No file uploaded');
        }
        const uniqueName = crypto.randomBytes(16).toString('hex') + '.webp';

        const s3Url = await processAndSaveImage(req.file.buffer, uniqueName);

        res.json({
            message: "Image uploaded successfully",
            file: {
                name: uniqueName,
                url: s3Url,
            },
        });
    } catch (error) {
        console.error(error);
        next(error);
    }
});

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