// src/types/genkit-ai__googleai.d.ts
declare module '@genkit-ai/googleai' {
    import type { PluginOption } from 'genkit';
    /** Ajuste os tipos conforme sua necessidade real */
    export function googleAI(options?: GoogleAIOptions): PluginOption;
    export interface GoogleAIOptions {
      model?: string;
      skipFlows?: string[];
      disableNextFlows?: boolean;
      flows?: any[];
    }
  }
  
