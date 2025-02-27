import { Langbase, getRunner } from 'langbase';

const apiKey = process.env.NEXT_PUBLIC_LANGBASE_API_KEY;

if (!apiKey) {
    throw new Error("Missing Langbase API Key. Check your .env.local file.");
}

const langbase = new Langbase({ apiKey });

// Upload text to Langbase memory
export const uploadToMemory = async (content: string,filename:string) => {
    try {
        const buffer = Buffer.from(content, "utf-8");

        const response = await langbase.memory.documents.upload({
            document: buffer,
            memoryName: "crawler",
            contentType: "text/plain",
            documentName: filename,
        });

        return response;
    } catch (error) {
        console.error("Error uploading to memory:", error);
        throw new Error("Failed to upload document.");
    }
};

// Send a message to Langbase chat
interface Message {
    role: "user" | "assistant";
    content: string;
}

const messageHistory: Message[] = [];

export const chatWithLangbase = async (message: string) => {
    try {
        console.log("Sending message to Langbase:", message);

        // Add the new user message to the history
        messageHistory.push({ role: "user", content: message });

        const { stream } = await langbase.pipe.run({
            name: "crawl-pages",
            stream: true,
            messages: messageHistory, // Send the entire message history
        });

        const runner = getRunner(stream);

        let result = "";
        await new Promise<void>((resolve) => {
            runner.on("content", (content) => {
                result += content;
            });
            runner.on("end", () => {
                // Add the assistant's reply to the message history
                messageHistory.push({ role: "assistant", content: result });
                resolve();
            });
        });

        return result;
    } catch (error) {
        console.error("Langbase Chat Error:", error);
        throw new Error("Failed to chat with Langbase.");
    }
};