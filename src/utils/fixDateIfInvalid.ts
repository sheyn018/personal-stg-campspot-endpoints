import { langchainLlm } from "./LangchainStep";

export async function fixDateIfInvalid(input: string): Promise<string> {
  try {
    // check if the input is a date
    const date = new Date(input);
    if (isNaN(date.getTime())) {
      throw new Error("Invalid date");
    }
    return input;
  } catch (error) {
    console.log("error", error);
    const response = await langchainLlm({
      messages: [
        {
          role: "system",
          content: `Convert the following date to the correct string format supported by javascript, now's date is ${new Date().toISOString()}. OUTPUT THE DATE ONLY AND NOTHING ELSE.`,
        },
        { role: "user", content: input },
      ],
      model: "gpt-4o-mini",
    });
    return response.content as string;
  }
}
