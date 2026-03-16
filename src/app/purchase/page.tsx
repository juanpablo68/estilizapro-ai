"use client"

import { useLocalStorage, UserProfile, INITIAL_USER_PROFILE } from '@/lib/storage-hooks';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft, CreditCard, ShoppingCart, CheckCircle, Instagram, ExternalLink, Sparkles } from "lucide-react";
import Link from 'next/link';

export default function PurchasePage() {
  const [profile, setProfile] = useLocalStorage<UserProfile>('estiliza_profile', INITIAL_USER_PROFILE);

  const buyCapsule = () => {
    // Simulated purchase
    setProfile({ ...profile, purchasedCapsulesCount: profile.purchasedCapsulesCount + 1 });
    alert('¡Compra exitosa! Ahora tienes acceso a 1 cápsula adicional.');
  };

  return (
    <div className="flex-1 max-w-2xl mx-auto w-full p-6 space-y-8 pb-20">
      <header className="flex items-center gap-4 pt-4">
        <Link href="/dashboard">
          <Button variant="ghost" size="icon"><ArrowLeft /></Button>
        </Link>
        <h1 className="text-2xl font-headline font-bold">Solicitar Cápsulas</h1>
      </header>

      <section className="space-y-6">
        <Card className="bg-gradient-to-r from-primary to-pink-400 text-white border-none shadow-xl">
          <CardHeader>
            <CardTitle className="text-3xl font-headline font-bold">$3.00 USD</CardTitle>
            <CardDescription className="text-white/80">Obtén una Cápsula AI adicional personalizada.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4" /> Análisis de colorimetría profundo</li>
              <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4" /> 4 outfits completos con prendas de tu armario</li>
              <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4" /> Sugerencias de tiendas aliadas</li>
              <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4" /> Almacenamiento ilimitado en el móvil</li>
            </ul>
            <Button onClick={buyCapsule} className="w-full bg-white text-primary hover:bg-white/90 h-14 font-bold text-lg shadow-lg">
              <ShoppingCart className="mr-2" /> Comprar Ahora
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
                    <Button variant="outline" className="w-full gap-2 border-primary text-primary hover:bg-primary/5">
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
