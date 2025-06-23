
import fs from 'fs/promises';
import path from 'path';

// This logic allows for an optional environment variable to specify the data directory.
// It defaults to 'src/data' if the variable is not set.
const defaultDataPath = path.join(process.cwd(), 'src', 'data');
const dataDirFromEnv = process.env.DATA_DIR;
const dataDir = dataDirFromEnv || defaultDataPath;

// Log if a custom data directory is being used, which is helpful for debugging.
if (dataDirFromEnv) {
  console.info(`[data-utils] Using custom data directory specified by DATA_DIR: ${dataDir}`);
}

/**
 * Reads and parses a JSON file from the data directory.
 * This function is resilient to common errors like file not found (it creates the file),
 * empty files, malformed JSON, and non-array data structures.
 * @param filename The name of the JSON file (e.g., 'classrooms.json').
 * @returns A promise that resolves to an array of type T, or an empty array if an error occurs.
 */
export async function readData<T>(filename: string): Promise<T[]> {
  const filePath = path.join(dataDir, filename);

  try {
    const jsonData = await fs.readFile(filePath, 'utf-8');

    // Handle cases where the file is empty or contains only whitespace.
    if (!jsonData || jsonData.trim() === '') {
      console.warn(`[data-utils] File ${filename} at ${filePath} is empty or contains only whitespace. Returning empty array.`);
      return [];
    }

    let parsedData;
    try {
      parsedData = JSON.parse(jsonData);
    } catch (parseError) {
      // Log detailed error if JSON parsing fails.
      console.error(`[data-utils] Failed to parse JSON from file "${filename}" at path "${filePath}". Error: ${(parseError as Error).message}. File content (first 500 chars): ${jsonData.substring(0,500)}`);
      return [];
    }

    // Ensure the parsed data is an array, as expected by the application logic.
    if (!Array.isArray(parsedData)) {
      console.warn(`[data-utils] Data in file "${filename}" at path "${filePath}" is valid JSON but not an array. Content type: ${typeof parsedData}. Returning empty array.`);
      return [];
    }
    
    // Filter out any null, undefined, or non-object items from the array to prevent runtime errors.
    const initialCount = parsedData.length;
    const validItems = parsedData.filter(item => {
      const itemIsValid = item !== null && item !== undefined && typeof item === 'object';
      return itemIsValid;
    });

    if (validItems.length !== initialCount) {
        console.warn(`[data-utils] Filtered out ${initialCount - validItems.length} non-object or null/undefined items from file "${filename}" at path "${filePath}". Original count: ${initialCount}, Valid count: ${validItems.length}`);
    }
    return validItems as T[];
  } catch (error) {
    const nodeError = error as NodeJS.ErrnoException;
    if (nodeError.code === 'ENOENT') {
      // If the file doesn't exist, create it with an empty array.
      console.warn(`[data-utils] File "${filename}" not found at path "${filePath}". Attempting to create it with an empty array.`);
      try {
        await fs.mkdir(dataDir, { recursive: true });
        await writeData<T>(filename, []);
        console.info(`[data-utils] Successfully created empty file: "${filename}" at path "${filePath}"`);
      } catch (writeError) {
        // Log a critical error if file creation fails.
        console.error(`[data-utils] Critical error: Failed to create initial data file "${filename}" at path "${filePath}" after ENOENT. Error:`, (writeError as Error).message, (writeError as Error).stack);
      }
      return [];
    }
    // Log other file system errors.
    console.error(`[data-utils] Error reading data from file "${filename}" at path "${filePath}":`, nodeError.message, nodeError.stack);
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
    await fs.mkdir(dataDir, { recursive: true }); // Ensure data directory exists.
    const jsonData = JSON.stringify(data, null, 2);
    await fs.writeFile(filePath, jsonData, 'utf-8');
    // Log success for better traceability.
    // console.info(`[data-utils] Successfully wrote ${data.length} items to file "${filename}" at path "${filePath}".`);
  } catch (error) {
    const nodeError = error as NodeJS.ErrnoException;
    console.error(`[data-utils] Error writing data to file "${filename}" at path "${filePath}":`, nodeError.message, nodeError.stack);
    throw error; // Re-throw to allow server actions to handle the failure.
  }
}

/**
 * Generates a unique ID string.
 * @returns A unique ID.
 */
export function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 9)}`;
}
