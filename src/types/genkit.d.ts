// src/types/genkit.d.ts
import type { PluginOption } from 'genkit'; // deixe assim, mesmo que 'genkit' não tenha tipos

declare module 'genkit' {
  export interface GenkitOptions {
    plugins?: PluginOption[];
    model?: string;
    // outros campos se necessário…
  }
  export function genkit(options: GenkitOptions): {
    // retorne o que você realmente usa em ai
    config: GenkitOptions;
    // e qualquer outro membro exposto…
  };
}
