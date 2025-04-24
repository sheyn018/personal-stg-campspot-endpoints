import {
  claudeModels,
  llmMessage,
  modelsSupported,
  openAiModels,
} from "../schemas/zodSchemas";
import { ChatOpenAI } from "@langchain/openai";
import { ChatAnthropic } from "@langchain/anthropic";

export async function langchainLlm(input: {
  messages: llmMessage[];
  model: modelsSupported;
}) {
  let model = null;
  const isOpenAIModel = openAiModels.options.includes(input.model as any);
  const isAnthropicModel = claudeModels.options.includes(input.model as any);
  if (isOpenAIModel) {
    model = new ChatOpenAI({
      modelName: input.model,
      streaming: true,
      maxTokens: 1000,
      temperature: 0.5,
    });
  }
  if (isAnthropicModel) {
    model = new ChatAnthropic({
      modelName: input.model,
      streaming: true,
      maxTokens: 1000,
      temperature: 0.5,
    });
  }

  if (!model) {
    throw new Error("Invalid model");
  }

  const response = await model.invoke(input.messages);
  return response;
}
