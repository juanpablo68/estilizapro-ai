
"use client"

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Save, Key, Pin, Loader2, BookOpen, Sparkles } from "lucide-react";
import Link from 'next/link';
import { useLocalStorage, UserProfile, INITIAL_USER_PROFILE } from '@/lib/storage-hooks';
import { useToast } from "@/hooks/use-toast";
import { testAPIConnection } from '@/ai/flows/test-api-flow';

export default function SettingsPage() {
  const [profile, setProfile] = useLocalStorage<UserProfile>('estiliza_profile', INITIAL_USER_PROFILE);
  const [mounted, setMounted] = useState(false);
  const { toast } = useToast();

  const [openaiKey, setOpenaiKey] = useState('');
  const [pinterestToken, setPinterestToken] = useState('');
  const [knowledge, setKnowledge] = useState('');
  const [testStatus, setTestStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  useEffect(() => {
    setMounted(true);
    setOpenaiKey(localStorage.getItem('openai_api_key') || '');
    setPinterestToken(localStorage.getItem('pinterest_token') || '');
    setKnowledge(profile.knowledgeBase || '');
  }, [profile.knowledgeBase]);

  const handleSaveAll = () => {
    localStorage.setItem('openai_api_key', openaiKey);
    localStorage.setItem('pinterest_token', pinterestToken);
    
    setProfile({
      ...profile,
      knowledgeBase: knowledge
    });
    
    toast({
      title: "Configuración Guardada",
      description: "Pipeline Pure OpenAI y Área de Conocimiento actualizados.",
    });
  };

  const handleTest = async () => {
    if (!openaiKey) {
      toast({ variant: "destructive", title: "OpenAI Key Requerida" });
      return;
    }
    setTestStatus('loading');
    try {
      const result = await testAPIConnection({ provider: 'openai', apiKey: openaiKey });
      setTestStatus(result.success ? 'success' : 'error');
      toast({ 
        title: result.success ? "¡Conexión Exitosa!" : "Error de Conexión", 
        description: result.message,
        variant: result.success ? "default" : "destructive"
      });
    } catch (e) {
      setTestStatus('error');
      toast({ variant: "destructive", title: "Error crítico", description: "No se pudo contactar con el servidor de IA." });
    }
  };

  if (!mounted) return null;

  return (
    <div className="flex-1 max-w-2xl mx-auto w-full p-6 space-y-8 pb-24">
      <header className="flex items-center gap-4 pt-4">
        <Link href="/dashboard">
          <Button variant="ghost" size="icon" className="rounded-full"><ArrowLeft /></Button>
        </Link>
        <div>
          <h1 className="text-2xl font-headline font-bold text-primary">Configuración Maestro</h1>
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black">Pure OpenAI Architecture</p>
        </div>
      </header>

      <div className="space-y-6">
        <Card className="border-none shadow-md rounded-2xl overflow-hidden">
          <CardHeader className="bg-primary/5 p-6">
            <CardTitle className="text-sm flex items-center gap-2 text-primary font-black uppercase tracking-wider">
              <Key className="w-4 h-4" /> OpenAI Key (Cerebro GPT-4o)
            </CardTitle>
            <CardDescription className="text-xs">Motor para análisis visual, razonamiento y chat.</CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="flex gap-2">
              <Input 
                type="password" 
                value={openaiKey} 
                onChange={e => setOpenaiKey(e.target.value)} 
                placeholder="sk-..." 
                className="flex-1 rounded-xl h-12"
              />
              <Button variant="outline" size="lg" onClick={handleTest} className="rounded-xl border-primary text-primary hover:bg-primary/5">
                {testStatus === 'loading' ? <Loader2 className="animate-spin h-4 w-4" /> : "Probar"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md rounded-2xl overflow-hidden">
          <CardHeader className="bg-indigo-50 p-6">
            <CardTitle className="text-sm flex items-center gap-2 text-indigo-700 font-black uppercase tracking-wider">
              <BookOpen className="w-4 h-4" /> Área de Conocimiento
            </CardTitle>
            <CardDescription className="text-xs">Define las reglas maestras de estilo que la IA debe seguir.</CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="space-y-2">
              <Label className="text-[10px] uppercase font-black text-muted-foreground">Instrucciones de Estilo y Guías</Label>
              <Textarea 
                placeholder="Ej: Priorizar siempre el estilo minimalista, evitar el color naranja, sugerir solo telas naturales..." 
                value={knowledge}
                onChange={e => setKnowledge(e.target.value)}
                className="min-h-[150px] rounded-2xl border-indigo-100 bg-indigo-50/20"
              />
              <p className="text-[9px] text-muted-foreground italic">Este conocimiento será inyectado en cada análisis de GPT-4o.</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md rounded-2xl overflow-hidden">
          <CardHeader className="bg-red-50 p-6">
            <CardTitle className="text-sm flex items-center gap-2 text-red-600 font-black uppercase tracking-wider">
              <Pin className="w-4 h-4" /> Pinterest Inspiration
            </CardTitle>
            <CardDescription className="text-xs">Para búsqueda visual de moodboards.</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <Input 
              type="password" 
              value={pinterestToken} 
              onChange={e => setPinterestToken(e.target.value)} 
              placeholder="Pinterest Access Token" 
              className="rounded-xl h-12"
            />
          </CardContent>
        </Card>
      </div>

      <Button onClick={handleSaveAll} className="w-full h-16 bg-primary text-xl font-bold shadow-2xl rounded-2xl hover:scale-[1.01] transition-transform">
        <Save className="mr-3 h-6 w-6" /> Guardar Todo
      </Button>
    </div>
  );
}
