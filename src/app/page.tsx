
"use client"

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Lock, Sparkles, Settings } from "lucide-react";
import Link from 'next/link';

export default function LoginPage() {
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState(false);
  const router = useRouter();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcode === '1,2,3,4') {
      localStorage.setItem('estiliza_auth', 'true');
      const onboarded = localStorage.getItem('estiliza_profile');
      if (onboarded) {
        router.push('/dashboard');
      } else {
        router.push('/onboarding');
      }
    } else {
      setError(true);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 bg-background relative">
      {/* Botón de Ajustes Flotante Muy Visible */}
      <div className="absolute top-6 right-6 z-50">
        <Link href="/settings">
          <Button variant="outline" className="rounded-full shadow-lg border-primary text-primary font-bold gap-2 bg-white">
            <Settings className="w-5 h-5" /> Configurar APIs
          </Button>
        </Link>
      </div>

      <div className="w-full max-w-md space-y-8 text-center">
        <div className="space-y-2">
          <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-2xl mb-4">
            <Sparkles className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-4xl font-headline font-bold text-foreground">EstilizaPro AI</h1>
          <p className="text-muted-foreground">Tu asistente de imagen personal exclusivo</p>
        </div>

        <Card className="border-none shadow-xl bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-xl">Acceso Seguro</CardTitle>
            <CardDescription>Introduce el código de acceso genérico para desbloquear tu perfil local.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="1, 2, 3, 4"
                  value={passcode}
                  onChange={(e) => {
                    setPasscode(e.target.value);
                    setError(false);
                  }}
                  className="pl-10 text-center tracking-[0.5em] font-bold"
                />
              </div>
              {error && (
                <p className="text-destructive text-sm font-medium">Código incorrecto. Inténtalo de nuevo.</p>
              )}
              <Button type="submit" className="w-full h-12 text-lg font-semibold bg-primary hover:bg-primary/90 transition-all">
                Entrar
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-xs text-muted-foreground mt-8">
          Todos tus datos se almacenan de forma privada en tu dispositivo.<br />
          Arquitectura Híbrida: OpenAI + Gemini.
        </p>
      </div>
    </div>
  );
}
