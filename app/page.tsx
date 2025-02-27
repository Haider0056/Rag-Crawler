import UrlInput from "@/components/UrlInput";
import ChatWindow from "@/components/chatWindow";

export default function Home() {
    return (
        <main className="flex flex-col items-center space-y-6 p-6">
            <UrlInput />
            <ChatWindow />
        </main>
    );
}
