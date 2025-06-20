
// src/types/genkit.d.ts

export type PluginOption = any;

// Minimal ZodSchema stub for basic type checking within application code
export interface ZodSchema {
  parse: (data: any) => any;
  describe: (description: string) => ZodSchema;
  optional: () => ZodSchema;
  array: () => ZodSchema;
  object: (shape: Record<string, ZodSchema | any>) => ZodSchema; // Allow any for shape values
  string: () => ZodSchema;
  number: () => ZodSchema;
  boolean: () => ZodSchema;
  enum: (values: [string, ...string[]]) => ZodSchema;
  [key: string]: any; // Allow other Zod methods
}

// Use `any` for schema properties within Genkit's own config objects
// to prevent deep type inference issues.
export interface SchemaDefinition {
  schema: any; // Changed from ZodSchema to any
  description?: string;
  [key: string]: any;
}

export interface PromptConfig {
  name: string;
  input?: SchemaDefinition; // Uses the loosened SchemaDefinition
  output?: SchemaDefinition; // Uses the loosened SchemaDefinition
  prompt: string;
  tools?: any[]; // GenkitTool[] changed to any[]
  config?: any;
  system?: string;
  [key: string]: any;
}

export interface FlowConfig<I, O> {
  name: string;
  inputSchema: any;  // Changed from ZodSchema to any
  outputSchema: any; // Changed from ZodSchema to any
  [key: string]: any;
}

export type DefinedPrompt<InputType, OutputType> =
  (input: InputType) => Promise<{
    output: OutputType | null | undefined;
    [key: string]: any;
  }>;

export type DefinedFlow<InputType, OutputType> =
  (input: InputType) => Promise<OutputType>;

export interface GenkitTool {
  name: string;
  description?: string;
  inputSchema?: any; // Changed from ZodSchema to any
  outputSchema?: any; // Changed from ZodSchema to any
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
  defineSchema: <T extends ZodSchema>(name: string, schema: T) => T; // This is fine as it's for app code
  [key: string]: any;
}

export interface GenkitOptions {
  plugins?: any[]; // Changed from PluginOption[] to any[] for max permissiveness
  model?: string;
}

export function genkit(options: GenkitOptions): GenkitInstance;

// Provide a Zod stub that matches how application code uses it.
export const z: {
  object: (shape: Record<string, ZodSchema | any>) => ZodSchema;
  string: () => ZodSchema;
  number: () => ZodSchema;
  boolean: () => ZodSchema;
  array: (elementSchema: ZodSchema | any) => ZodSchema;
  enum: (values: [string, ...string[]]) => ZodSchema;
  coerce: {
    number: (options?: any) => ZodSchema;
    [key: string]: any;
  };
  [key: string]: any; // For other Zod methods like .min, .max, .optional, .refine etc.
};
