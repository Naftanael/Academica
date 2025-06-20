
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';

export const ai = genkit({
  // Opcionalmente ajuste o modelo para Gemini 2.5 Pro:
  model: 'googleai/gemini-2.5-pro',
  plugins: [
    googleAI({
      // ⚠️ Impede que o plugin gere flows de rota que injetam PageProps
      disableNextFlows: true,
      skipFlows: ['*'], // Impede a geração de todos os flows nomeados
      flows: [] // Garante que nenhum flow seja explicitamente definido aqui pelo plugin
    })
  ],
});
