
"use client"

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLocalStorage, UserProfile, INITIAL_USER_PROFILE } from '@/lib/storage-hooks';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, CreditCard, Loader2, CheckCircle2, ShieldCheck, Wallet, Scissors } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

export default function PaymentGroomingPage() {
  const [profile, setProfile] = useLocalStorage<UserProfile>('estiliza_profile', INITIAL_USER_PROFILE);
  const [mounted, setMounted] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [method, setMethod] = useState('visa');
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
      
      const currentCredits = Number(profile.groomingCredits) || 0;
      setProfile({
        ...profile,
        groomingCredits: currentCredits + 1
      });

      toast({
        title: "¡Pago Confirmado!",
        description: "Tienes una nueva solicitud de Tips de Peinado y Maquillaje disponible.",
      });

      setTimeout(() => {
        router.push('/grooming');
      }, 2000);
    }, 2000);
  };

  if (!mounted) return null;

  return (
    <div className="flex-1 max-w-2xl mx-auto w-full p-6 space-y-8 pb-20">
      <header className="flex items-center gap-4 pt-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()} disabled={processing}>
          <ArrowLeft />
        </Button>
        <h1 className="text-2xl font-headline font-bold text-primary">Checkout Estético</h1>
      </header>

      {completed ? (
        <div className="flex flex-col items-center justify-center space-y-6 py-20 animate-in zoom-in duration-500">
          <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-16 h-16 text-primary" />
          </div>
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold">¡Solicitud Lista!</h2>
            <p className="text-muted-foreground">Iniciando tus Tips de Peinado y Maquillaje...</p>
          </div>
        </div>
      ) : (
        <Card className="border-none shadow-2xl rounded-[2.5rem] overflow-hidden bg-white">
          <CardHeader className="bg-primary/5 pb-8">
            <div className="flex justify-between items-center mb-4">
               <CardTitle className="text-xl">Resumen</CardTitle>
               <ShieldCheck className="w-6 h-6 text-primary" />
            </div>
            <div className="flex justify-between items-end border-b border-primary/10 pb-4">
              <div className="space-y-1">
                <span className="block text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Scissors className="w-4 h-4" /> Tips de Peinado y Maquillaje (x1)
                </span>
                <span className="block text-[10px] text-primary font-bold uppercase tracking-widest">Pago por solicitud</span>
              </div>
              <span className="text-2xl font-black text-primary">$0.50 USD</span>
            </div>
          </CardHeader>
          <CardContent className="p-8 space-y-8">
            <div className="space-y-4">
              <Label className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Método de Pago</Label>
              <RadioGroup value={method} onValueChange={setMethod} className="grid gap-4">
                <div className="flex items-center space-x-4 border p-4 rounded-2xl cursor-pointer hover:bg-muted/30 transition-colors">
                  <RadioGroupItem value="visa" id="visa" />
                  <Label htmlFor="visa" className="flex-1 flex items-center gap-3 cursor-pointer">
                    <CreditCard className="w-5 h-5 text-blue-600" />
                    <span className="font-bold">Tarjeta</span>
                  </Label>
                </div>
                <div className="flex items-center space-x-4 border p-4 rounded-2xl cursor-pointer hover:bg-muted/30 transition-colors">
                  <RadioGroupItem value="paypal" id="paypal" />
                  <Label htmlFor="paypal" className="flex-1 flex items-center gap-3 cursor-pointer">
                    <Wallet className="w-5 h-5 text-orange-500" />
                    <span className="font-bold">PayPal</span>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <Button 
              className="w-full h-16 bg-primary text-white font-black text-xl rounded-2xl shadow-xl hover:scale-[1.02] transition-transform"
              onClick={handlePayment}
              disabled={processing}
            >
              {processing ? (
                <><Loader2 className="mr-3 animate-spin" /> Procesando...</>
              ) : (
                "Pagar $0.50"
              )}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
