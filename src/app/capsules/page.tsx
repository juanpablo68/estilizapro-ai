"use client"

import { useState, useEffect } from 'react';
import { useLocalStorage, UserProfile, INITIAL_USER_PROFILE, WardrobeItem as LocalWardrobeItem } from '@/lib/storage-hooks';
import { receiveAICapsuleRecommendations, Capsule, CapsuleItem } from '@/ai/flows/ai-capsule-recommendations';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, ArrowLeft, Sparkles, LayoutGrid, Trash2, Shirt, Info, FolderHeart } from "lucide-react";
import Link from 'next/link';
import Image from 'next/image';
import { useToast } from "@/hooks/use-toast";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { cn } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function CapsulesPage() {
  const [profile] = useLocalStorage<UserProfile>('estiliza_profile', INITIAL_USER_PROFILE);
  const [wardrobe] = useLocalStorage<LocalWardrobeItem[]>('estiliza_wardrobe', []);
  const [savedCapsules, setSavedCapsules] = useLocalStorage<Capsule[]>('estiliza_saved_capsules', []);
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedCapsuleId, setSelectedCapsuleId] = useState<string | null>(null);
  const { toast } = useToast();
  
  const [params, setParams] = useState({
    eventType: 'Casual',
    weather: 'Templado'
  });

  const purchasedCount = Number(profile.purchasedCapsules) || 0;
  const MAX_OUTFITS = 10 + (purchasedCount * 6);
  const isLimitReached = savedCapsules.length >= MAX_OUTFITS;

  useEffect(() => {
    setMounted(true);
    if (savedCapsules.length > 0 && !selectedCapsuleId) {
      setSelectedCapsuleId(savedCapsules[0].id);
    }
  }, [savedCapsules, selectedCapsuleId]);

  const generateCapsules = async () => {
    if (isLimitReached) {
      toast({ variant: "destructive", title: "Límite alcanzado", description: "Adquiere más espacio para generar nuevos outfits." });
      return;
    }

    const openaiKey = localStorage.getItem('openai_api_key');
    const unsplashKey = localStorage.getItem('unsplash_access_key');
    
    if (!openaiKey) {
      toast({ variant: "destructive", title: "API Key Faltante", description: "Configura tu OpenAI Key en Ajustes." });
      return;
    }

    setLoading(true);
    try {
      const result = await receiveAICapsuleRecommendations({
        stylePreferences: profile.stylePreferences,
        colorimetryAnalysis: profile.colorimetryAnalysis || 'No definida',
        figureAnalysis: profile.figureAnalysis || 'No definida',
        knowledgeBase: profile.knowledgeBase,
        eventType: params.eventType,
        weatherConditions: params.weather,
        wardrobeItems: wardrobe.map(i => ({ id: i.id, name: i.name, type: i.type })),
        openaiApiKey: openaiKey,
        unsplashAccessKey: unsplashKey || undefined,
      });
      
      if (result.capsules && result.capsules.length > 0) {
        setSavedCapsules(prev => {
           const newList = [...result.capsules, ...prev].slice(0, MAX_OUTFITS);
           return newList;
        });
        setSelectedCapsuleId(result.capsules[0].id);
        toast({ title: "¡Outfits Generados!", description: "Se han creado propuestas diferentes priorizando tu armario." });
      } else {
        toast({ variant: "destructive", title: "Error", description: "La IA no pudo generar outfits. Revisa tu armario." });
      }
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error del Sistema", description: err.message });
    } finally {
      setLoading(false);
    }
  };

  const deleteCapsule = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const filtered = savedCapsules.filter(c => c.id !== id);
    setSavedCapsules(filtered);
    if (selectedCapsuleId === id) {
      setSelectedCapsuleId(filtered.length > 0 ? filtered[0].id : null);
    }
  };

  const getItemImage = (item: CapsuleItem) => {
    // 1. SI ES DEL ARMARIO: Buscar EXCLUSIVAMENTE en el almacenamiento local
    if (item.source === 'wardrobe') {
      const found = wardrobe.find(w => w.id === item.wardrobeItemId);
      if (found?.imageDataUri) return found.imageDataUri;
      
      // Fallback por nombre si el ID no coincide exactamente (por si la IA lo alteró)
      const foundByName = wardrobe.find(w => w.name.toLowerCase().includes(item.name.toLowerCase()));
      if (foundByName?.imageDataUri) return foundByName.imageDataUri;
      
      return null; // No usar imágenes aleatorias para armario
    }
    
    // 2. SI ES SUGERENCIA IA: Usar URL de Unsplash si existe
    if (item.source === 'external' && item.imageUrl) {
      return item.imageUrl;
    }
    
    return null;
  };

  const currentCapsule = savedCapsules.find(c => c.id === selectedCapsuleId);

  if (!mounted) return null;

  return (
    <div className="flex-1 max-w-5xl mx-auto w-full p-6 space-y-6 pb-20">
      <header className="flex items-center gap-4 pt-4">
        <Link href="/dashboard">
          <Button variant="ghost" size="icon" className="rounded-full"><ArrowLeft /></Button>
        </Link>
        <div>
          <h1 className="text-2xl font-headline font-bold">Capsulizador AI</h1>
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Armario Real • Máx 2 Sugerencias</p>
        </div>
      </header>

      {isLimitReached && (
        <Alert variant="destructive" className="bg-orange-50 border-orange-200">
          <Info className="h-4 w-4 text-orange-600" />
          <AlertTitle className="text-orange-800 font-bold">Límite alcanzado</AlertTitle>
          <AlertDescription className="text-xs text-orange-700">
            Máximo de {MAX_OUTFITS} outfits. Adquiere espacio adicional para continuar.
            <Link href="/purchase" className="block mt-2 font-bold underline">Comprar Espacio →</Link>
          </AlertDescription>
        </Alert>
      )}

      <Card className="border-none shadow-xl bg-white rounded-[2rem]">
        <CardContent className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-[10px] uppercase font-black text-primary">Ocasión</Label>
              <Select value={params.eventType} onValueChange={v => setParams({...params, eventType: v})}>
                <SelectTrigger className="rounded-2xl h-12 bg-white"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Oficina">Oficina / Trabajo</SelectItem>
                  <SelectItem value="Casual">Casual / Diario</SelectItem>
                  <SelectItem value="Cena">Cena / Social</SelectItem>
                  <SelectItem value="Gala">Evento de Gala</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] uppercase font-black text-primary">Clima</Label>
              <Select value={params.weather} onValueChange={v => setParams({...params, weather: v})}>
                <SelectTrigger className="rounded-2xl h-12 bg-white"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Caluroso">Caluroso</SelectItem>
                  <SelectItem value="Templado">Templado</SelectItem>
                  <SelectItem value="Frio">Frío</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button 
            onClick={generateCapsules} 
            disabled={loading || isLimitReached} 
            className="w-full h-14 bg-primary text-white font-bold rounded-2xl shadow-lg"
          >
            {loading ? <><Loader2 className="mr-2 animate-spin" /> Analizando Armario...</> : <><Sparkles className="mr-2" /> Generar 2 Outfits</>}
          </Button>
        </CardContent>
      </Card>

      {savedCapsules.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
            <LayoutGrid className="w-4 h-4" /> MIS OUTFITs ({savedCapsules.length}/{MAX_OUTFITS})
          </h3>
          <ScrollArea className="w-full whitespace-nowrap pb-4">
            <div className="flex space-x-4">
              {savedCapsules.map((capsule) => (
                <div 
                  key={capsule.id} 
                  onClick={() => setSelectedCapsuleId(capsule.id)}
                  className={cn(
                    "relative group w-52 shrink-0 cursor-pointer transition-all",
                    selectedCapsuleId === capsule.id ? "scale-100 opacity-100" : "scale-95 opacity-60"
                  )}
                >
                  <Card className={cn(
                    "overflow-hidden border-2 rounded-2xl bg-white",
                    selectedCapsuleId === capsule.id ? "border-primary shadow-lg" : "border-transparent"
                  )}>
                    <div className="relative aspect-[4/3] bg-muted">
                       <div className="grid grid-cols-2 h-full">
                          {capsule.items.slice(0, 2).map((item, idx) => {
                             const img = getItemImage(item);
                             return (
                               <div key={`${capsule.id}-thumb-${idx}`} className="relative h-full flex items-center justify-center bg-white border-r last:border-r-0">
                                  {img ? (
                                    <Image src={img} alt="Outfit Thumbnail" fill className="object-cover" unoptimized />
                                  ) : (
                                    <Shirt className="w-6 h-6 text-muted-foreground/30" />
                                  )}
                               </div>
                             );
                          })}
                       </div>
                       <Button 
                          variant="destructive" size="icon" 
                          className="absolute top-1 right-1 h-7 w-7 rounded-full shadow-lg z-10"
                          onClick={(e) => deleteCapsule(capsule.id, e)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                        <div className="absolute bottom-0 inset-x-0 bg-black/60 p-2 text-white">
                          <p className="text-[10px] font-bold truncate">{capsule.name}</p>
                        </div>
                    </div>
                  </Card>
                </div>
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>
      )}

      {currentCapsule ? (
        <div className="space-y-6 animate-in fade-in duration-500">
          <div className="bg-white p-6 rounded-3xl shadow-md border border-primary/10">
            <h2 className="text-2xl font-headline font-bold">{currentCapsule.name}</h2>
            <p className="text-xs text-muted-foreground mt-1">{currentCapsule.description}</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {currentCapsule.items.map((item, idx) => {
              const img = getItemImage(item);
              return (
                <Card key={`${currentCapsule.id}-item-${idx}`} className="overflow-hidden border-none shadow-md rounded-2xl bg-white group">
                  <div className="relative aspect-[3/4] flex items-center justify-center bg-muted/20">
                    {img ? (
                      <Image src={img} alt={`Prenda: ${item.name}`} fill className="object-cover" unoptimized />
                    ) : (
                      <Shirt className="w-12 h-12 text-muted-foreground/20" />
                    )}
                    <div className="absolute top-2 left-2">
                      {item.source === 'wardrobe' ? (
                        <div className="bg-green-500 text-white text-[8px] font-black px-2 py-1 rounded-full flex items-center gap-1 shadow-md">
                          <FolderHeart className="w-2.5 h-2.5" /> MI ARMARIO
                        </div>
                      ) : (
                        <div className="bg-pink-500 text-white text-[8px] font-black px-2 py-1 rounded-full flex items-center gap-1 shadow-md">
                          <Sparkles className="w-2.5 h-2.5" /> SUGERENCIA IA
                        </div>
                      )}
                    </div>
                  </div>
                  <CardContent className="p-3">
                    <p className="font-bold text-[11px] truncate uppercase">{item.name}</p>
                    <p className="text-[9px] text-primary/70 font-black uppercase mt-1">{item.type}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="py-20 text-center opacity-20">
           <Shirt className="w-16 h-16 mx-auto mb-4" />
           <p className="font-bold uppercase tracking-widest text-sm">Selecciona o genera un outfit</p>
        </div>
      )}
    </div>
  );
}
