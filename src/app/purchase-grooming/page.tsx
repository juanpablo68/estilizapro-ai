
"use client"

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLocalStorage, UserProfile, INITIAL_USER_PROFILE } from '@/lib/storage-hooks';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft, Sparkles, ShieldCheck, Scissors, Palette, ShoppingCart } from "lucide-react";

export default function PurchaseGroomingPage() {
  const [profile] = useLocalStorage<UserProfile>('estiliza_profile', INITIAL_USER_PROFILE);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="flex-1 max-w-2xl mx-auto w-full p-6 space-y-8 pb-20">
      <header className="flex items-center gap-4 pt-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft />
        </Button>
        <h1 className="text-2xl font-headline font-bold text-primary">Solicitud Estética</h1>
      </header>

      <Card className="bg-gradient-to-br from-primary to-primary/70 text-white border-none shadow-2xl rounded-[2.5rem] overflow-hidden">
        <CardHeader className="pb-8">
          <div className="flex justify-between items-center mb-6">
             <div className="p-3 bg-white/20 rounded-2xl">
                <Sparkles className="w-8 h-8" />
             </div>
             <ShieldCheck className="w-6 h-6 opacity-50" />
          </div>
          <CardTitle className="text-3xl font-headline">Peinado y Maquillaje AI</CardTitle>
          <CardDescription className="text-white/80 text-lg">
            Asesoría visagista profesional por solicitud.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="space-y-4">
             <div className="flex items-center gap-4 bg-white/10 p-4 rounded-2xl">
                <Palette className="w-6 h-6" />
                <div className="text-sm">
                  <p className="font-bold">Análisis Facial</p>
                  <p className="opacity-70 text-xs">Recomendaciones basadas en tu colorimetría real.</p>
                </div>
             </div>
             <div className="flex items-center gap-4 bg-white/10 p-4 rounded-2xl">
                <Scissors className="w-6 h-6" />
                <div className="text-sm">
                  <p className="font-bold">Visagismo AI</p>
                  <p className="opacity-70 text-xs">Diseño de peinado ideal para tu tipo de rostro.</p>
                </div>
             </div>
          </div>

          <div className="flex justify-between items-center border-t border-white/10 pt-6">
            <span className="text-sm font-medium">Costo por solicitud</span>
            <span className="text-4xl font-black">$0.50 USD</span>
          </div>

          <Button 
            className="w-full h-16 bg-white text-primary font-black text-xl rounded-2xl shadow-xl hover:scale-[1.02] transition-transform"
            onClick={() => router.push('/payment-grooming')}
          >
            <ShoppingCart className="mr-2 w-6 h-6" /> Comprar Solicitud
          </Button>
          <p className="text-[10px] text-center opacity-60 italic">* El acceso es válido para una sola sesión de asesoría completa.</p>
        </CardContent>
      </Card>
    </div>
  );
}
