"use client"

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Save, Key, ImageIcon, Loader2, BookOpen, Sparkles, CheckCircle, XCircle } from "lucide-react";
import Link from 'next/link';
import { useLocalStorage, UserProfile, INITIAL_USER_PROFILE } from '@/lib/storage-hooks';
import { useToast } from "@/hooks/use-toast";
import { testAPIConnection } from '@/ai/flows/test-api-flow';

export default function SettingsPage() {
  const [profile, setProfile] = useLocalStorage<UserProfile>('estiliza_profile', INITIAL_USER_PROFILE);
  const [mounted, setMounted] = useState(false);
  const { toast } = useToast();

  const [openaiKey, setOpenaiKey] = useState('');
  const [unsplashKey, setUnsplashKey] = useState('');
  const [knowledge, setKnowledge] = useState('');
  const [testStatusOpenAI, setTestStatusOpenAI] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [testStatusUnsplash, setTestStatusUnsplash] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  useEffect(() => {
    setMounted(true);
    setOpenaiKey(localStorage.getItem('openai_api_key') || '');
    setUnsplashKey(localStorage.getItem('unsplash_access_key') || '');
    setKnowledge(profile.knowledgeBase || '');
  }, [profile.knowledgeBase]);

  const handleSaveAll = () => {
    localStorage.setItem('openai_api_key', openaiKey);
    localStorage.setItem('unsplash_access_key', unsplashKey);
    
    setProfile({
      ...profile,
      knowledgeBase: knowledge
    });
    
    toast({
      title: "Configuración Guardada",
      description: "Pipeline de IA y motor visual de Unsplash actualizados.",
    });
  };

  const handleTestOpenAI = async () => {
    if (!openaiKey) return;
    setTestStatusOpenAI('loading');
    const result = await testAPIConnection({ provider: 'openai', apiKey: openaiKey });
    setTestStatusOpenAI(result.success ? 'success' : 'error');
    toast({ 
      title: result.success ? "OpenAI: Conectado" : "OpenAI: Error", 
      description: result.message,
      variant: result.success ? "default" : "destructive"
    });
  };

  const handleTestUnsplash = async () => {
    if (!unsplashKey) return;
    setTestStatusUnsplash('loading');
    const result = await testAPIConnection({ provider: 'unsplash', apiKey: unsplashKey });
    setTestStatusUnsplash(result.success ? 'success' : 'error');
    toast({ 
      title: result.success ? "Unsplash: Conectado" : "Unsplash: Error", 
      description: result.message,
      variant: result.success ? "default" : "destructive"
    });
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
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black">AI Pipeline & Visual Engine</p>
        </div>
      </header>

      <div className="space-y-6">
        <Card className="border-none shadow-md rounded-2xl overflow-hidden bg-white">
          <CardHeader className="bg-primary/5 p-6">
            <CardTitle className="text-sm flex items-center justify-between text-primary font-black uppercase tracking-wider">
              <span className="flex items-center gap-2"><Key className="w-4 h-4" /> OpenAI Key (GPT-4o)</span>
              {testStatusOpenAI === 'success' && <CheckCircle className="w-4 h-4 text-green-500" />}
              {testStatusOpenAI === 'error' && <XCircle className="w-4 h-4 text-destructive" />}
            </CardTitle>
            <CardDescription className="text-xs">Cerebro para análisis visual, razonamiento y estilo.</CardDescription>
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
              <Button variant="outline" size="sm" onClick={handleTestOpenAI} className="rounded-xl border-primary text-primary hover:bg-primary/5">
                {testStatusOpenAI === 'loading' ? <Loader2 className="animate-spin h-4 w-4" /> : "Probar"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md rounded-2xl overflow-hidden bg-white">
          <CardHeader className="bg-pink-50 p-6">
            <CardTitle className="text-sm flex items-center justify-between text-pink-700 font-black uppercase tracking-wider">
              <span className="flex items-center gap-2"><ImageIcon className="w-4 h-4" /> Unsplash Access Key</span>
              {testStatusUnsplash === 'success' && <CheckCircle className="w-4 h-4 text-green-500" />}
              {testStatusUnsplash === 'error' && <XCircle className="w-4 h-4 text-destructive" />}
            </CardTitle>
            <CardDescription className="text-xs">Motor para encontrar imágenes reales de prendas sugeridas.</CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="flex gap-2">
              <Input 
                type="password" 
                value={unsplashKey} 
                onChange={e => setUnsplashKey(e.target.value)} 
                placeholder="Tu Unsplash Access Key" 
                className="flex-1 rounded-xl h-12"
              />
              <Button variant="outline" size="sm" onClick={handleTestUnsplash} className="rounded-xl border-pink-600 text-pink-600 hover:bg-pink-50">
                {testStatusUnsplash === 'loading' ? <Loader2 className="animate-spin h-4 w-4" /> : "Probar"}
              </Button>
            </div>
            <p className="text-[9px] text-muted-foreground italic">Si está vacía, se usarán imágenes de respaldo genéricas de moda.</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md rounded-2xl overflow-hidden bg-white">
          <CardHeader className="bg-indigo-50 p-6">
            <CardTitle className="text-sm flex items-center gap-2 text-indigo-700 font-black uppercase tracking-wider">
              <BookOpen className="w-4 h-4" /> Área de Conocimiento
            </CardTitle>
            <CardDescription className="text-xs">Define las reglas maestras que la IA debe seguir.</CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="space-y-2">
              <Label className="text-[10px] uppercase font-black text-muted-foreground">Instrucciones de Estilo</Label>
              <Textarea 
                placeholder="Ej: Priorizar siempre el estilo minimalista, evitar el color naranja..." 
                value={knowledge}
                onChange={e => setKnowledge(e.target.value)}
                className="min-h-[150px] rounded-2xl border-indigo-100 bg-indigo-50/20"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <Button onClick={handleSaveAll} className="w-full h-16 bg-primary text-xl font-bold shadow-2xl rounded-2xl hover:scale-[1.01] transition-transform">
        <Save className="mr-3 h-6 w-6" /> Guardar Todo
      </Button>
    </div>
  );
}
