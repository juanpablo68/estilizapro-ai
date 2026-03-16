"use client"

import { useState, useRef, useEffect } from 'react';
import { chatWithAIStylist } from '@/ai/flows/ai-stylist-chat';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Send, Sparkles, User, Instagram } from "lucide-react";
import Link from 'next/link';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: '¡Hola! Soy el asistente de Pilar Cifuentes Catalán. Estoy aquí para ayudarte a encontrar tu mejor versión. ¿En qué puedo asesorarte hoy?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    
    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

    try {
      const response = await chatWithAIStylist(userMsg);
      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Lo siento, ha ocurrido un error al procesar tu consulta.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen max-w-3xl mx-auto w-full bg-background border-x">
      <header className="p-4 flex items-center gap-3 border-b bg-white/80 backdrop-blur-md sticky top-0 z-20">
        <Link href="/dashboard">
          <Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button>
        </Link>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Avatar className="w-10 h-10 border-2 border-primary">
              <AvatarImage src="https://picsum.photos/seed/pilar/200" alt="Pilar" />
              <AvatarFallback>PC</AvatarFallback>
            </Avatar>
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
          </div>
          <div>
            <h1 className="font-bold text-sm leading-none">Asistente Estilista</h1>
            <p className="text-[10px] text-muted-foreground">Pilar Cifuentes Catalán</p>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
              msg.role === 'user' 
                ? 'bg-primary text-white rounded-tr-none' 
                : 'bg-white text-foreground rounded-tl-none'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white rounded-2xl rounded-tl-none px-4 py-3 text-sm shadow-sm flex items-center gap-2">
              <div className="flex gap-1">
                <div className="w-1 h-1 bg-muted-foreground rounded-full animate-bounce" />
                <div className="w-1 h-1 bg-muted-foreground rounded-full animate-bounce [animation-delay:0.2s]" />
                <div className="w-1 h-1 bg-muted-foreground rounded-full animate-bounce [animation-delay:0.4s]" />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 border-t bg-white">
        <div className="mb-3 text-center">
            <Link 
              href="https://instagram.com/by.pilarcatalan" 
              target="_blank" 
              className="inline-flex items-center gap-1.5 text-[10px] text-muted-foreground hover:text-primary transition-colors"
            >
              <Instagram className="w-3 h-3" /> Contactar a Pilar Catalán para asesoría premium
            </Link>
        </div>
        <div className="flex gap-2">
          <Input 
            placeholder="Pregunta sobre colorimetría, figuras..." 
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMessage()}
            className="flex-1 rounded-full border-muted bg-muted/20"
          />
          <Button onClick={sendMessage} size="icon" className="rounded-full bg-secondary">
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
