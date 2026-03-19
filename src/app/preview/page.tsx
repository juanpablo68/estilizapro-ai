"use client"

import { useState, useEffect } from 'react';
import { useLocalStorage, UserProfile, INITIAL_USER_PROFILE, WardrobeItem } from '@/lib/storage-hooks';
import { previewOutfitOnAvatar } from '@/ai/flows/preview-outfit-on-avatar';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Loader2, Sparkles, User, Shirt, CheckCircle, Info } from "lucide-react";
import Link from 'next/link';
import Image from 'next/image';
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function PreviewPage() {
  const [profile] = useLocalStorage<UserProfile>('estiliza_profile', INITIAL_USER_PROFILE);
  const [wardrobe] = useLocalStorage<WardrobeItem[]>('estiliza_wardrobe', []);
  const [mounted, setMounted] = useState(false);
  const [selectedItem, setSelectedItem] = useState<WardrobeItem | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handlePreview = async () => {
    if (!profile.avatarDataUri || !selectedItem) return;
    
    const openaiKey = localStorage.getItem('openai_api_key') || undefined;
    if (!openaiKey) {
      toast({
        variant: "destructive",
        title: "API Key Faltante",
        description: "Configura tu OpenAI Key en Ajustes para activar el pipeline maestro.",
      });
      return;
    }

    setPreviewing(true);
    setResultImage(null);
    try {
      const result = await previewOutfitOnAvatar({
        avatarDataUri: profile.avatarDataUri,
        clothingItemDataUri: selectedItem.imageDataUri,
        openaiApiKey: openaiKey
      });
      setResultImage(result.previewImageDataUri);
      toast({
        title: "¡Montaje Completado!",
        description: "El artista de OpenAI ha vestido tu avatar Pixar.",
      });
    } catch (err: any) {
      console.error(err);
      toast({
        variant: "destructive",
        title: "Error de Pipeline",
        description: err.message || "No se pudo generar la vista previa visual.",
      });
    } finally {
      setPreviewing(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="flex-1 max-w-5xl mx-auto w-full p-6 space-y-6 pb-24">
      <header className="flex items-center gap-4 pt-4">
        <Link href="/dashboard">
          <Button variant="ghost" size="icon" className="rounded-full"><ArrowLeft /></Button>
        </Link>
        <div>
          <h1 className="text-2xl font-headline font-bold">Probador Virtual</h1>
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black">Pipeline GPT-4o + DALL-E 3</p>
        </div>
      </header>

      {!profile.avatarDataUri && (
        <Alert variant="destructive" className="bg-destructive/5">
          <Info className="h-4 w-4" />
          <AlertTitle>Falta Avatar</AlertTitle>
          <AlertDescription>
            Debes crear tu avatar Pixar primero para poder usar el probador. 
            <Link href="/avatar-creation" className="ml-2 underline font-bold">Crear Avatar →</Link>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid lg:grid-cols-12 gap-8 items-start">
        {/* Selección de Prenda */}
        <div className="lg:col-span-4 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold flex items-center gap-2"><Shirt className="w-5 h-5 text-primary" /> Mi Armario</h2>
            <span className="text-[10px] font-bold bg-muted px-2 py-1 rounded-full">{wardrobe.length} Items</span>
          </div>
          
          <div className="grid grid-cols-2 gap-3 max-h-[500px] overflow-y-auto p-1 pr-2 scrollbar-thin">
            {wardrobe.map(item => (
              <Card 
                key={item.id} 
                onClick={() => setSelectedItem(item)}
                className={`relative aspect-[3/4] rounded-2xl overflow-hidden cursor-pointer border-4 transition-all hover:scale-105 ${
                  selectedItem?.id === item.id ? 'border-primary shadow-lg ring-2 ring-primary/20' : 'border-transparent'
                }`}
              >
                <Image src={item.imageDataUri} alt={item.name} fill className="object-cover" />
                {selectedItem?.id === item.id && (
                  <div className="absolute top-2 right-2 bg-primary text-white rounded-full p-1 shadow-md">
                    <CheckCircle className="w-4 h-4" />
                  </div>
                )}
                <div className="absolute bottom-0 inset-x-0 bg-black/40 p-2">
                  <p className="text-[8px] text-white font-bold truncate uppercase">{item.name}</p>
                </div>
              </Card>
            ))}
          </div>

          <Button 
            className="w-full h-14 bg-primary text-white font-bold shadow-xl rounded-2xl text-lg hover:scale-[1.02] transition-transform" 
            disabled={!selectedItem || !profile.avatarDataUri || previewing}
            onClick={handlePreview}
          >
            {previewing ? (
              <><Loader2 className="mr-3 animate-spin" /> Montaje en Proceso...</>
            ) : (
              <><Sparkles className="mr-3" /> Probar con IA</>
            )}
          </Button>
        </div>

        {/* Visualización del Resultado */}
        <div className="lg:col-span-8 space-y-6">
          <h2 className="text-lg font-bold flex items-center gap-2"><User className="w-5 h-5 text-primary" /> Visualización Pixar</h2>
          <Card className="aspect-[4/5] w-full max-w-[500px] mx-auto overflow-hidden relative shadow-2xl border-none ring-[12px] ring-primary/5 rounded-[3rem] bg-white">
            {resultImage ? (
              <div className="animate-in fade-in zoom-in duration-700 h-full w-full">
                <Image src={resultImage} alt="Probador Virtual Resultado" fill className="object-cover" unoptimized />
                <div className="absolute bottom-6 right-6">
                  <div className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg border border-primary/20 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-primary">Generado por OpenAI Artist</span>
                  </div>
                </div>
              </div>
            ) : previewing ? (
              <div className="w-full h-full flex flex-col items-center justify-center bg-muted/20 space-y-4">
                <div className="relative">
                  <Loader2 className="w-16 h-16 text-primary animate-spin" />
                  <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-primary" />
                </div>
                <div className="text-center space-y-1">
                  <p className="text-sm font-bold text-primary">GPT-4o Analizando Prenda...</p>
                  <p className="text-[10px] text-muted-foreground px-12">Montando texturas y colores sobre tu avatar 3D</p>
                </div>
              </div>
            ) : profile.avatarDataUri ? (
              <div className="relative w-full h-full group">
                <Image src={profile.avatarDataUri} alt="Avatar Base" fill className="object-cover opacity-60 grayscale-[30%] blur-[2px]" unoptimized />
                <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center bg-black/5 backdrop-blur-[1px]">
                  <div className="bg-white/90 p-6 rounded-[2rem] shadow-2xl border border-primary/10 max-w-[280px]">
                    <Shirt className="w-12 h-12 text-primary mx-auto mb-4 animate-bounce" />
                    <h3 className="text-sm font-bold mb-2">Listo para el montaje</h3>
                    <p className="text-[10px] text-muted-foreground leading-relaxed">Selecciona una prenda de tu armario de la izquierda para ver cómo te queda en estilo Pixar.</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-muted p-12 text-center">
                <User className="w-16 h-16 text-muted-foreground/30 mb-4" />
                <p className="text-sm font-medium text-muted-foreground">Crea tu avatar personalizado primero para activar esta función.</p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
