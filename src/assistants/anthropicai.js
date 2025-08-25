import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: import.meta.env.VITE_ANTHROPIC_AI_API_KEY,
  dangerouslyAllowBrowser: true,
});

export class Assistant {
  #client;
  #model;

  constructor(model = "claude-3-5-haiku-latest" + 1, client = anthropic) {
    this.#client = client;
    this.#model = model;
  }

  async chat(content, history) {
    try {
      const result = await this.#client.messages.create({
        model: this.#model,
        messages: [...history, { content, role: "user" }],
        max_tokens: 1024,
      });

      return result.content[0].text;
    } catch (error) {
      throw this.#parseError(error);
    }
  }

  async *chatStream(content, history) {
    try {
      const result = await this.#client.messages.create({
        model: this.#model,
        messages: [...history, { content, role: "user" }],
        max_tokens: 1024,
        stream: true,
      });

      for await (const chunk of result) {
        if (chunk.type === "content_block_delta") {
          yield chunk.delta.text || "";
        }
      }
    } catch (error) {
      throw this.#parseError(error);
    }
  }

  #parseError(error) {
    try {
      return error.error.error;
    } catch (parseError) {
      return error;
    }
  }
}


// App.jsx**


// import { useState } from "react";
// import { Assistant } from "./assistants/anthropicai";
// import { Loader } from "./components/Loader/Loader";
// import { Chat } from "./components/Chat/Chat";
// import { Controls } from "./components/Controls/Controls";
// import styles from "./App.module.css";

// function App() {
//   const assistant = new Assistant();
//   const [messages, setMessages] = useState([]);
//   const [isLoading, setIsLoading] = useState(false);
//   const [isStreaming, setIsStreaming] = useState(false);

//   function updateLastMessageContent(content) {
//     setMessages((prevMessages) =>
//       prevMessages.map((message, index) =>
//         index === prevMessages.length - 1
//           ? { ...message, content: `${message.content}${content}` }
//           : message
//       )
//     );
//   }

//   function addMessage(message) {
//     setMessages((prevMessages) => [...prevMessages, message]);
//   }

//   async function handleContentSend(content) {
//     addMessage({ content, role: "user" });
//     setIsLoading(true);
//     try {
//       const result = await assistant.chatStream(
//         content,
//         messages.filter(({ role }) => role !== "system")
//       );

//       let isFirstChunk = false;
//       for await (const chunk of result) {
//         if (!isFirstChunk) {
//           isFirstChunk = true;
//           addMessage({ content: "", role: "assistant" });
//           setIsLoading(false);
//           setIsStreaming(true);
//         }

//         updateLastMessageContent(chunk);
//       }

//       setIsStreaming(false);
//     } catch (error) {
//       addMessage({
//         content:
//           error?.message ??
//           "Sorry, I couldn't process your request. Please try again!",
//         role: "system",
//       });
//       setIsLoading(false);
//       setIsStreaming(false);
//     }
//   }

//   return (
//     <div className={styles.App}>
//       {isLoading && <Loader />}
//       <header className={styles.Header}>
//         <img className={styles.Logo} src="/chat-bot.png" />
//         <h2 className={styles.Title}>AI Chatbot</h2>
//       </header>
//       <div className={styles.ChatContainer}>
//         <Chat messages={messages} />
//       </div>
//       <Controls
//         isDisabled={isLoading || isStreaming}
//         onSend={handleContentSend}
//       />
//     </div>
//   );
// }

// export default App;