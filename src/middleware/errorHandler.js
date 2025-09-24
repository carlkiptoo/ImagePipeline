import multer from 'multer';


export function errorHandler(err, req, res, next) {
    if (err instanceof multer.MulterError) {
        let message = "Upload error";

        switch (err.code) {
            case 'LIMIT_FILE_SIZE':
                message = `File size limit exceeded`;
                break;
            case 'LIMIT_UNEXPECTED_FILE':
                message = `Unexpected file`;
                break;
            default:
                message = err.message;
        }

        return res.status(400).json({error: message});
    }

    if (err.message && err.message.includes("ONLY JPEG")) {
        return res.status(400).json({error: err.message});
    }

    console.error("Unexpected error:", err);
    return res
}