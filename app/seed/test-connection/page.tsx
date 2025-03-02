"use client";

import { useState, useEffect } from "react";

export default function TestConnectionPage() {
  const [result, setResult] = useState<{
    status: string;
    message: string;
    error?: string;
  }>({
    status: "loading",
    message: "Testing connection...",
  });

  useEffect(() => {
    async function testConnection() {
      try {
        const response = await fetch("/api/test-connection");
        const data = await response.json();
        setResult(data);
      } catch (error) {
        setResult({
          status: "error",
          message: "Failed to test connection",
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    testConnection();
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Database Connection Test</h1>
      <div
        className={`p-4 rounded ${
          result.status === "loading"
            ? "bg-gray-100"
            : result.status === "success"
            ? "bg-green-100"
            : "bg-red-100"
        }`}
      >
        <p>
          <strong>Status:</strong> {result.status}
        </p>
        <p>
          <strong>Message:</strong> {result.message}
        </p>
        {result.error && (
          <div className="mt-4">
            <p>
              <strong>Error:</strong>
            </p>
            <pre className="bg-gray-800 text-white p-2 rounded overflow-x-auto">
              {result.error}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
