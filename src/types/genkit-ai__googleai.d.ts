// src/types/genkit-ai__googleai.d.ts
import type { PluginOption } from './genkit'; // Import from our local genkit.d.ts stub

declare module '@genkit-ai/googleai' {
  export interface GoogleAIOptions {
    model?: string;
    apiVersion?: string; // Example, if this option exists
    apiKey?: string;     // Example
    disableNextFlows?: boolean;
    skipFlows?: string[];
    flows?: any[];
    // Add other actual options used by the googleAI plugin
  }
  export function googleAI(opts?: GoogleAIOptions): PluginOption;
}
