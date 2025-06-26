
import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

// Re-using the data directory logic from data-utils
const defaultDataPath = path.join(process.cwd(), 'src', 'data');
const dataDirFromEnv = process.env.DATA_DIR;
const dataDir = dataDirFromEnv || defaultDataPath;
const tvStatusFilePath = path.join(dataDir, 'tv-publish-status.json');

export async function POST() {
  try {
    const statusData = {
      lastPublished: Date.now(),
    };

    // Use fs directly for this simple, non-array file
    await fs.mkdir(dataDir, { recursive: true });
    await fs.writeFile(tvStatusFilePath, JSON.stringify(statusData, null, 2), 'utf-8');

    return NextResponse.json({ success: true, message: 'Painel de TV publicado com sucesso.' });
  } catch (error) {
    console.error('Error publishing TV panel status:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido.';
    return NextResponse.json({ success: false, message: `Falha ao publicar painel: ${errorMessage}` }, { status: 500 });
  }
}
