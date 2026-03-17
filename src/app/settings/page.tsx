"use client"

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Save, Key, Info, BrainCircuit, User } from "lucide-react";
import Link from 'next/link';
import { useLocalStorage, UserProfile, INITIAL_USER_PROFILE } from '@/lib/storage-hooks';
import { useToast } from "@/hooks/use-toast";

export default function SettingsPage() {
  const [profile, setProfile] = useLocalStorage<UserProfile>('estiliza_profile', INITIAL_USER_PROFILE);
  const [mounted, setMounted] = useState(false);
  const { toast } = useToast();

  const [localKeys, setLocalKeys] = useState({
    openai: ''
  });

  useEffect(() => {
    setMounted(true);
    const oKey = localStorage.getItem('openai_api_key') || '';
    setLocalKeys({ openai: oKey });
  }, []);

  const handleSaveAll = () => {
    try {
      localStorage.setItem('openai_api_key', localKeys.openai);
      // Forzamos el guardado de los campos de perfil
      setProfile({ ...profile });
      
      toast({
        title: "Configuración Guardada",
        description: "El contexto de análisis de la IA ha sido actualizado correctamente.",
      });
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Error al guardar",
        description: "No se pudieron persistir los cambios localmente.",
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
        <h1 className="text-2xl font-headline font-bold">Configuración AI</h1>
      </header>

      {/* Perfil Básico */}
      <Card className="border-none shadow-md overflow-hidden">
        <CardHeader className="bg-primary/5">
          <div className="flex items-center gap-2 text-primary">
            <User className="w-5 h-5" />
            <CardTitle className="text-lg">Perfil de Usuario</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre</Label>
            <Input 
              id="name"
              value={profile.name} 
              onChange={e => setProfile({...profile, name: e.target.value})}
              placeholder="Tu nombre para la IA"
            />
          </div>
        </CardContent>
      </Card>

      {/* Área de Conocimiento Maestro (Contexto de Análisis) */}
      <Card className="border-none shadow-md overflow-hidden">
        <CardHeader className="bg-secondary/5">
          <div className="flex items-center gap-2 text-secondary">
            <BrainCircuit className="w-5 h-5" />
            <CardTitle className="text-lg font-bold">Contexto de Análisis para la IA</CardTitle>
          </div>
          <CardDescription>
            Estos datos maestros alimentan el motor de colorimetría, figura, cápsulas y el chat de asesoría.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          <div className="space-y-2">
            <Label className="font-bold">Análisis de Figura (Somatotipo)</Label>
            <Input 
              value={profile.figureAnalysis || ''} 
              onChange={e => setProfile({...profile, figureAnalysis: e.target.value})}
              placeholder="Ej: Reloj de Arena, Triángulo..."
            />
          </div>
          <div className="space-y-2">
            <Label className="font-bold">Análisis de Colorimetría (Paleta)</Label>
            <Input 
              value={profile.colorimetryAnalysis || ''} 
              onChange={e => setProfile({...profile, colorimetryAnalysis: e.target.value})}
              placeholder="Ej: Otoño Cálido, Invierno..."
            />
          </div>
          <div className="space-y-2">
            <Label className="font-bold">Instrucciones de Estilo</Label>
            <Textarea 
              placeholder="Instrucciones maestras para la IA sobre tus gustos..."
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
            <CardTitle className="text-lg">Llave Maestra OpenAI</CardTitle>
          </div>
          <CardDescription>Requerido para el procesamiento de imágenes, avatar y chat premium.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          <div className="space-y-2">
            <Label>OpenAI API Key</Label>
            <Input 
              type="password" 
              placeholder="sk-..." 
              value={localKeys.openai} 
              onChange={e => setLocalKeys({...localKeys, openai: e.target.value})}
            />
          </div>

          <div className="bg-blue-50 p-4 rounded-lg flex gap-3">
            <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
            <p className="text-[10px] text-blue-700">
              Tus llaves se guardan localmente en tu navegador.
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
