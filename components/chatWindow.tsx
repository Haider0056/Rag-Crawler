"use client";

import { useState, useEffect, useRef } from "react";

export default function ChatWindow() {
    const [message, setMessage] = useState("");
    const [chatHistory, setChatHistory] = useState<{ sender: string; text: string }[]>([]);
    const chatContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [chatHistory]);

    const handleChat = async () => {
        if (!message.trim()) return;

        setChatHistory((prev) => [...prev, { sender: "user", text: message }]);
        setMessage("");

        try {
            const res = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message }),
            });

            const data = await res.json();
            setChatHistory((prev) => [...prev, { sender: "bot", text: data.reply }]);
        } catch (error) {
            console.error("Chat failed:", error);
        }
    };

    return (
        <div className="flex flex-col w-full max-w-3xl mx-auto h-136 bg-[#343541] text-[#ECECF1] p-4">
            {/* Chat Messages */}
            <div
                ref={chatContainerRef}
                className="flex flex-col space-y-2 h-full overflow-y-auto p-4"
            >
                {chatHistory.map((chat, index) => (
                    <div
                        key={index}
                        className={`p-3 rounded-lg max-w-[75%] break-words ${
                            chat.sender === "user"
                                ? "bg-[#0ea5e9] text-white self-end"
                                : "bg-[#444654] text-[#ECECF1] self-start"
                        }`}
                    >
                        {chat.text}
                    </div>
                ))}
            </div>

            {/* Input Field & Button */}
            <div className="flex space-x-2 p-4 border-t border-gray-600 bg-[#343541]">
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
                >
                    Send
                </button>
            </div>
        </div>
    );
}
