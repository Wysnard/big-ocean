import { useState, useRef, useEffect } from "react";
import { useTherapistChat } from "@/hooks/useTherapistChat";
import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Loader2, Send } from "lucide-react";

interface TherapistChatProps {
  sessionId: string;
}

const traitLabels: Record<string, string> = {
  opennessPrecision: "Openness",
  conscientiousnessPrecision: "Conscientiousness",
  extraversionPrecision: "Extraversion",
  agreeablenessPrecision: "Agreeableness",
  neuroticismPrecision: "Neuroticism",
};

export function TherapistChat({ sessionId }: TherapistChatProps) {
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { messages, traits, isLoading, isCompleted, sendMessage } =
    useTherapistChat(sessionId);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;
    await sendMessage(inputValue);
    setInputValue("");
  };

  const handleStartAssessment = async () => {
    if (!isLoading) {
      await sendMessage();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="bg-slate-800/50 border-b border-slate-700 px-6 py-4 shadow-sm backdrop-blur-sm">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
          Big Five Personality Assessment
        </h1>
        <p className="text-sm text-gray-400 mt-1">
          Session ID:{" "}
          <code className="bg-slate-700 px-2 py-1 rounded text-gray-300">
            {sessionId}
          </code>
        </p>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden flex gap-4 p-4">
        {/* Messages Area */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1 overflow-y-auto space-y-4 mb-4">
            {messages.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <Card className="w-full max-w-md bg-slate-800/50 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-center text-white">
                      Welcome to Personality Assessment
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-gray-300 text-center">
                      The AI therapist will ask you questions to evaluate your
                      personality across five key dimensions. Ready to begin?
                    </p>
                    <Button
                      onClick={handleStartAssessment}
                      disabled={isLoading}
                      className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Starting...
                        </>
                      ) : (
                        "Start Assessment"
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${
                    msg.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      msg.role === "user"
                        ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white"
                        : "bg-slate-700/50 border border-slate-600 text-gray-100"
                    }`}
                  >
                    <p className="text-sm">{msg.content}</p>
                    <p
                      className={`text-xs mt-1 ${
                        msg.role === "user" ? "text-blue-100" : "text-gray-400"
                      }`}
                    >
                      {msg.timestamp?.toLocaleTimeString() ||
                        new Date(msg.createdAt || "").toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 backdrop-blur-sm">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  isCompleted
                    ? "Assessment complete!"
                    : "Type your response here..."
                }
                disabled={isLoading || isCompleted}
                className="flex-1 px-4 py-2 bg-slate-700 border border-slate-600 text-white rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <Button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isLoading || isCompleted}
                size="sm"
                className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Traits Sidebar */}
        {traits && (
          <div className="w-80 flex flex-col">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-lg text-white">
                  {isCompleted ? "Assessment Complete!" : "Current Scores"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(traitLabels).map(([key, label]) => {
                  const score = traits[key as keyof typeof traits];
                  const percentage = Math.round(score * 100);
                  const color =
                    percentage >= 90
                      ? "bg-green-500"
                      : percentage >= 70
                        ? "bg-yellow-500"
                        : "bg-orange-500";

                  return (
                    <div key={key}>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium text-gray-300">
                          {label}
                        </span>
                        <span className="text-sm font-bold text-gray-100">
                          {percentage}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-700 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${color}`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}

                {isCompleted && (
                  <div className="mt-4 p-3 bg-green-900/20 border border-green-700/30 rounded-lg">
                    <p className="text-sm text-green-200 font-medium">
                      Assessment completed successfully!
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
