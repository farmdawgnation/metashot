import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import screenshotRouter, { initializeServices, closeServices } from './routes/screenshot';
import { Config } from './config';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.use('/api', screenshotRouter);

app.get('/', (req, res) => {
  res.json({
    name: 'Metashot API',
    version: '1.0.0',
    description: 'Generate PNG images from Metabase embed URLs',
  });
});

async function startServer(): Promise<void> {
  try {
    await initializeServices();
    
    const server = app.listen(Config.port, () => {
      console.log(`Server running on port ${Config.port}`);
    });

    process.on('SIGTERM', async () => {
      console.log('Received SIGTERM, shutting down gracefully');
      await closeServices();
      server.close(() => {
        process.exit(0);
      });
    });

    process.on('SIGINT', async () => {
      console.log('Received SIGINT, shutting down gracefully');
      await closeServices();
      server.close(() => {
        process.exit(0);
      });
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();