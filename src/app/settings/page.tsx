
"use client"

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Save, Key, ImageIcon, Loader2, BookOpen, CheckCircle, XCircle, Info, Sparkles } from "lucide-react";
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
      description: "Las llaves de API han sido actualizadas.",
    });
  };

  const handleTest = async (provider: 'openai' | 'unsplash') => {
    const statusSetters = {
      openai: setTestStatusOpenAI,
      unsplash: setTestStatusUnsplash
    };
    
    const keys = {
      openai: openaiKey,
      unsplash: unsplashKey
    };

    statusSetters[provider]('loading');
    const result = await testAPIConnection({ provider: provider as any, apiKey: keys[provider as keyof typeof keys] });
    statusSetters[provider](result.success ? 'success' : 'error');
    
    toast({ 
      title: `${provider.toUpperCase()}: ${result.success ? "Conectado" : "Error"}`, 
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
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black">Control de Motores IA</p>
        </div>
      </header>

      <div className="space-y-6">
        <Card className="border-none shadow-md rounded-2xl overflow-hidden bg-white">
          <CardHeader className="bg-primary/5 p-6">
            <CardTitle className="text-sm flex items-center justify-between text-primary font-black uppercase tracking-wider">
              <span className="flex items-center gap-2"><Key className="w-4 h-4" /> OpenAI Key (GPT-4o & gpt-image-2)</span>
              {testStatusOpenAI === 'success' && <CheckCircle className="w-4 h-4 text-green-500" />}
            </CardTitle>
            <CardDescription className="text-xs">Usa tu llave de OpenAI para chat e imágenes.</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex gap-2">
              <Input type="password" value={openaiKey} onChange={e => setOpenaiKey(e.target.value)} placeholder="OpenAI API Key" className="rounded-xl" />
              <Button variant="outline" onClick={() => handleTest('openai')}>Probar</Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md rounded-2xl overflow-hidden bg-white">
          <CardHeader className="bg-pink-50 p-6">
            <CardTitle className="text-sm flex items-center justify-between text-pink-700 font-black uppercase tracking-wider">
              <span className="flex items-center gap-2"><ImageIcon className="w-4 h-4" /> Unsplash Key (Catálogo)</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex gap-2">
              <Input type="password" value={unsplashKey} onChange={e => setUnsplashKey(e.target.value)} placeholder="Unsplash Access Key" className="rounded-xl" />
              <Button variant="outline" onClick={() => handleTest('unsplash')}>Probar</Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md rounded-2xl overflow-hidden bg-white">
          <CardHeader className="bg-muted/50 p-6">
            <CardTitle className="text-sm flex items-center gap-2 text-muted-foreground font-black uppercase tracking-wider">
              <BookOpen className="w-4 h-4" /> Reglas de Estilo
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <Textarea 
              value={knowledge} 
              onChange={e => setKnowledge(e.target.value)} 
              placeholder="Escribe reglas personalizadas para tu IA..."
              className="min-h-[150px] rounded-xl text-xs leading-relaxed"
            />
          </CardContent>
        </Card>

        <Button onClick={handleSaveAll} className="w-full h-16 bg-primary text-xl font-bold shadow-2xl rounded-2xl">
          <Save className="mr-3 h-6 w-6" /> Guardar Configuración
        </Button>
      </div>
    </div>
  );
}
