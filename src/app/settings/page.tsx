
"use client"

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Save, Key, BrainCircuit, Sparkles } from "lucide-react";
import Link from 'next/link';
import { useLocalStorage, UserProfile, INITIAL_USER_PROFILE } from '@/lib/storage-hooks';
import { useToast } from "@/hooks/use-toast";

export default function SettingsPage() {
  const [profile, setProfile] = useLocalStorage<UserProfile>('estiliza_profile', INITIAL_USER_PROFILE);
  const [mounted, setMounted] = useState(false);
  const { toast } = useToast();

  const [localKeys, setLocalKeys] = useState({
    openai: '',
    gemini: ''
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
      setProfile({ ...profile });
      
      toast({
        title: "Llaves Maestras Guardadas",
        description: "Motor híbrido OpenAI + Gemini listo para operar.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error al guardar",
        description: "No se pudieron persistir las llaves.",
      });
    }
  };

  if (!mounted) return null;

  return (
    <div className="flex-1 max-w-2xl mx-auto w-full p-6 space-y-8 pb-24">
      <header className="flex items-center gap-4 pt-4">
        <Link href="/dashboard">
          <Button variant="ghost" size="icon"><ArrowLeft /></Button>
        </Link>
        <h1 className="text-2xl font-headline font-bold">Gestión de IA Híbrida</h1>
      </header>

      <Card className="border-none shadow-md overflow-hidden">
        <CardHeader className="bg-primary/5 border-b border-primary/10">
          <div className="flex items-center gap-2 text-primary">
            <BrainCircuit className="w-5 h-5" />
            <CardTitle className="text-lg font-bold">Conocimiento Maestro de Pilar Catalán</CardTitle>
          </div>
          <CardDescription>Datos clave que Gemini utiliza para tu asesoría personalizada.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase text-muted-foreground">Figura Corporal</Label>
                <Input value={profile.figureAnalysis || 'No analizada'} readOnly className="bg-muted/30 text-xs font-bold" />
            </div>
            <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase text-muted-foreground">Colorimetría</Label>
                <Input value={profile.colorimetryAnalysis || 'No analizada'} readOnly className="bg-muted/30 text-xs font-bold" />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="font-bold flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" /> Preferencias e Instrucciones
            </Label>
            <Textarea 
              placeholder="Instrucciones personalizadas para tu estilista virtual..."
              className="min-h-[120px]"
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

      <Card className="border-none shadow-md">
        <CardHeader className="bg-secondary/5 border-b p-4">
          <CardTitle className="text-sm flex items-center gap-2 text-secondary"><Key className="w-4 h-4" /> Conectores de IA</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label className="text-xs">OpenAI Key (Avatar Pixar DALL-E 3)</Label>
            <Input type="password" value={localKeys.openai} onChange={e => setLocalKeys({...localKeys, openai: e.target.value})} placeholder="sk-..." />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Gemini Key (Cerebro Analítico 1.5 Flash)</Label>
            <Input type="password" value={localKeys.gemini} onChange={e => setLocalKeys({...localKeys, gemini: e.target.value})} placeholder="AIza..." />
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSaveAll} className="w-full h-14 bg-primary text-lg font-bold shadow-xl rounded-2xl">
        <Save className="mr-2 w-5 h-5" /> Guardar Configuración Híbrida
      </Button>
    </div>
  );
}
