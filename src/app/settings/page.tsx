"use client"

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Save, Key, Info, Sparkles, User, BrainCircuit } from "lucide-react";
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
    try {
      // Guardar claves en localStorage
      localStorage.setItem('google_genai_key', localKeys.google);
      localStorage.setItem('openai_api_key', localKeys.openai);
      
      // Forzar guardado de perfil
      setProfile({ ...profile });
      
      toast({
        title: "Configuración Guardada",
        description: "Toda tu información, claves y contexto de IA han sido actualizados con éxito.",
      });
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Error al guardar",
        description: "No se pudieron guardar los cambios. Inténtalo de nuevo.",
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
        <h1 className="text-2xl font-headline font-bold">Configuración EstilizaPro</h1>
      </header>

      {/* Perfil Básico */}
      <Card className="border-none shadow-md overflow-hidden">
        <CardHeader className="bg-primary/5">
          <div className="flex items-center gap-2 text-primary">
            <User className="w-5 h-5" />
            <CardTitle className="text-lg">Tu Perfil</CardTitle>
          </div>
          <CardDescription>Información básica para personalizar tu experiencia.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          <div className="space-y-2">
            <Label htmlFor="name">Tu Nombre</Label>
            <Input 
              id="name"
              value={profile.name} 
              onChange={e => setProfile({...profile, name: e.target.value})}
              placeholder="¿Cómo quieres que te llamemos?"
            />
          </div>
        </CardContent>
      </Card>

      {/* Contexto de Análisis para la IA */}
      <Card className="border-none shadow-md overflow-hidden">
        <CardHeader className="bg-secondary/5">
          <div className="flex items-center gap-2 text-secondary">
            <BrainCircuit className="w-5 h-5" />
            <CardTitle className="text-lg">Contexto de Análisis para la IA</CardTitle>
          </div>
          <CardDescription>
            Datos maestros que utiliza la IA para colorimetría, figura, cápsulas y chat.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          <div className="space-y-2">
            <Label>Análisis de Figura (Somatotipo)</Label>
            <Input 
              value={profile.figureAnalysis || ''} 
              onChange={e => setProfile({...profile, figureAnalysis: e.target.value})}
              placeholder="Ej: Reloj de Arena, Triángulo, Rectángulo..."
            />
            <p className="text-[10px] text-muted-foreground italic">Influye en cómo la IA recomienda cortes de prendas.</p>
          </div>
          <div className="space-y-2">
            <Label>Análisis de Colorimetría (Paleta)</Label>
            <Input 
              value={profile.colorimetryAnalysis || ''} 
              onChange={e => setProfile({...profile, colorimetryAnalysis: e.target.value})}
              placeholder="Ej: Otoño Cálido, Invierno Frío, Verano..."
            />
            <p className="text-[10px] text-muted-foreground italic">Influye en los colores sugeridos para tus cápsulas.</p>
          </div>
          <div className="space-y-2">
            <Label>Instrucciones de Estilo y Preferencias</Label>
            <Textarea 
              placeholder="Describe detalles que la IA debe recordar..."
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
            <p className="text-[10px] text-muted-foreground italic">Base de conocimiento para el asistente de chat y cápsulas.</p>
          </div>
        </CardContent>
      </Card>

      {/* Gestión de APIs */}
      <Card className="border-none shadow-md overflow-hidden">
        <CardHeader className="bg-muted">
          <div className="flex items-center gap-2 text-foreground">
            <Key className="w-5 h-5" />
            <CardTitle className="text-lg">Motores de IA (Pago)</CardTitle>
          </div>
          <CardDescription>Configura tus llaves de OpenAI/Google para máxima calidad Pixar.</CardDescription>
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
            <Label>OpenAI API Key (DALL-E 3)</Label>
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
              <p className="text-[10px] text-muted-foreground">Recomendado para Avatares Pixar si tienes saldo.</p>
            </div>
            <Switch checked={preferOpenAI} onCheckedChange={setPreferOpenAI} />
          </div>

          <div className="bg-blue-50 p-4 rounded-lg flex gap-3">
            <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
            <p className="text-[10px] text-blue-700 leading-normal">
              <b>Privacidad:</b> Tus llaves se guardan localmente en tu navegador.
            </p>
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSaveAll} className="w-full h-14 bg-primary text-lg font-bold shadow-xl rounded-2xl transition-all active:scale-[0.98]">
        <Save className="mr-2 w-5 h-5" /> Guardar Todo el Conocimiento
      </Button>
    </div>
  );
}
