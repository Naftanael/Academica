// src/types/genkit-ai__next.d.ts
// This stub aims to prevent @genkit-ai/next from interfering with Next.js global types.
// It declares the module but exports minimal or no conflicting types.

import type { PluginOption } from './genkit'; // Consistent with other stubs

declare module '@genkit-ai/next' {
  // If @genkit-ai/next is expected to export a plugin function (e.g., for Next.js integration)
  // you might declare it minimally here:
  // export function genkitNextPlugin(options?: any): PluginOption;

  // To be safe and maximally suppress its types if they are causing issues,
  // you can declare it as exporting a non-conflicting placeholder or nothing specific.
  const placeholder: any;
  export default placeholder;

  // If it exports specific named items that you don't use or want to override:
  // export const someSpecificExport: any;
}
