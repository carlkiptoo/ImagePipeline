import sharp from 'sharp';
import path from 'path';
import fs from 'fs';

const uploadDir = process.env.UPLOAD_DIR || './uploads';

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, {recursive: true});
}

export async function processAndSaveImage(fileBuffer, fileName) {
    const filePath = path.join(uploadDir, fileName);

    await sharp(fileBuffer).resize({width: 1920, withoutEnlargement: true}).toFormat('webp', {quality: 80}).toFile(filePath);

    return filePath;
}