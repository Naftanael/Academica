
// src/types/genkit.d.ts

// Define a minimal PluginOption locally to avoid issues with the actual 'genkit' package's types
export interface PluginOption {
  [key: string]: any; 
}

// Assuming Zod is used for schema definition within Genkit prompts/flows
// For stubbing purposes, a minimal representation:
export interface ZodSchema {
  parse: (data: any) => any;
  describe: (description: string) => ZodSchema; 
  // Add other Zod methods if used by Genkit internals that need stubbing
  optional: () => ZodSchema;
  array: () => ZodSchema;
  object: (shape: Record<string, ZodSchema>) => ZodSchema;
  string: () => ZodSchema;
  number: () => ZodSchema;
  boolean: () => ZodSchema;
  // Allow other properties, and specific Zod types like z.string(), z.object() etc.
  // This is a simplified stub. For full Zod compatibility, you'd import from 'zod'.
  [key: string]: any; 
}


export interface SchemaDefinition {
  schema: ZodSchema;
  description?: string; // Zod descriptions are often part of the schema definition itself via .describe()
  [key: string]: any; 
}


export interface PromptConfig {
  name: string;
  input?: SchemaDefinition; // Changed from PromptInput to SchemaDefinition
  output?: SchemaDefinition; // Changed from PromptOutput to SchemaDefinition
  prompt: string; 
  tools?: any[]; // Define Tool type if needed
  config?: any; // For safetySettings, etc.
  system?: string; // For system prompts
  [key: string]: any;
}

export interface FlowConfig<I, O> {
  name: string;
  inputSchema: ZodSchema;   
  outputSchema: ZodSchema;  
  [key: string]: any; 
}

// Represents the function returned by ai.definePrompt
export type DefinedPrompt<InputType, OutputType> =
  (input: InputType) => Promise<{
    output: OutputType | null | undefined; 
    [key: string]: any; 
  }>;

// Represents the function returned by ai.defineFlow
export type DefinedFlow<InputType, OutputType> =
  (input: InputType) => Promise<OutputType>;

// Represents a Genkit Tool
export interface GenkitTool {
  name: string;
  description?: string;
  inputSchema?: ZodSchema;
  outputSchema?: ZodSchema;
  [key: string]: any;
}


export interface GenkitInstance {
  definePrompt: <I, O>(config: PromptConfig) => DefinedPrompt<I, O>;
  defineFlow: <I, O>(config: FlowConfig<I,O>, handler: (input: I) => Promise<O>) => DefinedFlow<I, O>;
  generate: (params: { model?: any; prompt: string | any[]; config?: any; [key: string]: any; }) =>
    Promise<{ text: string; output?: any; media?: {url: string}; [key: string]: any; }>;
  generateStream: (params: { model?: any; prompt: string | any[]; config?: any; [key: string]: any; }) =>
    { stream: AsyncIterable<{text?: string; output?: any; [key: string]: any;}>; response: Promise<{ text: string; output?: any; media?: {url: string}; [key: string]: any; }> };
  defineTool: (config: Omit<GenkitTool, 'call'>, handler: (input: any) => Promise<any>) => GenkitTool;
  defineSchema: <T extends ZodSchema>(name: string, schema: T) => T;
  // Add any other methods or properties of the 'ai' object that you use
  [key: string]: any; 
}

export interface GenkitOptions {
  plugins?: PluginOption[];
  model?: string; // Optional top-level model
}

// This is the main export from 'genkit' module
export function genkit(options: GenkitOptions): GenkitInstance;

// If Zod is directly exported or used from 'genkit' itself (e.g. genkit.zod), stub it here.
// Assuming 'z' is imported from 'genkit' like 'import {z} from "genkit"'
// This is a simplified Zod stub. In a real scenario, you'd rely on the 'zod' package's own types.
export const z: {
  object: (shape: Record<string, ZodSchema>) => ZodSchema;
  string: () => ZodSchema;
  number: () => ZodSchema;
  boolean: () => ZodSchema;
  array: (elementSchema: ZodSchema) => ZodSchema;
  // Add other Zod static methods as needed
  [key: string]: any;
};

} // End of declare module 'genkit'
