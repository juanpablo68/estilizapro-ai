
"use client"

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLocalStorage, UserProfile, INITIAL_USER_PROFILE } from '@/lib/storage-hooks';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft, Sparkles, Loader2, ShieldCheck, CheckCircle2, Scissors, Palette } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function PurchaseGroomingPage() {
  const [profile, setProfile] = useLocalStorage<UserProfile>('estiliza_profile', INITIAL_USER_PROFILE);
  const [mounted, setMounted] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [completed, setCompleted] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handlePayment = () => {
    setProcessing(true);
    setTimeout(() => {
      setProcessing(false);
      setCompleted(true);
      
      setProfile({
        ...profile,
        purchasedGrooming: true
      });

      toast({
        title: "¡Acceso Activado!",
        description: "Módulo de Peinado y Maquillaje activado de forma vitalicia.",
      });

      setTimeout(() => {
        router.push('/grooming');
      }, 2000);
    }, 2500);
  };

  if (!mounted) return null;

  return (
    <div className="flex-1 max-w-2xl mx-auto w-full p-6 space-y-8 pb-20">
      <header className="flex items-center gap-4 pt-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()} disabled={processing}>
          <ArrowLeft />
        </Button>
        <h1 className="text-2xl font-headline font-bold">Módulo Estético</h1>
      </header>

      {completed ? (
        <div className="flex flex-col items-center justify-center space-y-6 py-20 animate-in zoom-in duration-500">
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-16 h-16 text-green-600" />
          </div>
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold">¡Servicio Activado!</h2>
            <p className="text-muted-foreground">Redirigiendo a tu nuevo asistente visagista...</p>
          </div>
        </div>
      ) : (
        <Card className="bg-gradient-to-br from-indigo-600 to-indigo-400 text-white border-none shadow-2xl rounded-[2.5rem] overflow-hidden">
          <CardHeader className="pb-8">
            <div className="flex justify-between items-center mb-6">
               <div className="p-3 bg-white/20 rounded-2xl">
                  <Sparkles className="w-8 h-8" />
               </div>
               <ShieldCheck className="w-6 h-6 opacity-50" />
            </div>
            <CardTitle className="text-3xl font-headline">Peinado y Maquillaje AI</CardTitle>
            <CardDescription className="text-white/80 text-lg">
              Asesoría visagista profesional integrada con tu perfil biométrico.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            <div className="space-y-4">
               <div className="flex items-center gap-4 bg-white/10 p-4 rounded-2xl">
                  <Palette className="w-6 h-6" />
                  <div className="text-sm">
                    <p className="font-bold">Colorimetría Integrada</p>
                    <p className="opacity-70 text-xs">Sugerencias basadas en tu temperatura y tono de piel.</p>
                  </div>
               </div>
               <div className="flex items-center gap-4 bg-white/10 p-4 rounded-2xl">
                  <Scissors className="w-6 h-6" />
                  <div className="text-sm">
                    <p className="font-bold">Visagismo AI</p>
                    <p className="opacity-70 text-xs">Análisis de rasgos faciales para el peinado ideal.</p>
                  </div>
               </div>
            </div>

            <div className="flex justify-between items-center border-t border-white/10 pt-6">
              <span className="text-sm font-medium">Pago único vitalicio</span>
              <span className="text-4xl font-black">$5.00 USD</span>
            </div>

            <Button 
              className="w-full h-16 bg-white text-indigo-600 font-black text-xl rounded-2xl shadow-xl hover:scale-[1.02] transition-transform"
              onClick={handlePayment}
              disabled={processing}
            >
              {processing ? (
                <><Loader2 className="mr-3 animate-spin" /> Activando...</>
              ) : (
                "Comprar Acceso Premium"
              )}
            </Button>
            <p className="text-[10px] text-center opacity-60 italic">* Simulación de pago para prototipo académico.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
