import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import dotenv from "dotenv";

dotenv.config();

const s3 = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});

export async function uploadToS3(buffer, key, mimetype) {
    const params = {
        Bucket: process.env.AWS_BUCKET,
        Key: key,
        Body: buffer,
        ContentType: mimetype,

    };

    const command = new PutObjectCommand(params);
    await s3.send(command);
}