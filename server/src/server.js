import 'dotenv/config';
import { resolve } from 'node:path';
import { createApp } from './app.js';
import { FileStore } from './store/fileStore.js';

const port = Number(process.env.PORT ?? 4000);
const jwtSecret = process.env.JWT_SECRET ?? 'local-development-secret';
const dataFile = resolve(process.cwd(), process.env.DATA_FILE ?? './data/app-data.json');
const store = new FileStore(dataFile);

await store.init();

const app = createApp({
  store,
  jwtSecret,
  clientOrigin: process.env.CLIENT_ORIGIN ?? 'http://localhost:5173'
});

app.listen(port, () => {
  console.log(`To Do API listening on http://localhost:${port}`);
});
