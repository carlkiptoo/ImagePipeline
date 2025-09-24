import sharp from 'sharp';
import { uploadToS3 } from './s3Services.js';
import path from 'path';
import fs from 'fs';

// const uploadDir = process.env.UPLOAD_DIR || './uploads';

// if (!fs.existsSync(uploadDir)) {
//     fs.mkdirSync(uploadDir, {recursive: true});
// }

export async function processAndSaveImage(fileBuffer, fileName) {
   const processedBuffer = await sharp(fileBuffer).resize({width: 1920, withoutEnlargement: true}).toBuffer();

   const s3Url = await uploadToS3(processedBuffer, `images/${fileName}`, "image/webp");
   return s3Url;
}