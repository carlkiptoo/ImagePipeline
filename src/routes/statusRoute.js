import express from "express";
import IORedis from "ioredis";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import {s3} from "../utils/s3Client.js";
import dotenv from "dotenv";
import {GetObjectCommand} from "@aws-sdk/client-s3";
dotenv.config();

const router = express.Router();
const redis = new IORedis(process.env.REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
});

const BUCKET = process.env.AWS_BUCKET;

router.get("/:fileId", async (req, res) => {
    const {fileId} = req.params;
    const metadataKey = `image:meta:${fileId}`;

    try {
        const data = await redis.hgetall(metadataKey);

        if (!data || !data.status) {
            return res.status(404).json({error: "File not found"});
        }

        if (data.status !== "done") {
            return res.json({
                status: data.status,
                error: data.error || null
            });
        }

        let variants = [];

        try {
            variants = JSON.parse(data.variants);
        } catch (error) {
            console.error("Error parsing variants:", error);
        }

        const variantsWithUrls = await Promise.all(
            variants.map(async (v) => {
                const cmd = new GetObjectCommand({
                    Bucket: BUCKET,
                    Key: v.key
                });

                const url = await getSignedUrl(s3, cmd, {expiresIn: 3600});
                return {...v, url};
            })
        );
        res.json({
            status: "done",
            fileId,
            processedAt: data.processedAt,
            variants: variantsWithUrls,
        });
    } catch (error) {
        console.error("Error getting status:", error);
        res.status(500).json({error: "Error getting status"});
    }
})

export default router;