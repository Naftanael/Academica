import fs from 'fs/promises';
import path from 'path';

const dataDir = path.join(process.cwd(), 'src', 'data');

export async function readData<T>(filename: string): Promise<T[]> {
  try {
    const filePath = path.join(dataDir, filename);
    await fs.access(filePath); // Check if file exists
    const jsonData = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(jsonData) as T[];
  } catch (error) {
    // If file doesn't exist or other error, return empty array
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      // Create the file with an empty array if it doesn't exist
      await writeData(filename, []);
      return [];
    }
    console.error(`Error reading data from ${filename}:`, error);
    return [];
  }
}

export async function writeData<T>(filename: string, data: T[]): Promise<void> {
  try {
    const filePath = path.join(dataDir, filename);
    await fs.mkdir(dataDir, { recursive: true }); // Ensure data directory exists
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error(`Error writing data to ${filename}:`, error);
    throw error; // Re-throw to be handled by Server Action
  }
}

export function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 9)}`;
}
