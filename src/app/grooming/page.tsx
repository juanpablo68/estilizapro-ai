
"use client"

import { useState, useRef, useEffect } from 'react';
import { useLocalStorage, UserProfile, INITIAL_USER_PROFILE } from '@/lib/storage-hooks';
import { chatWithGroomingAssistant } from '@/ai/flows/grooming-assistant-chat';
import { generateGroomingPreview } from '@/ai/flows/generate-grooming-preview';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Send, Sparkles, Loader2, Camera, Palette, Scissors, Trash2 } from "lucide-react";
import Link from 'next/link';
import Image from 'next/image';
import { useToast } from "@/hooks/use-toast";
import { useRouter } from 'next/navigation';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function GroomingAssistantPage() {
  const [profile, setProfile] = useLocalStorage<UserProfile>('estiliza_profile', INITIAL_USER_PROFILE);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [eventType, setEventType] = useState('Casual');
  const [mounted, setMounted] = useState(false);
  const [hasConsumedCredit, setHasConsumedCredit] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    const credits = Number(profile.groomingCredits) || 0;
    if (credits <= 0) {
      router.push('/purchase-grooming');
      return;
    }

    setMessages([
      { role: 'assistant', content: `Estudio Visagista abierto. Tienes una temperatura ${profile.colorimetryAnalysis || 'Cálida'} y piel ${profile.biometricData?.colorimetria?.tono_piel || 'natural'}. ¿Qué look de peinado y maquillaje buscamos para tu evento de tipo ${eventType}?` }
    ]);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    
    // Al primer mensaje/interacción, consumimos el crédito
    if (!hasConsumedCredit) {
      setProfile(prev => ({ ...prev, groomingCredits: Math.max(0, (prev.groomingCredits || 0) - 1) }));
      setHasConsumedCredit(true);
    }

    const userMsg = input;
    const openaiKey = localStorage.getItem('openai_api_key') || undefined;
    
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

    try {
      const response = await chatWithGroomingAssistant({
        message: userMsg,
        eventType,
        userContext: {
          biometricData: profile.biometricData,
          colorimetry: profile.colorimetryAnalysis,
        },
        openaiApiKey: openaiKey
      });
      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
      handleGeneratePreview(response);
    } catch (err) {
      console.error(err);
      toast({ variant: "destructive", title: "Error", description: "No se pudo conectar con el asistente." });
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePreview = async (description: string) => {
    const openaiKey = localStorage.getItem('openai_api_key') || undefined;
    setPreviewing(true);
    try {
      const result = await generateGroomingPreview({
        description,
        biometricData: profile.biometricData,
        openaiApiKey: openaiKey
      });
      setResultImage(result.previewImageDataUri);
      toast({ title: "Visualización Lista", description: "Look proyectado sobre tu avatar facial." });
    } catch (err) {
      console.error(err);
    } finally {
      setPreviewing(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="flex-1 max-w-6xl mx-auto w-full p-6 space-y-6 pb-20">
      <header className="flex items-center gap-4 pt-4">
        <Link href="/capsules">
          <Button variant="ghost" size="icon" className="rounded-full"><ArrowLeft /></Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-headline font-bold">Estudio Visagista</h1>
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black">Asesoría de Peinado & Maquillaje</p>
        </div>
        <div className="bg-indigo-50 px-4 py-1 rounded-full border border-indigo-100">
           <span className="text-[10px] font-black text-indigo-700 uppercase">Solicitud en Curso</span>
        </div>
      </header>

      <div className="grid lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-7 space-y-6 h-[700px] flex flex-col">
          <Card className="border-none shadow-xl bg-white rounded-3xl p-6">
            <div className="flex items-center gap-4">
              <div className="flex-1 space-y-1">
                <span className="text-[10px] font-black text-primary uppercase">Ocasión</span>
                <Select value={eventType} onValueChange={setEventType}>
                  <SelectTrigger className="rounded-xl h-10"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Oficina">Oficina</SelectItem>
                    <SelectItem value="Casual">Casual</SelectItem>
                    <SelectItem value="Cena Social">Cena Social</SelectItem>
                    <SelectItem value="Evento de Gala">Evento de Gala</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2 bg-indigo-50 px-4 py-2 rounded-xl border border-indigo-100">
                <Palette className="w-4 h-4 text-indigo-600" />
                <span className="text-[10px] font-bold text-indigo-700 uppercase">{profile.colorimetryAnalysis || 'Detectando'}</span>
              </div>
            </div>
          </Card>

          <Card className="flex-1 flex flex-col overflow-hidden border-none shadow-xl bg-white rounded-3xl">
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/5" ref={scrollRef}>
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
                    msg.role === 'user' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-foreground border shadow-sm'
                  }`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {loading && <div className="flex justify-start"><Loader2 className="w-6 h-6 animate-spin text-indigo-600" /></div>}
            </div>
            <div className="p-4 border-t flex gap-2 bg-white">
              <Input 
                placeholder="Describe el look que buscas..." 
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendMessage()}
                className="rounded-xl h-12"
              />
              <Button onClick={sendMessage} size="icon" className="rounded-xl h-12 w-12 bg-indigo-600 hover:bg-indigo-700"><Send /></Button>
            </div>
          </Card>
        </div>

        <div className="lg:col-span-5 space-y-6">
           <h2 className="text-lg font-bold flex items-center gap-2">
            <Camera className="w-5 h-5 text-indigo-600" /> Espejo Digital
           </h2>
           <Card className="aspect-[3/4] w-full overflow-hidden relative shadow-2xl border-none ring-[12px] ring-indigo-50 rounded-[3rem] bg-white">
            {resultImage ? (
              <div className="animate-in fade-in zoom-in duration-700 h-full w-full">
                <Image src={resultImage} alt="Grooming Resultado" fill className="object-cover" unoptimized />
                <div className="absolute bottom-6 right-6">
                  <div className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg border border-indigo-100 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-600" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600">IA Generativa Estética</span>
                  </div>
                </div>
              </div>
            ) : previewing ? (
              <div className="w-full h-full flex flex-col items-center justify-center bg-muted/20 space-y-4">
                <Loader2 className="w-12 h-12 animate-spin text-indigo-600" />
                <p className="text-xs font-bold text-indigo-600 animate-pulse">Renderizando Visagismo...</p>
              </div>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center p-12 text-center bg-muted/5 space-y-6">
                 <div className="p-8 bg-white rounded-full shadow-lg">
                    <Scissors className="w-12 h-12 text-indigo-600" />
                 </div>
                 <div className="space-y-2">
                    <h3 className="font-bold">Proyección Visual</h3>
                    <p className="text-[10px] text-muted-foreground leading-relaxed">
                      Envía un mensaje para activar el análisis. La IA proyectará el peinado y maquillaje sobre tu rostro.
                    </p>
                 </div>
              </div>
            )}
           </Card>
        </div>
      </div>
    </div>
  );
}
