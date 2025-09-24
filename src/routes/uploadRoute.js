import { Router } from "express";
import upload from "../middleware/upload.js";
import { processAndSaveImage } from "../services/imageService.js";
import crypto from "crypto";
import path from "path";

const router = Router();

router.post('/', upload.single('image'), async (req, res, next) => {
    try {
        if (!req.file) {
            throw new Error('No file uploaded');
        }
        const uniqueName = crypto.randomBytes(16).toString('hex') + '.webp';

        const filePath = await processAndSaveImage(req.file.buffer, uniqueName);

        res.json({
            message: "Image uploaded successfully",
            file: {
                name: uniqueName,
                path: filePath,
                url: `/uploads/${uniqueName}`,
            },
        });
    } catch (error) {
        console.error(error);
        next(error);
    }
});

export default router;