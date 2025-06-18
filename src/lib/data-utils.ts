
import fs from 'fs/promises';
import path from 'path';

const dataDir = path.join(process.cwd(), 'src', 'data');

export async function readData<T>(filename: string): Promise<T[]> {
  const filePath = path.join(dataDir, filename);
  try {
    const jsonData = await fs.readFile(filePath, 'utf-8');

    if (!jsonData || jsonData.trim() === '') {
      // File is empty or whitespace only, treat as empty array.
      return [];
    }

    const parsedData = JSON.parse(jsonData);

    if (!Array.isArray(parsedData)) {
      // Log this specific case: valid JSON, but not an array.
      console.warn(`Data in ${filename} is valid JSON but not an array. Content: ${JSON.stringify(parsedData)}. Attempting to overwrite with an empty array.`);
      try {
        await writeData<T>(filename, []); // Attempt to fix the file
      } catch (writeError) {
        console.error(`Error attempting to overwrite malformed (non-array) file ${filename}:`, (writeError as Error).message);
        // Still return [] to allow the app to proceed, albeit with a warning about the failed write.
      }
      return []; // Return empty array as the content was not the expected array.
    }

    // Filter out null, undefined, or non-object items from the array if T is expected to be an array of objects.
    // This is a basic sanity check. For more complex object validation, schemas (e.g., Zod) should be used by the caller.
    const validItems = parsedData.filter(item => item !== null && typeof item === 'object');
    
    // If you expect an array of primitives (e.g., string[], number[]), this filter might be too aggressive.
    // However, for this project, T is typically an array of objects (Classroom[], ClassGroup[], etc.).
    // If T could be array of primitives, this filtering logic would need adjustment or removal.
    if (validItems.length !== parsedData.length) {
        // console.warn(`Filtered out non-object or null items from ${filename}. Original count: ${parsedData.length}, Valid count: ${validItems.length}`);
    }


    return validItems as T[]; // Assumes T is an array of objects.
  } catch (error) {
    const nodeError = error as NodeJS.ErrnoException;
    if (nodeError.code === 'ENOENT') {
      // File doesn't exist. Attempt to create it with an empty array.
      try {
        await writeData<T>(filename, []);
      } catch (writeError) {
        console.error(`Error creating initial data file ${filename} after ENOENT:`, (writeError as Error).message);
        // Still return [] to allow the app to proceed.
      }
      return [];
    }
    // For other errors (e.g., malformed JSON that JSON.parse throws on, permissions issues), log and return empty.
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
