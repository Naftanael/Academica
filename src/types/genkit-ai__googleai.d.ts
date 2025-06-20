// src/types/genkit-ai__googleai.d.ts
import type { PluginOption } from './genkit'; // Import from our local genkit.d.ts stub

declare module '@genkit-ai/googleai' {
  export interface GoogleAIOptions {
    model?: string;
    apiVersion?: string; 
    apiKey?: string;     
    disableNextFlows?: boolean;
    skipFlows?: string[];
    flows?: any[];
  }
  export function googleAI(opts?: GoogleAIOptions): PluginOption;
}
