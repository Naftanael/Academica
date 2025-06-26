
import fs from 'fs/promises';
import path from 'path';

const defaultDataPath = path.join(process.cwd(), 'src', 'data');
const dataDirFromEnv = process.env.DATA_DIR;
const dataDir = dataDirFromEnv || defaultDataPath;

if (dataDirFromEnv) {
  console.info(`[data-utils] Using custom data directory: ${dataDir}`);
}

/**
 * Reads and parses a JSON file from the data directory.
 * This function is resilient to common errors like file not found,
 * empty files, malformed JSON, and non-array data structures.
 * @param filename The name of the JSON file (e.g., 'classrooms.json').
 * @returns A promise that resolves to an array of type T, or an empty array if an error occurs.
 */
export async function readData<T>(filename: string): Promise<T[]> {
  const filePath = path.join(dataDir, filename);

  try {
    const jsonData = await fs.readFile(filePath, 'utf-8');

    if (!jsonData || jsonData.trim() === '') {
      console.warn(`[data-utils] File ${filename} is empty. Returning empty array.`);
      return [];
    }

    let parsedData;
    try {
      parsedData = JSON.parse(jsonData);
    } catch (parseError) {
      console.error(`[data-utils] Failed to parse JSON from "${filename}". Error: ${(parseError as Error).message}.`);
      return [];
    }
    
    if (!Array.isArray(parsedData)) {
      console.warn(`[data-utils] Data in "${filename}" is not an array. Returning empty array.`);
      return [];
    }

    return parsedData.filter(item => item !== null && typeof item === 'object') as T[];
  } catch (error) {
    const nodeError = error as NodeJS.ErrnoException;
    if (nodeError.code === 'ENOENT') {
      // In a read-only production environment, we cannot create the file.
      // Log the issue and return an empty array. The app should handle this gracefully.
      console.warn(`[data-utils] File "${filename}" not found. Returning an empty array as it cannot be created in this environment.`);
      return [];
    }
    console.error(`[data-utils] Error reading data from "${filename}":`, nodeError.message);
    return [];
  }
}

/**
 * Writes an array of data to a JSON file in the data directory.
 * @param filename The name of the JSON file.
 * @param data The array of data to write.
 */
export async function writeData<T>(filename: string, data: T[]): Promise<void> {
  const filePath = path.join(dataDir, filename);

  try {
    await fs.mkdir(dataDir, { recursive: true });
    const jsonData = JSON.stringify(data, null, 2);
    await fs.writeFile(filePath, jsonData, 'utf-8');
  } catch (error) {
    const nodeError = error as NodeJS.ErrnoException;
    console.error(`[data-utils] Error writing data to "${filename}":`, nodeError.message);
    throw error;
  }
}

/**
 * Generates a unique ID string.
 * @returns A unique ID.
 */
export function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 9)}`;
}
