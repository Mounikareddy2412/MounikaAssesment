import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { randomUUID } from 'node:crypto';
import bcrypt from 'bcryptjs';

const initialUsers = [
  { email: 'alex@example.com', name: 'Alex', password: 'demo1234' },
  { email: 'sam@example.com', name: 'Sam', password: 'demo1234' }
];

export class FileStore {
  constructor(filePath) {
    this.filePath = filePath;
    this.writeChain = Promise.resolve();
  }

  async init() {
    await mkdir(dirname(this.filePath), { recursive: true });

    try {
      await readFile(this.filePath, 'utf8');
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;

      const users = await Promise.all(
        initialUsers.map(async (user) => ({
          id: randomUUID(),
          email: user.email,
          name: user.name,
          passwordHash: await bcrypt.hash(user.password, 10)
        }))
      );

      await this.persist({ users, tasks: [] });
    }
  }

  async read() {
    const raw = await readFile(this.filePath, 'utf8');
    return JSON.parse(raw);
  }

  async update(mutator) {
    // I serialize writes here so two quick browser actions cannot overwrite each other.
    const operation = this.writeChain.catch(() => undefined).then(async () => {
      const data = await this.read();
      const result = await mutator(data);
      await this.persist(data);
      return result;
    });

    // I keep the queue usable even if one request fails validation midway through a write.
    this.writeChain = operation.catch(() => undefined);
    return operation;
  }

  async persist(data) {
    const tempPath = `${this.filePath}.tmp`;
    await writeFile(tempPath, JSON.stringify(data, null, 2));
    await rename(tempPath, this.filePath);
  }
}
