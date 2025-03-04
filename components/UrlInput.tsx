"use client";

import { useState } from "react";

export default function UrlInput() {
    const [url, setUrl] = useState("");
    const [loading, setLoading] = useState(false);

    const handleScrape = async () => {
        if (!url.trim()) return;

        setLoading(true);
        try {
            const apiUrl = process.env.NEXT_PUBLIC_SCRAPER_API_URL || "http://localhost:5000/scrape"; 
            const res = await fetch(apiUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ url }),
            });

            const data = await res.json();
            if (data.text && data.filename) {
                await fetch("/api/upload", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ text: data.text, filename: data.filename }),
                });
                alert("Scraped text uploaded successfully!");
            }
        } catch (error) {
            console.error("Scraping failed:", error);
        } finally {
            setLoading(false);
            setUrl("");
        }
    };

    return (
        <div className="flex space-x-2 w-full max-w-lg mx-auto p-4">
            <input
                type="text"
                placeholder="Enter URL"
                className="flex-grow bg-[#40414F] text-white px-4 py-2 rounded-lg focus:outline-none"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                disabled={loading}
            />
            <button
                onClick={handleScrape}
                className={`px-4 py-2 rounded-lg transition ${
                    loading
                        ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                        : "bg-[#10A37F] hover:bg-[#1A8F6E] text-white"
                }`}
                disabled={loading}
            >
                {loading ? "Scraping..." : "Scrape"}
            </button>
        </div>
    );
}
