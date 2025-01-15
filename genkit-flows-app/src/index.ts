import * as z from "zod";
import { generate } from "@genkit-ai/ai";
import { configureGenkit } from "@genkit-ai/core";
import { defineFlow, startFlowsServer } from "@genkit-ai/flow";
import { vertexAI } from "@genkit-ai/vertexai";
import { gemini15Flash } from "@genkit-ai/vertexai";
import { defineDotprompt } from "@genkit-ai/dotprompt";
import { defineTool } from "@genkit-ai/ai";
import { Storage } from "@google-cloud/storage";
import { readFile } from "fs/promises";
import { pdfToText } from "pdf-ts";
import { genkitEval, GenkitMetric } from "@genkit-ai/evaluator";

configureGenkit({
  plugins: [
    vertexAI({ location: "southamerica-east1" }),
//    genkitEval({
//      judge: gemini15Flash,
//      metrics: [
//        GenkitMetric.FAITHFULNESS,
//        GenkitMetric.MALICIOUSNESS,],
//    }),
  ],
  logLevel: "debug",
  enableTracingAndMetrics: true,
});
export const ContentSchema = z.object({
  url: z.string(),
  content: z.string(),
});

const getPostTextTool = defineTool(
  {
    name: "getPostTextTool",
    description: "Use this tool to get the post content",
    inputSchema: ContentSchema,
    outputSchema: z.string(),
  },
  async (input) => {
    const storage = new Storage();
    const postFile = storage.bucket("blog-files-2024").file(input.url);
    console.log(postFile.name);
    const contents = await postFile.download({ destination: "test.pdf" });
    const content = await readFile("./test.pdf");
    const text = await pdfToText(content);
    return text;
  }
);

export const classificationPrompt = defineDotprompt(
  {
    name: "classificationPrompt",
    model: gemini15Flash,
    input: { schema: ContentSchema },
    output: { format: "text" },
    config: { temperature: 0 },
    //    tools: [getPostTextTool],
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
  {{content}}
  `
);

export const argumentationPrompt = defineDotprompt(
  {
    name: "argumentationPrompt",
    model: gemini15Flash,
    input: { schema: ContentSchema },
    output: { format: "text" },
    config: { temperature: 0 },
  },
  `
  Liste os argumentos do texto, com os nomes do autores, um título para cada argumento, uma síntese de cada argumento e o nome do arquivo.
  Procure não repetir argumentos.
  Se não for possível identificar argumentos gere apenas uma linha colocando "não encontrado" nas 3 primeiras colunas, mas coloque o nome do arquivo e finalize.
  Deve sempre haver 4 colunas preenchidas: uma com o nome do autor, outra com o título do argumento, a terceira com a síntese do argumento e a quarta com o nome do arquivo, mesmo que o autor se repita.
  Use o separador | entre as colunas.
  Se houver mais de um argumento, liste-os em linhas separadas.
  Toda a linha deve ter o nome do arquivo, mesmo que repetido.
  Se não for possível identificar o autor, considere que é "Luis Quissak".
  Não repita linhas.

  Texto:
  {{content}}
  `
);

export const classificationFlow = defineFlow(
  {
    name: "classificationFlow",
    inputSchema: ContentSchema,
    outputSchema: z.string(),
  },
  async (input) => {
    const t = await getPostTextTool(input);
    input.content = t;
    //const response = await classificationPrompt.generate({input, tools: [getPostTextTool],});
    const response = await classificationPrompt.generate({ input });
    return response.text();
  }
);

export const argumentationFlow = defineFlow(
  {
    name: "argumentationFlow",
    inputSchema: ContentSchema,
    outputSchema: z.string(),
  },
  async (input) => {
    const t = await getPostTextTool(input);
    input.content = t;
    const response = await argumentationPrompt.generate({ input });
    return response.text();
  }
);

startFlowsServer();
