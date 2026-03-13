import express from 'express';
import cors from 'cors';
import { config } from './config';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// TODO: Mount route handlers
// app.use('/api/auth', authRouter);
// app.use('/api/notes', notesRouter);

app.listen(config.port, () => {
  console.log(`Server running on port ${config.port}`);
});

export default app;
