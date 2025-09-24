import { PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import {getSignedUrl} from "@aws-sdk/s3-request-presigner";
import dotenv from "dotenv";
import { s3 } from "./s3Client.js";

dotenv.config();

const BUCKET = process.env.AWS_BUCKET;

export async function uploadBufferToS3(buffer, key, contentType, acl = "private") {
    const command = new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        Body: buffer,
        ContentType: contentType,
        ACL: acl,
    });
    await s3.send(command);
    return key;
}


export const getSignedUrlForGet = async (key, expiresIn = 3600) => {
    const command = new GetObjectCommand({
        Bucket: BUCKET,
        Key: key,
    });

    return await getSignedUrl(s3, command, {expiresIn});
};