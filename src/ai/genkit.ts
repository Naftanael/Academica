import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';

export const ai = genkit({
  // Opcionalmente ajuste o modelo para Gemini 2.5 Pro:
  model: 'googleai/gemini-2.5-pro',
  plugins: [
    googleAI({
      // ⚠️ Impede que o plugin gere flows de rota que injetam PageProps
      disableNextFlows: true,
      skipFlows: ['*'], // Alternatively, target specific flows like 'next-page-props', 'next-api-props'
      flows: [] 
    })
  ],
});

