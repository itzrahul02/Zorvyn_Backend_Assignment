import 'dotenv/config';
import { createApp } from './app.js';
import { connectDb } from './config/db.js';
import mongoose from 'mongoose';

const port = Number(process.env.PORT) || 5000;
const mongoUri = process.env.MONGODB_URI;

const jwtSecret = process.env.JWT_SECRET;

if (!mongoUri) {
  console.error('Missing MONGODB_URI');
  process.exit(1);
}

if (!jwtSecret) {
  console.error('Missing JWT_SECRET');
  process.exit(1);
}

await connectDb(mongoUri);
const app = createApp();

let server;

async function shutdown(code = 0) {
  try {
    console.log('Shutting down...');
    if (server && typeof server.close === 'function') {
      server.close(() => {
        mongoose.disconnect().finally(() => process.exit(code));
      });
    } else {
      await mongoose.disconnect();
      process.exit(code);
    }
    // Fallback in case shutdown hangs
    setTimeout(() => process.exit(code), 5000);
  } catch (err) {
    console.error('Error during shutdown', err);
    process.exit(1);
  }
}

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
  shutdown(1);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  shutdown(1);
});

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));

async function startServerTry(portToTry, attempts = 5) {
  try {
    return await new Promise((resolve, reject) => {
      const s = app.listen(portToTry, () => {
        console.log(`API listening on http://localhost:${portToTry}`);
        resolve(s);
      });

      s.on('error', (err) => {
        if (err && err.code === 'EADDRINUSE') {
          console.warn(`Port ${portToTry} is in use.`);
          s.close();
          if (attempts > 0) {
            console.log(`Trying port ${portToTry + 1}... (${attempts - 1} attempts left)`);
            // small delay before retrying to avoid tight loop
            setTimeout(() => {
              startServerTry(portToTry + 1, attempts - 1).then(resolve).catch(reject);
            }, 200);
          } else {
            reject(new Error(`No available ports after retries (last tried ${portToTry})`));
          }
        } else {
          reject(err);
        }
      });
    });
  } catch (err) {
    throw err;
  }
}

(async () => {
  try {
    server = await startServerTry(port, 10);
  } catch (err) {
    console.error('Failed to start server:', err);
    shutdown(1);
  }
})();
