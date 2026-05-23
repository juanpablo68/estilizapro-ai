
"use client"

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Lock, Sparkles, Info, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const [name, setName] = useState('');
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (passcode === '1,2,3,4') {
      // 1. Establecer el usuario activo para el particionamiento de datos
      const activeUserName = name.trim().toLowerCase();
      localStorage.setItem('estiliza_active_user', activeUserName);
      localStorage.setItem('estiliza_auth', 'true');

      // 2. Verificar si este usuario específico ya completó el onboarding
      const scopedKey = `estiliza_profile_${activeUserName.replace(/\s+/g, '_')}`;
      const profileStr = localStorage.getItem(scopedKey);
      
      if (profileStr) {
        try {
          const profile = JSON.parse(profileStr);
          if (profile.onboardingComplete) {
            router.push('/dashboard');
            return;
          }
        } catch (e) {
          console.error("Error parsing profile", e);
        }
      }
      
      // Si no existe o no está completo, al onboarding
      router.push('/onboarding');
    } else {
      setError(true);
    }
  };

  if (!mounted) return null;

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 bg-background relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-secondary/5 rounded-full blur-3xl" />

      <div className="w-full max-w-md space-y-8 text-center relative z-10">
        <div className="space-y-4">
          <div className="inline-flex flex-col items-center">
            <div className="p-4 bg-white shadow-2xl rounded-[2rem] mb-4 ring-8 ring-primary/5">
              <Sparkles className="w-12 h-12 text-primary" />
            </div>
            <Badge variant="secondary" className="bg-primary/10 text-primary font-black px-4 py-1 rounded-full uppercase tracking-widest text-[10px]">
              Beta Test v1.6
            </Badge>
          </div>
          <div className="space-y-1">
            <h1 className="text-4xl font-headline font-bold text-foreground">EstilizaPro AI</h1>
            <p className="text-muted-foreground text-sm">Asesoría de Imagen de Pilar Catalán</p>
          </div>
        </div>

        <Card className="border-none shadow-2xl bg-white/80 backdrop-blur-md rounded-[2.5rem] overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl font-headline">Acceso al Sistema</CardTitle>
            <CardDescription className="text-xs px-4">
              Identifícate para cargar tu perfil personal de estilo.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 p-8">
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2 text-left">
                <Label htmlFor="user-name" className="text-[10px] uppercase font-black tracking-widest ml-1 text-primary">Tu Nombre</Label>
                <div className="relative">
                  <User className="absolute left-4 top-3.5 w-5 h-5 text-muted-foreground/50" />
                  <Input
                    id="user-name"
                    type="text"
                    placeholder="Ej: Pilar Catalán"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="pl-12 h-14 rounded-2xl border-muted bg-muted/5 focus:ring-primary/20 font-bold"
                  />
                </div>
              </div>

              <div className="space-y-2 text-left">
                <Label htmlFor="passcode" className="text-[10px] uppercase font-black tracking-widest ml-1 text-primary">Código de Acceso</Label>
                <div className="relative">
                  <Lock className="absolute left-4 top-3.5 w-5 h-5 text-muted-foreground/50" />
                  <Input
                    id="passcode"
                    type="text"
                    placeholder="1 2 3 4"
                    value={passcode}
                    onChange={(e) => {
                      setPasscode(e.target.value);
                      setError(false);
                    }}
                    required
                    className="pl-12 h-14 text-center tracking-[0.8em] font-black text-xl rounded-2xl border-muted bg-muted/5 focus:ring-primary/20"
                  />
                </div>
              </div>

              {error && (
                <p className="text-destructive text-[10px] font-black uppercase tracking-wider animate-bounce">Código incorrecto</p>
              )}
              
              <Button type="submit" className="w-full h-16 text-lg font-bold bg-primary shadow-xl shadow-primary/20 hover:scale-[1.02] transition-transform rounded-2xl">
                Entrar al Sistema
              </Button>
            </form>

            <div className="pt-2 flex items-start gap-2 text-left bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100">
              <Info className="w-4 h-4 text-indigo-600 mt-0.5 shrink-0" />
              <p className="text-[10px] text-indigo-700 leading-relaxed">
                Cada usuario tiene su propio <strong>armario y avatar</strong> independiente en este dispositivo.
              </p>
            </div>
          </CardContent>
        </Card>

        <footer className="space-y-4 pt-4">
          <p className="text-[9px] text-muted-foreground/60 uppercase tracking-[0.2em] font-bold">
            Pilar Catalán • EstilizaPro AI v1.6
          </p>
        </footer>
      </div>
    </div>
  );
}
