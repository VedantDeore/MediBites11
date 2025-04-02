"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bot, Send, AlertTriangle, ImageIcon, Mic, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth-context";
import { DashboardNav } from "@/components/dashboard-nav";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { TypingEffect } from "@/components/typing-effect";
import { useMobile } from "@/hooks/use-mobile";
import { BottomNav } from "@/components/bottom-nav";


const API_BASE_URL = process.env.NEXT_PUBLIC_FLASK_URL || 'https://symptom-sense-ai.onrender.com';

interface Message {
  role: "user" | "assistant";
  content: string;
  mediaType?: "image" | "audio";
  mediaUrl?: string;
  isLiveTranscript?: boolean;
}

export default function SymptomAnalyzerPage() {
  const { user } = useAuth();
  const router = useRouter();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [input, setInput] = useState("");
  const isMobile = useMobile();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hello! I'm your AI Doctor assistant. Please describe your symptoms or upload an image/audio recording.",
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState("");
  const recognitionRef = useRef<any>(null);
  const [error, setError] = useState<string | null>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  // Initialize speech recognition and synthesis
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Speech synthesis setup
      synthRef.current = window.speechSynthesis;

      // Speech recognition setup
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = 'en-US';

        recognitionRef.current.onresult = (event: any) => {
          const transcript = Array.from(event.results)
            .map((result: any) => result[0])
            .map((result) => result.transcript)
            .join('');
          setLiveTranscript(transcript);
        };

        recognitionRef.current.onerror = (event: any) => {
          console.error('Speech recognition error', event.error);
          setError("Could not access microphone. Please check permissions.");
        };
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, []);

  const speak = (text: string) => {
    if (!synthRef.current) return;
    
    synthRef.current.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1.2;
    
    const voices = synthRef.current.getVoices();
    const femaleVoice = voices.find(v => 
      v.name.includes('Female') || 
      v.name.includes('Woman') || 
      v.lang.includes('en-US')
    );
    
    if (femaleVoice) {
      utterance.voice = femaleVoice;
    }
    
    synthRef.current.speak(utterance);
  };

  const startRecording = () => {
    if (recognitionRef.current) {
      setLiveTranscript("");
      recognitionRef.current.start();
      setIsRecording(true);
      setError(null);
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
      if (liveTranscript) {
        setAudioBlob(new Blob([], { type: 'audio/wav' })); // Dummy blob for UI
      }
    }
  };

  const analyzeSymptoms = async (text: string, image: string | null, audioTranscript: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Display user message with media
      const userMessage: Message = {
        role: "user",
        content: text || audioTranscript || "Shared medical information",
        mediaType: image ? "image" : undefined,
        mediaUrl: image
      };
      
      setMessages(prev => [...prev, userMessage]);

      // Call backend
      const response = await fetch(`${API_BASE_URL}/api/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: text,
          transcribed_text: audioTranscript
        }),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const data = await response.json();
      
      // Display assistant response
      const assistantMessage: Message = {
        role: "assistant",
        content: data.text_response
      };

      setMessages(prev => [...prev, assistantMessage]);
      
      // Speak the response
      speak(data.text_response);

    } catch (error) {
      console.error("Error:", error);
      setError(error instanceof Error ? error.message : "Request failed");
    } finally {
      setIsLoading(false);
      clearSelectedMedia();
      setLiveTranscript("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!input.trim() && !selectedImage && !liveTranscript) || isLoading) return;
    await analyzeSymptoms(input, selectedImage, liveTranscript);
    setInput("");
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setSelectedImage(event.target.result as string);
          setError(null);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const clearSelectedMedia = () => {
    setSelectedImage(null);
    setAudioBlob(null);
    setLiveTranscript("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex h-screen overflow-hidden">
      {!isMobile && <DashboardNav />}
      <div className={cn("flex-1 flex flex-col h-screen", isMobile ? "" : "ml-64")}>
        <header className="h-14 border-b flex items-center justify-between px-4 md:px-6 bg-background z-10">
          <h1 className="text-lg font-semibold">AI Doctor Assistant</h1>
          {!user && (
            <Button onClick={() => router.push("/login")} className="bg-green-600 hover:bg-green-700">
              Sign in
            </Button>
          )}
        </header>

        <div className="flex-1 overflow-y-auto">
          <div className="p-4 space-y-4">
            <Alert className="bg-blue-50 border-blue-200">
              <AlertTriangle className="h-4 w-4 text-blue-600" />
              <AlertTitle>Disclaimer</AlertTitle>
              <AlertDescription>
                This AI provides preliminary health information only. Always consult a doctor.
              </AlertDescription>
            </Alert>

            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {messages.map((message, index) => (
              <Card
                key={index}
                className={cn(
                  "p-4 max-w-[85%] shadow-sm",
                  message.role === "assistant" ? "ml-0 mr-auto bg-background" : "ml-auto mr-0 bg-green-50"
                )}
              >
                {message.role === "assistant" ? (
                  <>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="h-6 w-6 rounded-full bg-green-100 flex items-center justify-center">
                        <Bot className="h-4 w-4 text-green-600" />
                      </div>
                      <span className="font-medium">AI Doctor</span>
                    </div>
                    <TypingEffect text={message.content} />
                  </>
                ) : (
                  <p className="whitespace-pre-wrap">{message.content}</p>
                )}

                {message.mediaType === "image" && message.mediaUrl && (
                  <div className="mt-2 relative">
                    <img
                      src={message.mediaUrl}
                      alt="Medical image"
                      className="max-w-full max-h-64 rounded-md"
                    />
                  </div>
                )}
              </Card>
            ))}

            {/* Show live transcript while recording */}
            {isRecording && liveTranscript && (
              <Card className="p-4 max-w-[85%] ml-auto mr-0 bg-green-50">
                <p className="text-sm text-muted-foreground">{liveTranscript}</p>
              </Card>
            )}

            {isLoading && (
              <Card className="p-4 max-w-[85%] ml-0 mr-auto bg-background">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-full bg-green-100 flex items-center justify-center">
                    <Bot className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="flex gap-1">
                    <div className="h-2 w-2 rounded-full bg-green-600 animate-bounce" />
                    <div className="h-2 w-2 rounded-full bg-green-600 animate-bounce [animation-delay:0.2s]" />
                    <div className="h-2 w-2 rounded-full bg-green-600 animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              </Card>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        <div className="border-t bg-background w-full">
          {(selectedImage || liveTranscript) && (
            <div className="p-4 pt-4 pb-0 flex items-center gap-2">
              {selectedImage && (
                <div className="relative h-16 w-16 rounded-md overflow-hidden border">
                  <img
                    src={selectedImage}
                    alt="Selected medical image"
                    className="h-full w-full object-cover"
                  />
                  <button
                    className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-0.5"
                    onClick={clearSelectedMedia}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}
              {liveTranscript && (
                <div className="relative flex items-center gap-2 p-2 bg-gray-100 rounded-md">
                  <p className="text-sm text-gray-700">{liveTranscript}</p>
                  <button className="bg-red-500 text-white rounded-full p-0.5" onClick={clearSelectedMedia}>
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}
            </div>
          )}

          <div className={cn("p-4", isMobile ? "pb-20" : "")}>
            <form onSubmit={handleSubmit} className="flex gap-2 max-w-4xl mx-auto">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={user ? "Describe your symptoms..." : "Sign in to use AI Doctor..."}
                disabled={!user}
                className="flex-1"
              />

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageChange}
                accept="image/*"
                className="hidden"
                disabled={!user || isLoading}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                disabled={!user || isLoading}
                onClick={() => fileInputRef.current?.click()}
                className="h-10 w-10"
              >
                <ImageIcon className="h-4 w-4" />
              </Button>

              <Button
                type="button"
                variant={isRecording ? "destructive" : "outline"}
                size="icon"
                disabled={!user || isLoading}
                onClick={isRecording ? stopRecording : startRecording}
                className="h-10 w-10"
              >
                {isRecording ? (
                  <div className="h-4 w-4 rounded-full bg-red-500 animate-pulse" />
                ) : (
                  <Mic className="h-4 w-4" />
                )}
              </Button>

              <Button
                type="submit"
                disabled={!user || (!input.trim() && !selectedImage && !liveTranscript) || isLoading}
                className="bg-green-600 hover:bg-green-700"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </form>
          </div>
        </div>
      </div>
      {isMobile && <BottomNav />}
    </div>
  );
}