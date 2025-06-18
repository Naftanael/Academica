
import fs from 'fs/promises';
import path from 'path';

const dataDir = path.join(process.cwd(), 'src', 'data');

export async function readData<T>(filename: string): Promise<T[]> {
  const filePath = path.join(dataDir, filename);
  try {
    const jsonData = await fs.readFile(filePath, 'utf-8');

    if (!jsonData || jsonData.trim() === '') {
      return [];
    }

    const parsedData = JSON.parse(jsonData);

    if (!Array.isArray(parsedData)) {
      console.warn(`Data in ${filename} is not an array. Content was: ${JSON.stringify(parsedData)}. Overwriting with empty array.`);
      try {
        await writeData<T>(filename, []); // Attempt to fix the file
      } catch (writeError) {
        console.error(`Error attempting to overwrite malformed file ${filename}:`, (writeError as Error).message);
        // Still return [] to allow the app to proceed, albeit with a warning about the failed write.
      }
      return [];
    }

    // Filter out null, undefined, or non-object items from the array.
    // This helps prevent TypeErrors if the array contains malformed entries.
    const validItems = parsedData.filter(item => item !== null && typeof item === 'object');

    return validItems as T[]; // This is still a type assertion, but the data is cleaner.
  } catch (error) {
    const nodeError = error as NodeJS.ErrnoException;
    if (nodeError.code === 'ENOENT') {
      try {
        await writeData<T>(filename, []);
      } catch (writeError) {
        console.error(`Error creating initial data file ${filename} after ENOENT:`, (writeError as Error).message);
      }
      return [];
    }
    console.error(`Error reading or parsing data from ${filename}:`, nodeError.message);
    // In case of JSON parsing errors or other read errors, return empty array
    // and log the error.
    return [];
  }
}

export async function writeData<T>(filename: string, data: T[]): Promise<void> {
  try {
    const filePath = path.join(dataDir, filename);
    await fs.mkdir(dataDir, { recursive: true });
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error(`Error writing data to ${filename}:`, error);
    throw error; 
  }
}

export function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 9)}`;
}
