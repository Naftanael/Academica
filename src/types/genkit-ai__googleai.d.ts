
// src/types/genkit-ai__googleai.d.ts
// Opaque stub for the Google AI plugin.

declare module '@genkit-ai/googleai' {
  export interface GoogleAIOptions {
    model?: string;
    apiVersion?: string;
    apiKey?: string;
    disableNextFlows?: boolean;
    skipFlows?: string[];
    flows?: any[];
    [key: string]: any;
  }
  
  export function googleAI(opts?: GoogleAIOptions): any; // Return 'any'
}
