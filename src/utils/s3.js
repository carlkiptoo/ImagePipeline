import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import {getSignedUrl} from "@aws-sdk/s3-request-presigner";
import dotenv from "dotenv";

dotenv.config();

const s3 = new S3Client({region: process.env.AWS_REGION});

export const getSignedUrlForGet = async (key, expiresIn = 3600) => {
    const command = new GetObjectCommand({
        Bucket: process.env.AWS_BUCKET,
        Key: key,
    });

    return await getSignedUrl(s3, command, {expiresIn});
};

export const getSignedUrlForPut = async (key, expiresIn = 3600) => {
    const command = new PutObjectCommand({
        Bucket: process.env.AWS_BUCKET,
        Key: key,
    });
    return await getSignedUrl(s3, command, {expiresIn});
}