
import { NextResponse } from 'next/server';
import { writeData } from '@/lib/data-utils';

interface TvPublishStatus {
  lastPublished: number | null;
}

// This API route is called by the "Publish TV Panel" button in the admin dashboard.
// It updates a simple JSON file with the current timestamp.
// The TV display clients will poll another endpoint that reads this timestamp.
// When they detect a change, they will refresh their data.
export async function POST() {
  try {
    const status: TvPublishStatus = {
      lastPublished: Date.now(),
    };
    // Note: The file must be named 'tv-publish-status.json' and located in the `src/data` directory.
    // writeData expects an array, so we wrap the status object in one.
    await writeData<TvPublishStatus>('tv-publish-status.json', [status]);

    return NextResponse.json({ success: true, message: 'Painel de TV publicado com sucesso.' });
  } catch (error) {
    console.error('Error publishing TV panel status:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido.';
    return NextResponse.json({ success: false, message: `Falha ao publicar painel: ${errorMessage}` }, { status: 500 });
  }
}
