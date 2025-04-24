import { langchainLlm } from "../utils/LangchainStep";
import dotenv from "dotenv";
dotenv.config();
async function main() {
  const response = await langchainLlm({
    messages: [{ role: "user", content: "Hello, how are you?" }],
    model: "gpt-4o",
  });
  console.log(response);
}
main();
