"use client"

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Save, Database, Key, Info, Sparkles, User, BrainCircuit } from "lucide-react";
import Link from 'next/link';
import { useLocalStorage, UserProfile, INITIAL_USER_PROFILE } from '@/lib/storage-hooks';
import { useToast } from "@/hooks/use-toast";

export default function SettingsPage() {
  const [profile, setProfile] = useLocalStorage<UserProfile>('estiliza_profile', INITIAL_USER_PROFILE);
  const [preferOpenAI, setPreferOpenAI] = useLocalStorage('prefer_openai', false);
  const [mounted, setMounted] = useState(false);
  const { toast } = useToast();

  const [localKeys, setLocalKeys] = useState({
    google: '',
    openai: ''
  });

  useEffect(() => {
    setMounted(true);
    const gKey = localStorage.getItem('google_genai_key') || '';
    const oKey = localStorage.getItem('openai_api_key') || '';
    setLocalKeys({ google: gKey, openai: oKey });
  }, []);

  const handleSaveAll = () => {
    // Save keys to localStorage
    localStorage.setItem('google_genai_key', localKeys.google);
    localStorage.setItem('openai_api_key', localKeys.openai);
    
    // The profile is already synced via useLocalStorage, but we can trigger a manual save if needed
    toast({
      title: "Configuración Guardada",
      description: "Toda tu información y claves han sido actualizadas.",
    });
  };

  if (!mounted) return null;

  return (
    <div className="flex-1 max-w-2xl mx-auto w-full p-6 space-y-8 pb-24">
      <header className="flex items-center gap-4 pt-4">
        <Link href="/dashboard">
          <Button variant="ghost" size="icon"><ArrowLeft /></Button>
        </Link>
        <h1 className="text-2xl font-headline font-bold">Configuración de EstilizaPro</h1>
      </header>

      {/* Perfil y Conocimiento */}
      <Card className="border-none shadow-md overflow-hidden">
        <CardHeader className="bg-primary/5">
          <div className="flex items-center gap-2 text-primary">
            <User className="w-5 h-5" />
            <CardTitle className="text-lg">Tu Perfil</CardTitle>
          </div>
          <CardDescription>Información básica y nombre de usuario.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          <div className="space-y-2">
            <Label htmlFor="name">Tu Nombre</Label>
            <Input 
              id="name"
              value={profile.name} 
              onChange={e => setProfile({...profile, name: e.target.value})}
              placeholder="¿Cómo quieres que te llame Pilar?"
            />
          </div>
        </CardContent>
      </Card>

      {/* Área de Conocimiento AI */}
      <Card className="border-none shadow-md overflow-hidden">
        <CardHeader className="bg-secondary/5">
          <div className="flex items-center gap-2 text-secondary">
            <BrainCircuit className="w-5 h-5" />
            <CardTitle className="text-lg">Área de Conocimiento de Pilar</CardTitle>
          </div>
          <CardDescription>Lo que la IA sabe sobre tu estilo y figura.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          <div className="space-y-2">
            <Label>Análisis de Figura (Somatotipo)</Label>
            <Input 
              value={profile.figureAnalysis} 
              onChange={e => setProfile({...profile, figureAnalysis: e.target.value})}
              placeholder="Ej: Reloj de Arena, Triángulo..."
            />
          </div>
          <div className="space-y-2">
            <Label>Análisis de Colorimetría (Paleta)</Label>
            <Input 
              value={profile.colorimetryAnalysis} 
              onChange={e => setProfile({...profile, colorimetryAnalysis: e.target.value})}
              placeholder="Ej: Otoño Cálido, Invierno Frío..."
            />
          </div>
          <div className="space-y-2">
            <Label>Notas Adicionales de Estilo</Label>
            <Textarea 
              placeholder="Describe detalles que Pilar debe recordar..."
              value={profile.stylePreferences.preferredStyles.join(', ')}
              onChange={e => setProfile({
                ...profile, 
                stylePreferences: {
                  ...profile.stylePreferences,
                  preferredStyles: e.target.value.split(',').map(s => s.trim())
                }
              })}
              className="min-h-[100px]"
            />
          </div>
        </CardContent>
      </Card>

      {/* Gestión de APIs */}
      <Card className="border-none shadow-md overflow-hidden">
        <CardHeader className="bg-muted">
          <div className="flex items-center gap-2 text-foreground">
            <Key className="w-5 h-5" />
            <CardTitle className="text-lg">Gestión de APIs (IA)</CardTitle>
          </div>
          <CardDescription>Configura tus llaves de pago para máxima calidad de imagen.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <div className="space-y-2">
            <Label>Google Gemini API Key</Label>
            <Input 
              type="password" 
              placeholder="Google API Key" 
              value={localKeys.google} 
              onChange={e => setLocalKeys({...localKeys, google: e.target.value})}
            />
          </div>

          <div className="space-y-2">
            <Label>OpenAI API Key (Para DALL-E 3)</Label>
            <Input 
              type="password" 
              placeholder="sk-..." 
              value={localKeys.openai} 
              onChange={e => setLocalKeys({...localKeys, openai: e.target.value})}
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-primary/5 rounded-xl border border-primary/10">
            <div className="space-y-0.5">
              <Label className="text-sm font-bold flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" /> Priorizar OpenAI (DALL-E 3)
              </Label>
              <p className="text-[10px] text-muted-foreground">Usa OpenAI para generar el Avatar Pixar con mayor realismo.</p>
            </div>
            <Switch checked={preferOpenAI} onCheckedChange={setPreferOpenAI} />
          </div>

          <div className="bg-blue-50 p-4 rounded-lg flex gap-3">
            <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
            <p className="text-[10px] text-blue-700 leading-normal">
              <b>Nota:</b> Los datos se guardan exclusivamente en tu dispositivo. EstilizaPro no almacena tus llaves en servidores externos.
            </p>
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSaveAll} className="w-full h-14 bg-primary text-lg font-bold shadow-xl rounded-2xl">
        <Save className="mr-2 w-5 h-5" /> Guardar Todo y Actualizar
      </Button>
    </div>
  );
}
