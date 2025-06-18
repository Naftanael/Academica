
import fs from 'fs/promises';
import path from 'path';

// Determine data directory, allowing override from environment variable
const defaultDataPath = path.join(process.cwd(), 'src', 'data');
const dataDirFromEnv = process.env.DATA_DIR;
const dataDir = dataDirFromEnv || defaultDataPath;

if (dataDirFromEnv) {
  console.info(`[data-utils] Using custom data directory specified by DATA_DIR: ${dataDir}`);
} else {
  // console.info(`[data-utils] Using default data directory: ${dataDir}`); // Optional: Log default path if too verbose
}

export async function readData<T>(filename: string): Promise<T[]> {
  const filePath = path.join(dataDir, filename);
  // console.info(`[data-utils] Attempting to read data from: ${filePath}`); // Can be verbose, enable if needed for debugging

  try {
    const jsonData = await fs.readFile(filePath, 'utf-8');
    // console.info(`[data-utils] Successfully read file: ${filename}`); // Verbose

    if (!jsonData || jsonData.trim() === '') {
      console.warn(`[data-utils] File ${filename} at ${filePath} is empty or contains only whitespace. Returning empty array.`);
      return [];
    }

    let parsedData;
    try {
      parsedData = JSON.parse(jsonData);
    } catch (parseError) {
      console.error(`[data-utils] Failed to parse JSON from ${filename} at ${filePath}. Error: ${(parseError as Error).message}. File content (first 500 chars): ${jsonData.substring(0,500)}`);
      return []; // Return empty array if JSON is malformed
    }
    

    if (!Array.isArray(parsedData)) {
      console.warn(`[data-utils] Data in ${filename} at ${filePath} is valid JSON but not an array. Returning empty array. Content type: ${typeof parsedData}`);
      return [];
    }

    const initialCount = parsedData.length;
    const validItems = parsedData.filter(item => {
      const itemIsValid = item !== null && item !== undefined && typeof item === 'object';
      if (!itemIsValid) {
        // console.warn(`[data-utils] Invalid item found in ${filename}:`, item); // Can be too verbose for large files
      }
      return itemIsValid;
    });
    
    if (validItems.length !== initialCount) {
        console.warn(`[data-utils] Filtered out ${initialCount - validItems.length} non-object or null/undefined items from ${filename}. Original count: ${initialCount}, Valid count: ${validItems.length}`);
    }
    // console.info(`[data-utils] Successfully parsed data from ${filename}. Found ${validItems.length} valid items.`);
    return validItems as T[];
  } catch (error) {
    const nodeError = error as NodeJS.ErrnoException;
    if (nodeError.code === 'ENOENT') {
      console.warn(`[data-utils] File ${filename} not found at ${filePath}. Attempting to create it with an empty array.`);
      try {
        // Ensure directory exists before attempting to write a new file
        await fs.mkdir(dataDir, { recursive: true });
        await writeData<T>(filename, []); // This will call writeData which also logs its success/failure
        console.info(`[data-utils] Successfully created empty file: ${filename} at ${filePath}`);
      } catch (writeError) {
        console.error(`[data-utils] Critical error: Failed to create initial data file ${filename} at ${filePath} after ENOENT. Error:`, (writeError as Error).message, (writeError as Error).stack);
      }
      return [];
    }
    // Log other types of errors (permissions, etc.)
    console.error(`[data-utils] Error reading data from ${filename} at ${filePath}:`, nodeError.message, nodeError.stack);
    return []; // Return empty array on other read errors
  }
}

export async function writeData<T>(filename: string, data: T[]): Promise<void> {
  const filePath = path.join(dataDir, filename);
  // console.info(`[data-utils] Attempting to write data to: ${filePath}`); // Can be verbose

  try {
    await fs.mkdir(dataDir, { recursive: true }); // Ensure data directory exists
    const jsonData = JSON.stringify(data, null, 2);
    await fs.writeFile(filePath, jsonData, 'utf-8');
    console.info(`[data-utils] Successfully wrote ${data.length} items to ${filename} at ${filePath}.`);
  } catch (error) {
    const nodeError = error as NodeJS.ErrnoException;
    console.error(`[data-utils] Error writing data to ${filename} at ${filePath}:`, nodeError.message, nodeError.stack);
    throw error; // Re-throw to allow calling function to handle it, e.g., return a server error response
  }
}

export function generateId(): string {
  // Simple ID generator, consider a more robust UUID library for production if needed
  return `${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 9)}`;
}
