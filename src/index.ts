import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import screenshotRouter, { initializeServices, closeServices } from './routes/screenshot';
import { Config } from './config';
import packageJson from '../package.json';

const app = express();

// Request logging middleware
app.use((req, res, next) => {
  const startTime = Date.now();
  const originalSend = res.send;
  
  res.send = function(body) {
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    const timestamp = new Date().toISOString();
    
    console.log(`[${timestamp}] ${req.method} ${req.originalUrl} - ${res.statusCode} - ${responseTime}ms`);
    
    return originalSend.call(this, body);
  };
  
  next();
});

app.use(helmet());
app.use(cors());
app.use(express.json());

app.use('/api', screenshotRouter);

app.get('/', (req, res) => {
  res.json({
    name: packageJson.name,
    version: packageJson.version,
    description: packageJson.description,
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