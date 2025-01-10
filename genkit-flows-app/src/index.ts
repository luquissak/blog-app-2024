import * as z from "zod";
import { generate } from "@genkit-ai/ai";
import { configureGenkit } from "@genkit-ai/core";
import { defineFlow, startFlowsServer } from "@genkit-ai/flow";
import { vertexAI } from "@genkit-ai/vertexai";
import { gemini15Flash } from "@genkit-ai/vertexai";
import { defineDotprompt } from "@genkit-ai/dotprompt";
import { defineTool } from '@genkit-ai/ai';
import { Storage } from '@google-cloud/storage';
import { readFile } from 'fs/promises';
import {pdfToText} from 'pdf-ts';



configureGenkit({
  plugins: [vertexAI({ location: "southamerica-east1" })],
  logLevel: "debug",
  enableTracingAndMetrics: true,
});

const getPostTextTool = defineTool(
  {
    name: 'getPostTextTool',
    description: 'use this tool to get the post content',
    inputSchema: z.object({}),
    outputSchema: z.string(),
  },
  async (input) => {
    const storage = new Storage();
    const postFile = storage.bucket("blog-files-2024").file("all/pdf2/2013-11-28_Fase.pdf");
    console.log(postFile.name);
    const contents = await postFile.download({destination: "test.pdf"});
    const content = await readFile('./test.pdf');
    const text = await pdfToText(content);
    return text;
  }
);


export const classificationPrompt = defineDotprompt(
  {
    name: "postClassification",
    model: gemini15Flash,
    input: z.string(),
    output: { format: "text" },
    config: { temperature: 0 },
    tools: [getPostTextTool],
  },
  `
  Você é um assistente de classificação de postagens de um blog de filosofia.
  Dado o conteúdo de uma postagem, sua tarefa é descobrir a qual categoria ela pertence na lista de categorias de postagens fornecida abaixo.

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
  {{input}}?
  `
);

export const classificationFlow = defineFlow(
  {
    name: "classificationFlow",
    inputSchema: z.string(),
    outputSchema: z.string(),
  },
  async (input) => {
    const response = await classificationPrompt.generate({input, tools: [getPostTextTool],});
    return response.text();
  }
);


startFlowsServer();
