
import fs from 'fs/promises';
import path from 'path';

const dataDir = path.join(process.cwd(), 'src', 'data');

export async function readData<T>(filename: string): Promise<T[]> {
  const filePath = path.join(dataDir, filename);
  try {
    // fs.readFile will throw an error if the file doesn't exist (ENOENT),
    // which is caught below.
    const jsonData = await fs.readFile(filePath, 'utf-8');

    // Handle cases where the file might be empty or contain only whitespace
    if (!jsonData || jsonData.trim() === '') {
      // If the file is empty, treat it as an empty array.
      // This also prevents JSON.parse from throwing on empty input.
      return [];
    }

    // Attempt to parse the JSON data
    return JSON.parse(jsonData) as T[];
  } catch (error) {
    const nodeError = error as NodeJS.ErrnoException;
    if (nodeError.code === 'ENOENT') {
      // File doesn't exist. Create it with an empty array.
      // writeData will ensure the dataDir exists.
      await writeData<T>(filename, []);
      return [];
    }
    // For other errors (e.g., malformed JSON, permissions issues), log and return empty.
    // This makes the read operation resilient against corrupted files.
    console.error(`Error reading or parsing data from ${filename}:`, nodeError.message);
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
    throw error; // Re-throw to be handled by Server Action or caller
  }
}

export function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 9)}`;
}
