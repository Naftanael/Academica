
// src/types/genkit-ai__googleai.d.ts
import type { PluginOption } from './genkit'; // Imports the local PluginOption (which is 'any')

declare module '@genkit-ai/googleai' {
  export interface GoogleAIOptions {
    model?: string;
    apiVersion?: string;
    apiKey?: string;
    disableNextFlows?: boolean; // Critical for preventing Next.js flow conflicts
    skipFlows?: string[]; // Critical for preventing Next.js flow conflicts
    flows?: any[]; // Critical for preventing Next.js flow conflicts
  }
  // The return type effectively becomes 'any' due to PluginOption being 'any'
  export function googleAI(opts?: GoogleAIOptions): PluginOption;
}
