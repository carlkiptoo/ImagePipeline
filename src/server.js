import express from 'express';
import dotenv from 'dotenv';
import uploadRouter from './routes/uploadRoute.js';
import statusRouter from './routes/statusRoute.js';
import {errorHandler} from './middleware/errorHandler.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.get('/health', (req, res) => res.json({status: "ok"}));

app.use('/uploads', express.static('uploads'));

app.use('/api/upload', uploadRouter);

app.use('/status', statusRouter);

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);

})