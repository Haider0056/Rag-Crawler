"use client";

import { useState, useEffect, useRef } from "react";

export default function ChatWindow() {
  const [message, setMessage] = useState("");
  const [chatHistory, setChatHistory] = useState<
    { sender: string; text: string; isLoading?: boolean }[]
  >([]);
  const [isLoading, setIsLoading] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const typingRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory]);

  const handleChat = async () => {
    if (!message.trim()) return;

    setChatHistory((prev) => [...prev, { sender: "user", text: message }]);
    setMessage("");
    setIsLoading(true);

    // Show animated typing effect
    let typingIndex = 0;
    const typingDots = [".", "..", "...", ".."]; // Oscillates back to ".."
    setChatHistory((prev) => [...prev, { sender: "bot", text: "...", isLoading: true }]);

    typingRef.current = setInterval(() => {
      setChatHistory((prev) => {
        const updatedHistory = [...prev];
        updatedHistory[updatedHistory.length - 1] = {
          sender: "bot",
          text: typingDots[typingIndex % typingDots.length],
          isLoading: true,
        };
        return updatedHistory;
      });
      typingIndex++;
    }, 500);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });

      if (!res.body) throw new Error("No response body");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let botMessage = "";

      clearInterval(typingRef.current as NodeJS.Timeout); // Stop the typing animation

      setChatHistory((prev) => {
        const updatedHistory = [...prev];
        updatedHistory[updatedHistory.length - 1] = { sender: "bot", text: "" };
        return updatedHistory;
      });

      const processStream = async () => {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
      
          // Extract clean response
          let cleanChunk = chunk.trim();
          if (cleanChunk.startsWith('{')) {
            try {
              const json = JSON.parse(cleanChunk);
              cleanChunk = json.reply; // Extract only the reply text
            } catch (e) {
              console.error("Error parsing LLM response:", e);
            }
          }
      
          for (let i = 0; i < cleanChunk.length; i++) {
            botMessage += cleanChunk[i];
      
            await new Promise((resolve) => setTimeout(resolve, 20)); // Typing effect delay
      
            setChatHistory((prev) => {
              const updatedHistory = [...prev];
              updatedHistory[updatedHistory.length - 1] = { sender: "bot", text: botMessage };
              return updatedHistory;
            });
          }
        }
      };
      

      await processStream();
    } catch (error) {
      console.error("Chat failed:", error);
    } finally {
      setIsLoading(false);
      clearInterval(typingRef.current as NodeJS.Timeout);
    }
  };

  return (
    <div className="flex flex-col w-full max-w-3xl mx-auto h-136 bg-[#343541] text-[#ECECF1] p-4">
      {/* Chat Messages */}
      <div ref={chatContainerRef} className="flex flex-col space-y-2 h-full overflow-y-auto p-4">
        {chatHistory.map((chat, index) => (
          <div
            key={index}
            className={`p-3 rounded-lg max-w-[75%] break-words ${
              chat.sender === "user"
                ? "bg-[#0ea5e9] text-white self-end"
                : "bg-[#444654] text-[#ECECF1] self-start"
            }`}
          >
            {chat.isLoading ? <span className="animate-pulse">{chat.text}</span> : chat.text}
          </div>
        ))}
      </div>

      {/* Input Field & Button */}
      <div className="flex flex-row space-x-2 p-4 w-full max-w-3xl border-t border-gray-600 bg-[#343541]">
        <input
          type="text"
          placeholder="Ask something..."
          className="flex-grow bg-[#40414F] text-white px-4 py-2 rounded-lg focus:outline-none"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleChat()}
        />

        <button
          onClick={handleChat}
          className="bg-[#10A37F] hover:bg-[#1A8F6E] text-white px-4 py-2 rounded-lg"
          disabled={isLoading}
        >
          {isLoading ? "..." : "Send"}
        </button>
      </div>
    </div>
  );
}
