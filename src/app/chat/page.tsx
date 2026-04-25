"use client"

import { useState, useRef, useEffect } from 'react';
import { chatWithAIStylist } from '@/ai/flows/ai-stylist-chat';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Send, Sparkles, User, Instagram, BookOpen } from "lucide-react";
import Link from 'next/link';
import { useLocalStorage, UserProfile, INITIAL_USER_PROFILE } from '@/lib/storage-hooks';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function ChatPage() {
  const [profile] = useLocalStorage<UserProfile>('estiliza_profile', INITIAL_USER_PROFILE);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: '¡Hola! Soy tu Asistente de Vestuario de PILAR CIFUENTES. Ya tengo cargado tu perfil biométrico y tus preferencias. ¿En qué look trabajamos hoy?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    
    const userMsg = input;
    const openaiKey = localStorage.getItem('openai_api_key') || undefined;
    
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

    try {
      const response = await chatWithAIStylist({
        message: userMsg,
        userContext: {
          biometricData: profile.biometricData,
          figure: profile.figureAnalysis,
          colorimetry: profile.colorimetryAnalysis,
          preferences: profile.stylePreferences.preferredStyles.join(', '),
          accentuate: profile.stylePreferences.bodyPartsToAccentuate.join(', '),
          minimize: profile.stylePreferences.bodyPartsToMinimize.join(', '),
          knowledgeBase: profile.knowledgeBase
        },
        openaiApiKey: openaiKey
      });
      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Lo siento, ha ocurrido un error al procesar tu consulta. Revisa tu clave de OpenAI en Ajustes.' }]);
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="flex flex-col h-screen max-w-3xl mx-auto w-full bg-background border-x">
      <header className="p-4 flex items-center justify-between border-b bg-white/80 backdrop-blur-md sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon" className="rounded-full"><ArrowLeft className="w-5 h-5" /></Button>
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
              <h1 className="font-bold text-sm leading-none uppercase">Asistente de Vestuario</h1>
              <p className="text-[10px] text-muted-foreground uppercase tracking-tighter font-black">PILAR CIFUENTES</p>
            </div>
          </div>
        </div>
        {(profile.knowledgeBase || profile.biometricData) && (
          <div className="flex items-center gap-1.5 bg-primary/5 px-3 py-1.5 rounded-full border border-primary/10">
            <BookOpen className="w-3.5 h-3.5 text-primary" />
            <span className="text-[10px] font-black text-primary uppercase">Contexto Sincronizado</span>
          </div>
        )}
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
              msg.role === 'user' 
                ? 'bg-primary text-white rounded-tr-none' 
                : 'bg-white text-foreground rounded-tl-none border border-muted'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border rounded-2xl rounded-tl-none px-4 py-3 text-sm shadow-sm flex items-center gap-2">
              <div className="flex gap-1">
                <div className="w-1 h-1 bg-primary rounded-full animate-bounce" />
                <div className="w-1 h-1 bg-primary rounded-full animate-bounce [animation-delay:0.2s]" />
                <div className="w-1 h-1 bg-primary rounded-full animate-bounce [animation-delay:0.4s]" />
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
              Contactar a Pilar Cifuentes para asesoría premium
            </Link>
        </div>
        <div className="flex gap-2">
          <Input 
            placeholder="Pregunta sobre tu look de hoy..." 
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMessage()}
            className="flex-1 rounded-2xl border-muted bg-muted/10 h-12"
          />
          <Button onClick={sendMessage} size="icon" className="rounded-2xl bg-primary h-12 w-12 shadow-lg hover:scale-105 transition-transform">
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
