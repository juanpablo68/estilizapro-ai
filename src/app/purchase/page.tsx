
"use client"

import { useState, useEffect } from 'react';
import { useLocalStorage, UserProfile, INITIAL_USER_PROFILE } from '@/lib/storage-hooks';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft, ShoppingCart, CheckCircle, Instagram, ExternalLink, Sparkles, ShieldCheck } from "lucide-react";
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function PurchasePage() {
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
        <Link href="/dashboard">
          <Button variant="ghost" size="icon"><ArrowLeft /></Button>
        </Link>
        <h1 className="text-2xl font-headline font-bold">Solicitar Cápsulas</h1>
      </header>

      <section className="space-y-6">
        <Card className="bg-gradient-to-r from-primary to-pink-400 text-white border-none shadow-xl overflow-hidden relative">
          <Sparkles className="absolute -top-4 -right-4 w-24 h-24 opacity-20" />
          <CardHeader>
            <CardTitle className="text-4xl font-headline font-bold">$3.00 USD</CardTitle>
            <CardDescription className="text-white/90 font-medium">Obtén una Cápsula AI adicional personalizada.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-3"><CheckCircle className="w-5 h-5 text-white" /> Análisis de colorimetría profundo</li>
              <li className="flex items-center gap-3"><CheckCircle className="w-5 h-5 text-white" /> 6 outfits completos con prendas de tu armario</li>
              <li className="flex items-center gap-3"><CheckCircle className="w-5 h-5 text-white" /> Sugerencias de estilo de alta fidelidad</li>
              <li className="flex items-center gap-3"><ShieldCheck className="w-5 h-5 text-white" /> Almacenamiento seguro en el Movil</li>
            </ul>
            <Button 
              onClick={() => router.push('/payment')} 
              className="w-full bg-white text-primary hover:bg-white/90 h-14 font-black text-lg shadow-xl rounded-2xl transition-all hover:scale-[1.02]"
            >
              <ShoppingCart className="mr-2 w-5 h-5" /> Comprar Ahora
            </Button>
          </CardContent>
        </Card>

        <div className="text-center space-y-4 py-8">
            <div className="inline-block p-4 bg-muted/50 rounded-full mb-2">
                <Sparkles className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-xl font-headline font-bold">Asesoramiento Personalizado</h2>
            <p className="text-sm text-muted-foreground px-8">¿Buscas una transformación total de imagen? Contacta directamente con la experta.</p>
            
            <div className="flex flex-col gap-3 max-w-[280px] mx-auto pt-4">
                <Link href="https://instagram.com/by.pilarcatalan" target="_blank" className="w-full">
                    <Button variant="outline" className="w-full gap-2 border-primary text-primary hover:bg-primary/5 rounded-xl">
                        <Instagram className="w-4 h-4" /> @by.pilarcatalan
                    </Button>
                </Link>
                <Link href="https://instagram.com/by.pilarcatalan" target="_blank" className="w-full">
                    <Button variant="ghost" className="w-full gap-2 text-xs">
                        Visitar Perfil <ExternalLink className="w-3 h-3" />
                    </Button>
                </Link>
            </div>
        </div>
      </section>
      
      <footer className="bg-muted/30 p-6 rounded-2xl text-center">
        <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">EstilizaPro AI - Pilar Cifuentes Catalán</p>
      </footer>
    </div>
  );
}
