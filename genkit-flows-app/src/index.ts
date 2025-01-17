import * as z from "zod";
import { configureGenkit } from "@genkit-ai/core";
import { defineFlow, startFlowsServer } from "@genkit-ai/flow";
import { vertexAI } from "@genkit-ai/vertexai";
import { gemini15Flash } from "@genkit-ai/vertexai";
import { genkitEval, GenkitMetric } from "@genkit-ai/evaluator";
import { contentSchema } from "./lib/genkit/schemas";
import {
  classificationPrompt,
  argumentationPrompt,
} from "./lib/genkit/prompts";
import { getPostTextTool } from "./lib/genkit/tools";

configureGenkit({
  plugins: [
    vertexAI({ location: "southamerica-east1" }),
    genkitEval({
      judge: gemini15Flash,
      metrics: [GenkitMetric.FAITHFULNESS, GenkitMetric.MALICIOUSNESS],
    }),
  ],
  logLevel: "debug",
  enableTracingAndMetrics: true,
  //  telemetry: {
  //    instrumentation: 'firebase',
  //    logger: 'firebase',
  //    },
});

export const classificationFlow = defineFlow(
  {
    name: "classificationFlow",
    inputSchema: contentSchema,
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
    inputSchema: contentSchema,
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