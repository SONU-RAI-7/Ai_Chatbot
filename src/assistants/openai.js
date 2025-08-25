import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPEN_AI_API_KEY,
  dangerouslyAllowBrowser: true,
});

export class Assistant {
  #model;

  constructor(model = "gpt-4o-mini") {
    this.#model = model;
  }

  async chat(content, history) {
    try {
      const result = await openai.chat.completions.create({
        model: this.#model,
        messages: [...history, { content, role: "user" }],
      });

      return result.choices[0].message.content;
    } catch (error) {
      throw error;
    }
  }

  async *chatStream(content, history) {
    try {
      const result = await openai.chat.completions.create({
        model: this.#model,
        messages: [...history, { content, role: "user" }],
        stream: true,
      });

      for await (const chunk of result) {
        yield chunk.choices[0]?.delta?.content || "";
      }
    } catch (error) {
      throw error;
    }
  }
}


// import { useState } from "react";
// import { Assistant } from "./assistants/openai";
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
//       const result = await assistant.chatStream(content, messages);
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
//         content: "Sorry, I couldn't process your request. Please try again!",
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