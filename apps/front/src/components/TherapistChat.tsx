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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
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

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900">
          Big Five Personality Assessment
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          Session ID:{" "}
          <code className="bg-gray-100 px-2 py-1 rounded">{sessionId}</code>
        </p>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden flex gap-4 p-4">
        {/* Messages Area */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1 overflow-y-auto space-y-4 mb-4">
            {messages.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <Card className="w-full max-w-md">
                  <CardHeader>
                    <CardTitle className="text-center">
                      Welcome to Personality Assessment
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-gray-600 text-center">
                      The therapist will ask you questions to evaluate your
                      personality across five key dimensions. Ready to begin?
                    </p>
                    <Button
                      onClick={handleStartAssessment}
                      disabled={isLoading}
                      className="w-full"
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
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      msg.role === "user"
                        ? "bg-blue-500 text-white"
                        : "bg-white border border-gray-200 text-gray-900"
                    }`}
                  >
                    <p className="text-sm">{msg.content}</p>
                    <p
                      className={`text-xs mt-1 ${
                        msg.role === "user" ? "text-blue-100" : "text-gray-500"
                      }`}
                    >
                      {msg.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={
                  isCompleted
                    ? "Assessment complete!"
                    : "Type your response here..."
                }
                disabled={isLoading || isCompleted}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
              />
              <Button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isLoading || isCompleted}
                size="sm"
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
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
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
                        <span className="text-sm font-medium text-gray-700">
                          {label}
                        </span>
                        <span className="text-sm font-bold text-gray-900">
                          {percentage}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${color}`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}

                {isCompleted && (
                  <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-800 font-medium">
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
