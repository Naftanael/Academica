
import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

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
      if (parseError instanceof SyntaxError) {
        console.error(`[data-utils] Failed to parse JSON from "${filename}" due to a syntax error: ${parseError.message}.`);
      } else {
        console.error(`[data-utils] An unexpected error occurred during JSON parsing of "${filename}": ${(parseError as Error).message}.`);
      }
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
      console.warn(`[data-utils] File "${filename}" not found. Returning an empty array.`);
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
export async function writeData<T>(filename: string, data: T[]): Promise<{ success: boolean; message?: string }> {
  const filePath = path.join(dataDir, filename);

  try {
    if (!Array.isArray(data)) {
      throw new Error("Data to be written must be an array.");
    }
    await fs.mkdir(dataDir, { recursive: true });
    const jsonData = JSON.stringify(data, null, 2);
    await fs.writeFile(filePath, jsonData, 'utf-8');
    return { success: true };
  } catch (error) {
    const nodeError = error as NodeJS.ErrnoException;
    console.error(`[data-utils] Error writing data to "${filename}":`, nodeError.message);
    return { success: false, message: nodeError.message };
  }
}

/**
 * Generates a unique ID string using UUID v4.
 * @returns A unique ID.
 */
export function generateId(): string {
  return uuidv4();
}
