// src/types/genkit.d.ts

// Define a minimal PluginOption locally to avoid issues with the actual 'genkit' package's types
export type PluginOption = any; // Made as permissive as possible

// Assuming Zod is used for schema definition within Genkit prompts/flows
// For stubbing purposes, a minimal representation:
export interface ZodSchema {
  parse: (data: any) => any;
  describe: (description: string) => ZodSchema;
  optional: () => ZodSchema;
  array: () => ZodSchema;
  object: (shape: Record<string, ZodSchema>) => ZodSchema;
  string: () => ZodSchema;
  number: () => ZodSchema;
  boolean: () => ZodSchema;
  [key: string]: any;
}


export interface SchemaDefinition {
  schema: any; // Loosened from ZodSchema to any
  description?: string;
  [key: string]: any;
}


export interface PromptConfig {
  name: string;
  input?: SchemaDefinition;
  output?: SchemaDefinition;
  prompt: string;
  tools?: any[];
  config?: any;
  system?: string;
  [key: string]: any;
}

export interface FlowConfig<I, O> {
  name: string;
  inputSchema: any;   // Loosened from ZodSchema to any
  outputSchema: any;  // Loosened from ZodSchema to any
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
  inputSchema?: any; // Loosened from ZodSchema to any
  outputSchema?: any; // Loosened from ZodSchema to any
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
  [key: string]: any;
}

export interface GenkitOptions {
  plugins?: any[]; // Made as permissive as possible
  model?: string;
}

export function genkit(options: GenkitOptions): GenkitInstance;

export const z: {
  object: (shape: Record<string, ZodSchema>) => ZodSchema;
  string: () => ZodSchema;
  number: () => ZodSchema;
  boolean: () => ZodSchema;
  array: (elementSchema: ZodSchema) => ZodSchema;
  [key: string]: any;
};
