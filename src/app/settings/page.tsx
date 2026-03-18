
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

  const [localKeys, setLocalKeys] = useState({
    openai: '',
    gemini: ''
  });

  const [testStatus, setTestStatus] = useState<{
    openai: 'idle' | 'loading' | 'success' | 'error',
    gemini: 'idle' | 'loading' | 'success' | 'error'
  }>({
    openai: 'idle',
    gemini: 'idle'
  });

  useEffect(() => {
    setMounted(true);
    setLocalKeys({
      openai: localStorage.getItem('openai_api_key') || '',
      gemini: localStorage.getItem('GOOGLE_GENAI_API_KEY') || ''
    });
  }, []);

  const handleSaveAll = () => {
    try {
      localStorage.setItem('openai_api_key', localKeys.openai);
      localStorage.setItem('GOOGLE_GENAI_API_KEY', localKeys.gemini);
      // Forzar actualización del estado local
      setProfile({ ...profile });
      
      toast({
        title: "Motor Híbrido Activado",
        description: "Configuración guardada correctamente en el dispositivo.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error al guardar",
        description: "No se pudieron persistir las llaves.",
      });
    }
  };

  const handleTest = async (provider: 'openai' | 'gemini') => {
    const key = provider === 'openai' ? localKeys.openai : localKeys.gemini;
    if (!key) {
      toast({
        variant: "destructive",
        title: "Llave faltante",
        description: `Por favor, introduce la llave de ${provider} antes de probar.`,
      });
      return;
    }

    setTestStatus(prev => ({ ...prev, [provider]: 'loading' }));
    
    try {
      const result = await testAPIConnection({ provider, apiKey: key });
      if (result.success) {
        setTestStatus(prev => ({ ...prev, [provider]: 'success' }));
        toast({ title: "¡Prueba Exitosa!", description: result.message });
      } else {
        setTestStatus(prev => ({ ...prev, [provider]: 'error' }));
        toast({ variant: "destructive", title: "Error de Conexión", description: result.message });
      }
    } catch (err: any) {
      setTestStatus(prev => ({ ...prev, [provider]: 'error' }));
      toast({ variant: "destructive", title: "Fallo Crítico", description: err.message });
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

      <Card className="border-none shadow-md overflow-hidden bg-white/50 backdrop-blur-sm">
        <CardHeader className="bg-primary/5 border-b border-primary/10">
          <div className="flex items-center gap-2 text-primary">
            <BrainCircuit className="w-5 h-5" />
            <CardTitle className="text-lg font-bold uppercase tracking-tight">Análisis de Perfil</CardTitle>
          </div>
          <CardDescription className="text-xs">Datos técnicos que Gemini utiliza para tu asesoría personalizada.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase text-muted-foreground">Figura Corporal</Label>
                <Input value={profile.figureAnalysis || 'No analizada'} readOnly className="bg-muted/30 text-xs font-bold border-none" />
            </div>
            <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase text-muted-foreground">Colorimetría</Label>
                <Input value={profile.colorimetryAnalysis || 'No analizada'} readOnly className="bg-muted/30 text-xs font-bold border-none" />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="font-bold flex items-center gap-2 text-sm">
              <Sparkles className="w-4 h-4 text-primary" /> Estilos Preferidos
            </Label>
            <Textarea 
              placeholder="Instrucciones personalizadas..."
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

      <Card className="border-none shadow-md bg-white">
        <CardHeader className="bg-secondary/5 border-b p-4">
          <CardTitle className="text-sm flex items-center gap-2 text-secondary uppercase font-bold tracking-wider">
            <Key className="w-4 h-4" /> Conectores de API
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold">OpenAI Key (Artista Pixar)</Label>
              {testStatus.openai === 'success' && <CheckCircle2 className="w-4 h-4 text-green-500" />}
              {testStatus.openai === 'error' && <XCircle className="w-4 h-4 text-destructive" />}
            </div>
            <div className="flex gap-2">
              <Input 
                type="password" 
                value={localKeys.openai} 
                onChange={e => setLocalKeys({...localKeys, openai: e.target.value})} 
                placeholder="sk-..." 
                className="flex-1 bg-muted/20"
              />
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handleTest('openai')}
                disabled={testStatus.openai === 'loading'}
              >
                {testStatus.openai === 'loading' ? <Loader2 className="animate-spin w-4 h-4" /> : "Probar"}
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold">Gemini Key (Cerebro Analítico)</Label>
              {testStatus.gemini === 'success' && <CheckCircle2 className="w-4 h-4 text-green-500" />}
              {testStatus.gemini === 'error' && <XCircle className="w-4 h-4 text-destructive" />}
            </div>
            <div className="flex gap-2">
              <Input 
                type="password" 
                value={localKeys.gemini} 
                onChange={e => setLocalKeys({...localKeys, gemini: e.target.value})} 
                placeholder="AIza..." 
                className="flex-1 bg-muted/20"
              />
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handleTest('gemini')}
                disabled={testStatus.gemini === 'loading'}
              >
                {testStatus.gemini === 'loading' ? <Loader2 className="animate-spin w-4 h-4" /> : "Probar"}
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground italic">El sistema probará automáticamente modelos Flash 2.0 y 2.5.</p>
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSaveAll} className="w-full h-14 bg-primary text-lg font-bold shadow-xl rounded-2xl hover:scale-[1.02] transition-all">
        <Save className="mr-2 w-5 h-5" /> Guardar y Activar Motor
      </Button>
    </div>
  );
}
