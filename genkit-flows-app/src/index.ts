import * as z from "zod";
import { generate } from "@genkit-ai/ai";
import { configureGenkit } from "@genkit-ai/core";
import { defineFlow, startFlowsServer } from "@genkit-ai/flow";
import { vertexAI } from "@genkit-ai/vertexai";
import { gemini15Flash } from "@genkit-ai/vertexai";
import { defineDotprompt } from "@genkit-ai/dotprompt";
import { defineTool } from '@genkit-ai/ai';
import { Storage } from '@google-cloud/storage';



configureGenkit({
  plugins: [vertexAI({ location: "southamerica-east1" })],
  logLevel: "debug",
  enableTracingAndMetrics: true,
});

export const ClassificationSchema = z.object({
  url: z.string(),
  content: z.string(),
});

const getPostTextTool = defineTool(
  {
    name: 'getPostTextTool',
    description: 'use this tool to look up the menu for a given date',
    inputSchema: ClassificationSchema,
    outputSchema: z.string().describe('the menu for a given date'),
  },
  async (input) => {

    const storage = new Storage();
    const postFile = storage.bucket("blog-files-2024").file(input.url);
    console.log(postFile.name);
    const contents = await postFile.download();    
    return contents.toString();
  }
);


export const classificationPrompt = defineDotprompt(
  {
    name: "postClassification",
    model: gemini15Flash,
    input: { schema: ClassificationSchema },
    output: { format: "text" },
    config: { temperature: 0 },
  },
  `
  Você é um assistente de classificação de postagens de um blog de filosofia.
  Dada a url de uma postagem, sua tarefa é descobrir a qual categoria ela pertence na lista de categorias de postagens fornecida abaixo.

  Antropologia
  Ciência
  Crônica
  Educação
  Epistemologia
  Ética
  Liberdade
  Linguagem
  Marxismo
  Mente
  Ontologia Social
  Poesia
  Política
  Psicanálise
  Tecnologia

  Classifique:
  {{url}}?
  `
);

export const classificationFlow = defineFlow(
  {
    name: "classificationFlow",
    inputSchema: ClassificationSchema,
    outputSchema: z.string(),
  },
  async (input) => {
    const response = await classificationPrompt.generate({input, tools: [getPostTextTool],});
    return response.text();
  }
);


startFlowsServer();
