import { z } from "zod";

export const openAiModels = z.enum(["gpt-4o", "gpt-4o-mini"]);
export const claudeModels = z.enum([
  "claude-3-5-sonnet",
  "claude-3-5-sonnet-20240620",
]);
export const modelsSupportedSchema = z.union([openAiModels, claudeModels]);
export type modelsSupported = z.infer<typeof modelsSupportedSchema>;

export const llmMessageSchema = z.object({
  role: z.enum(["user", "assistant", "system", "tool"]),
  content: z.string(),
});
export type llmMessage = z.infer<typeof llmMessageSchema>;
