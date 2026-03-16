"use client"

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Save, Database, Key, Info } from "lucide-react";
import Link from 'next/link';

export default function SettingsPage() {
  const [apiKey, setApiKey] = useState('');
  const [knowledge, setKnowledge] = useState('');

  const handleSave = () => {
    // Logic to store API keys locally (simulated)
    alert('Configuración de IA guardada localmente.');
  };

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
          <CardDescription>Configura las llaves necesarias para los servicios de generación de imagen y texto.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Google Gemini API Key</Label>
            <Input 
              type="password" 
              placeholder="••••••••••••••••" 
              value={apiKey} 
              onChange={e => setApiKey(e.target.value)}
            />
          </div>
          <div className="bg-blue-50 p-3 rounded-lg flex gap-2">
            <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
            <p className="text-[10px] text-blue-700">Estas llaves se almacenan únicamente en tu dispositivo. EstilizaPro AI no envía estas llaves a servidores externos.</p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-none shadow-md">
        <CardHeader>
          <div className="flex items-center gap-2 text-secondary">
            <Database className="w-5 h-5" />
            <CardTitle className="text-lg">Base de Conocimiento</CardTitle>
          </div>
          <CardDescription>Carga instrucciones personalizadas o reglas de estilo para que la IA las aprenda.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Instrucciones de Estilo (Knowledge)</Label>
            <Textarea 
              className="min-h-[150px]"
              placeholder="Ej: Priorizar paletas frías para verano. Evitar cortes rectos en figuras de tipo manzana..." 
              value={knowledge} 
              onChange={e => setKnowledge(e.target.value)}
            />
          </div>
          <Button onClick={handleSave} className="w-full bg-primary">
            <Save className="mr-2 w-4 h-4" /> Guardar Conocimiento
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
