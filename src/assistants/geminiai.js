import { GoogleGenAI } from "@google/genai";

const geminiai = new GoogleGenAI({
  apiKey: import.meta.env.VITE_GOGGLE_AI_API_KEY,
});

export class Assistant {
  #chat;
  name = "googleai";

  constructor(model = "gemini-2.0-flash") {
    this.#chat = geminiai.chats.create({ model });
  }

  createChat(history) {
    this.#chat = geminiai.chats.create({
      model: this.#chat.model,
      history: history
        .filter(({ role }) => role !== "system")
        .map(({ content, role }) => ({
          parts: [{ text: content }],
          role: role === "assistant" ? "model" : role,
        })),
    });
  }

  async chat(content) {
    try {
      const result = await this.#chat.sendMessage({ message: content });
      return result.text;
    } catch (error) {
      throw this.#parseError(error);
    }
  }

  async *chatStream(content) {
    try {
      const result = await this.#chat.sendMessageStream({ message: content });

      for await (const chunk of result) {
        yield chunk.text;
      }
    } catch (error) {
      throw this.#parseError(error);
    }
  }

  #parseError(error) {
    try {
      // Extract and parse the outer error JSON from the message string
      const [, outerErrorJSON] = error?.message?.split(" . ");
      const outerErrorObject = JSON.parse(outerErrorJSON);

      // Parse the nested stringified JSON from the outer error
      const innerErrorObject = JSON.parse(outerErrorObject?.error?.message);

      return innerErrorObject?.error;
    } catch (parseError) {
      return error;
    }
  }
}
