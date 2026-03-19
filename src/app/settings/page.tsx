"use client"

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Save, Key, BrainCircuit, Sparkles, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import Link from 'next/link';
import { useLocalStorage, UserProfile, INITIAL_USER_PROFILE } from '@/lib/storage-hooks';
import { useToast } from "@/hooks/use-toast";
import { testAPIConnection } from '@/ai/flows/test-api-flow';

export default function SettingsPage() {
  const [profile, setProfile] = useLocalStorage<UserProfile>('estiliza_profile', INITIAL_USER_PROFILE);
  const [mounted, setMounted] = useState(false);
  const { toast } = useToast();

  const [openaiKey, setOpenaiKey] = useState('');
  const [testStatus, setTestStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  useEffect(() => {
    setMounted(true);
    setOpenaiKey(localStorage.getItem('openai_api_key') || '');
  }, []);

  const handleSaveAll = () => {
    try {
      localStorage.setItem('openai_api_key', openaiKey);
      setProfile({ ...profile });
      toast({
        title: "Arquitectura OpenAI Activada",
        description: "El cerebro y el artista están sincronizados.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error al guardar",
        description: "No se pudieron persistir los datos.",
      });
    }
  };

  const handleTest = async () => {
    if (!openaiKey) {
      toast({
        variant: "destructive",
        title: "Llave faltante",
        description: "Introduce tu llave de OpenAI.",
      });
      return;
    }

    setTestStatus('loading');
    try {
      const result = await testAPIConnection({ provider: 'openai', apiKey: openaiKey });
      if (result.success) {
        setTestStatus('success');
        toast({ title: "¡Perfecto!", description: result.message });
      } else {
        setTestStatus('error');
        toast({ variant: "destructive", title: "Error", description: result.message });
      }
    } catch (err: any) {
      setTestStatus('error');
      toast({ variant: "destructive", title: "Fallo", description: err.message });
    }
  };

  if (!mounted) return null;

  return (
    <div className="flex-1 max-w-2xl mx-auto w-full p-6 space-y-8 pb-24">
      <header className="flex items-center gap-4 pt-4">
        <Link href="/dashboard">
          <Button variant="ghost" size="icon"><ArrowLeft /></Button>
        </Link>
        <h1 className="text-2xl font-headline font-bold text-primary">Ajustes de IA</h1>
      </header>

      <Card className="border-none shadow-md bg-white">
        <CardHeader className="bg-primary/5 border-b p-4">
          <CardTitle className="text-sm flex items-center gap-2 text-primary uppercase font-bold tracking-wider">
            <Key className="w-4 h-4" /> Motor Unificado OpenAI
          </CardTitle>
          <CardDescription className="text-[10px]">Utiliza GPT-4o para análisis y DALL-E 3 para arte.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold">API KEY DE OPENAI</Label>
              {testStatus === 'success' && <CheckCircle2 className="w-4 h-4 text-green-500" />}
              {testStatus === 'error' && <XCircle className="w-4 h-4 text-destructive" />}
            </div>
            <div className="flex gap-2">
              <Input 
                type="password" 
                value={openaiKey} 
                onChange={e => setOpenaiKey(e.target.value)} 
                placeholder="sk-..." 
                className="flex-1 bg-muted/20"
              />
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleTest}
                disabled={testStatus === 'loading'}
              >
                {testStatus === 'loading' ? <Loader2 className="animate-spin w-4 h-4" /> : "Probar"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-none shadow-md overflow-hidden bg-white/50 backdrop-blur-sm">
        <CardHeader className="bg-secondary/5 border-b border-secondary/10">
          <div className="flex items-center gap-2 text-secondary">
            <BrainCircuit className="w-5 h-5" />
            <CardTitle className="text-lg font-bold uppercase tracking-tight">Manual de Estilo</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          <div className="space-y-2">
            <Label className="font-bold flex items-center gap-2 text-sm">
              <Sparkles className="w-4 h-4 text-primary" /> Preferencias para GPT-4o
            </Label>
            <Textarea 
              placeholder="Ej: Prefiero colores sobrios, evitar rayas..."
              className="min-h-[100px] text-sm bg-white/50"
              value={profile.stylePreferences.preferredStyles.join(', ')}
              onChange={e => setProfile({
                ...profile, 
                stylePreferences: {
                  ...profile.stylePreferences,
                  preferredStyles: e.target.value.split(',').map(s => s.trim())
                }
              })}
            />
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSaveAll} className="w-full h-14 bg-primary text-lg font-bold shadow-xl rounded-2xl hover:scale-[1.02] transition-all">
        <Save className="mr-2 w-5 h-5" /> Activar Sistema OpenAI
      </Button>
    </div>
  );
}
