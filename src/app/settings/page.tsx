
"use client"

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Save, Database, Key, Info, Sparkles } from "lucide-react";
import Link from 'next/link';
import { useLocalStorage } from '@/lib/storage-hooks';

export default function SettingsPage() {
  const [googleKey, setGoogleKey] = useState('');
  const [openaiKey, setOpenaiKey] = useState('');
  const [preferOpenAI, setPreferOpenAI] = useLocalStorage('prefer_openai', false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // En una app real esto leería de variables de entorno, 
    // aquí simulamos la persistencia en el dispositivo del usuario.
    const gKey = localStorage.getItem('google_genai_key');
    const oKey = localStorage.getItem('openai_api_key');
    if (gKey) setGoogleKey(gKey);
    if (oKey) setOpenaiKey(oKey);
  }, []);

  const handleSave = () => {
    localStorage.setItem('google_genai_key', googleKey);
    localStorage.setItem('openai_api_key', openaiKey);
    alert('Configuración de IA guardada localmente.');
  };

  if (!mounted) return null;

  return (
    <div className="flex-1 max-w-2xl mx-auto w-full p-6 space-y-6 pb-20">
      <header className="flex items-center gap-4 pt-4">
        <Link href="/dashboard">
          <Button variant="ghost" size="icon"><ArrowLeft /></Button>
        </Link>
        <h1 className="text-2xl font-headline font-bold">Gestión AI</h1>
      </header>

      <Card className="border-none shadow-md">
        <CardHeader>
          <div className="flex items-center gap-2 text-primary">
            <Key className="w-5 h-5" />
            <CardTitle className="text-lg">Configuración de APIs</CardTitle>
          </div>
          <CardDescription>Configura tus propias llaves de API de pago para mayor calidad.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Google Gemini API Key (IA Studio)</Label>
            <Input 
              type="password" 
              placeholder="Google API Key" 
              value={googleKey} 
              onChange={e => setGoogleKey(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>OpenAI API Key (Pago)</Label>
            <Input 
              type="password" 
              placeholder="sk-..." 
              value={openaiKey} 
              onChange={e => setOpenaiKey(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border border-dashed">
            <div className="space-y-0.5">
              <Label className="text-sm font-bold flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" /> Priorizar OpenAI
              </Label>
              <p className="text-[10px] text-muted-foreground">Usa DALL-E 3 para Avatares Pixar de alta fidelidad.</p>
            </div>
            <Switch checked={preferOpenAI} onCheckedChange={setPreferOpenAI} />
          </div>

          <Button onClick={handleSave} className="w-full bg-primary font-bold">
            <Save className="mr-2 w-4 h-4" /> Guardar Cambios
          </Button>

          <div className="bg-blue-50 p-4 rounded-lg flex gap-3">
            <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
            <p className="text-[10px] text-blue-700 leading-normal">
              <b>Importante:</b> Al usar tus propias llaves, los costes de generación se cargarán a tus respectivas cuentas de Google o OpenAI. EstilizaPro AI no gestiona tus fondos.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
