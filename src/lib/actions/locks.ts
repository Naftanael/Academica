
import fs from 'fs/promises';
import path from 'path';

const lockDir = path.join(process.cwd(), 'locks');

async function acquireLock(lockFile: string, timeout = 5000): Promise<void> {
  const startTime = Date.now();
  while (true) {
    try {
      await fs.mkdir(lockFile, { recursive: true });
      return;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'EEXIST') {
        throw error;
      }
      if (Date.now() - startTime > timeout) {
        throw new Error(`Could not acquire lock for ${lockFile} within ${timeout}ms`);
      }
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  }
}

export async function createLock(resource: string): Promise<string> {
  const lockFile = path.join(lockDir, `${resource}.lock`);
  await acquireLock(lockFile);
  return lockFile;
}

export async function releaseLock(resource: string, lockFile: string): Promise<void> {
  try {
    await fs.rmdir(lockFile, { recursive: true });
  } catch (error) {
    console.error(`Failed to release lock for ${resource}:`, error);
  }
}
