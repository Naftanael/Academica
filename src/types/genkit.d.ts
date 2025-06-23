
// src/types/genkit.d.ts
// This is an "opaque" stub to prevent deep type inference issues.

declare module 'genkit' {
  export type PluginOption = any;
  export type ZodSchema = any;

  export interface GenkitOptions {
    plugins?: PluginOption[];
    model?: string;
    [key: string]: any;
  }

  export interface GenkitInstance {
    definePrompt: (config: any) => (input: any) => Promise<any>;
    defineFlow: (config: any, handler: (input: any) => Promise<any>) => (input: any) => Promise<any>;
    generate: (params: any) => Promise<any>;
    generateStream: (params: any) => { stream: AsyncIterable<any>; response: Promise<any>; };
    defineTool: (config: any, handler: (input: any) => Promise<any>) => any;
    defineSchema: <T extends ZodSchema>(name: string, schema: T) => T;
    [key: string]: any;
  }

  export function genkit(options: GenkitOptions): GenkitInstance;

  export const z: any;
}
