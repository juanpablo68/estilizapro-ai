
"use client"

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLocalStorage, UserProfile, INITIAL_USER_PROFILE, WardrobeItem as LocalWardrobeItem } from '@/lib/storage-hooks';
import { receiveAICapsuleRecommendations, Capsule, CapsuleItem } from '@/ai/flows/ai-capsule-recommendations';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, ArrowLeft, Sparkles, Trash2, Shirt, Heart, PlusCircle, Sparkle } from "lucide-react";
import Link from 'next/link';
import Image from 'next/image';
import { useToast } from "@/hooks/use-toast";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { cn } from '@/lib/utils';
import { Progress } from "@/components/ui/progress";

interface EnrichedCapsule extends Capsule {
  isFavorite?: boolean;
}

export default function CapsulesPage() {
  const router = useRouter();
  const [profile] = useLocalStorage<UserProfile>('estiliza_profile', INITIAL_USER_PROFILE);
  const [wardrobe] = useLocalStorage<LocalWardrobeItem[]>('estiliza_wardrobe', []);
  const [savedCapsules, setSavedCapsules] = useLocalStorage<EnrichedCapsule[]>('estiliza_saved_capsules', []);
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
  const currentCount = savedCapsules.length;
  const isLimitReached = currentCount >= MAX_OUTFITS;
  const progressValue = Math.min((currentCount / MAX_OUTFITS) * 100, 100);

  useEffect(() => {
    setMounted(true);
    if (savedCapsules.length > 0 && !selectedCapsuleId) {
      setSelectedCapsuleId(savedCapsules[0].id);
    }
  }, [savedCapsules, selectedCapsuleId]);

  const generateCapsules = async () => {
    const openaiKey = localStorage.getItem('openai_api_key');
    const unsplashKey = localStorage.getItem('unsplash_access_key');
    
    const finalOpenAIKey = openaiKey && openaiKey.trim() !== '' ? openaiKey : undefined;
    const finalUnsplashKey = unsplashKey && unsplashKey.trim() !== '' ? unsplashKey : undefined;

    setLoading(true);
    try {
      const gender = profile.biometricData?.genero || 'Femenino';
      const result = await receiveAICapsuleRecommendations({
        stylePreferences: profile.stylePreferences,
        colorimetryAnalysis: profile.colorimetryAnalysis || 'Cálida',
        figureAnalysis: profile.figureAnalysis || 'Reloj de Arena',
        gender: gender,
        knowledgeBase: profile.knowledgeBase,
        eventType: params.eventType,
        weatherConditions: params.weather,
        wardrobeItems: wardrobe.map(i => ({ id: i.id, name: i.name || 'Prenda', type: i.type })),
        openaiApiKey: finalOpenAIKey,
        unsplashAccessKey: finalUnsplashKey,
      });
      
      if (result.capsules && result.capsules.length > 0) {
        setSavedCapsules(prev => {
           const newList = [...result.capsules.map(c => ({...c, isFavorite: false})), ...prev].slice(0, MAX_OUTFITS);
           return newList;
        });
        setSelectedCapsuleId(result.capsules[0].id);
        toast({ title: "¡Outfit Generado!", description: `Se ha creado 1 look para ${gender} con accesorios.` });
      }
    } catch (err: any) {
      console.error(err);
      toast({ variant: "destructive", title: "Error del Sistema", description: err.message || "Error al conectar con la IA." });
    } finally {
      setLoading(false);
    }
  };

  const handleMainAction = () => {
    if (isLimitReached) {
      router.push('/purchase');
    } else {
      generateCapsules();
    }
  };

  const handleGroomingAction = () => {
    const credits = Number(profile.groomingCredits) || 0;
    if (credits > 0) {
      router.push('/grooming');
    } else {
      router.push('/purchase-grooming');
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

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSavedCapsules(prev => prev.map(c => 
      c.id === id ? { ...c, isFavorite: !c.isFavorite } : c
    ));
  };

  const getItemImage = (item: CapsuleItem) => {
    if (!item) return null;
    if (item.source === 'wardrobe' && item.wardrobeItemId) {
      const found = wardrobe.find(w => w.id === item.wardrobeItemId);
      if (found?.imageDataUri) return found.imageDataUri;
    }
    if (item.source === 'external' && item.imageUrl) return item.imageUrl;
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
        <div className="flex-1">
          <h1 className="text-2xl font-headline font-bold">Capsulizador AI</h1>
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black">Estilo {profile.biometricData?.genero || 'Personalizado'}</p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleGroomingAction}
          className="rounded-xl border-primary text-primary font-bold gap-2 bg-white hover:bg-primary/5 shadow-sm"
        >
          <Sparkle className="w-4 h-4" /> {Number(profile.groomingCredits) > 0 ? `Peinado y Maquillaje (${profile.groomingCredits})` : 'Peinado y Maquillaje ($0.50)'}
        </Button>
      </header>

      <Card className="border-none shadow-xl bg-white rounded-[2rem]">
        <CardContent className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-[10px] uppercase font-black text-primary">Ocasión</Label>
              <Select value={params.eventType} onValueChange={v => setParams({...params, eventType: v})}>
                <SelectTrigger className="rounded-2xl h-12"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Oficina">Oficina</SelectItem>
                  <SelectItem value="Casual">Casual</SelectItem>
                  <SelectItem value="Cena">Cena Social</SelectItem>
                  <SelectItem value="Gala">Evento de Gala</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] uppercase font-black text-primary">Clima</Label>
              <Select value={params.weather} onValueChange={v => setParams({...params, weather: v})}>
                <SelectTrigger className="rounded-2xl h-12"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Caluroso">Caluroso</SelectItem>
                  <SelectItem value="Templado">Templado</SelectItem>
                  <SelectItem value="Frio">Frío</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
              <span className="text-muted-foreground">Capacidad de Outfits</span>
              <span className={cn(isLimitReached ? "text-destructive" : "text-primary")}>
                {currentCount} / {MAX_OUTFITS}
              </span>
            </div>
            <Progress value={progressValue} className="h-2 rounded-full" />
            {isLimitReached && (
              <p className="text-[10px] text-destructive font-bold text-center animate-pulse leading-relaxed px-4">
                Has llegado a la cantidad máxima de Outfits que permite tu cápsula actual.
              </p>
            )}
          </div>

          <Button 
            onClick={handleMainAction} 
            disabled={loading} 
            className={cn(
              "w-full h-14 font-bold rounded-2xl shadow-lg transition-all",
              isLimitReached ? "bg-secondary hover:bg-secondary/90" : "bg-primary"
            )}
          >
            {loading ? (
              <><Loader2 className="mr-2 animate-spin" /> Procesando...</>
            ) : isLimitReached ? (
              <><PlusCircle className="mr-2" /> Cápsula Adicional (+6 Looks)</>
            ) : (
              <><Sparkles className="mr-2" /> Crear Outfits</>
            )}
          </Button>
        </CardContent>
      </Card>

      {savedCapsules.length > 0 && (
        <ScrollArea className="w-full whitespace-nowrap pb-4">
          <div className="flex space-x-4">
            {savedCapsules.map((capsule) => (
              <div 
                key={capsule.id} 
                onClick={() => setSelectedCapsuleId(capsule.id)}
                className={cn(
                  "relative w-48 shrink-0 cursor-pointer transition-all",
                  selectedCapsuleId === capsule.id ? "scale-105" : "opacity-60"
                )}
              >
                <Card className={cn(
                  "overflow-hidden border-2 rounded-2xl",
                  selectedCapsuleId === capsule.id ? "border-primary shadow-lg" : "border-transparent"
                )}>
                  <div className="relative aspect-[4/3] bg-muted">
                    <div className="grid grid-cols-2 h-full">
                      {capsule.items.slice(0, 2).map((item, i) => (
                        <div key={i} className="relative h-full flex items-center justify-center bg-white border-r last:border-0">
                          {getItemImage(item) ? (
                            <Image src={getItemImage(item)!} alt="Thumb" fill className="object-cover" unoptimized />
                          ) : <Shirt className="w-4 h-4 text-muted-foreground/20" />}
                        </div>
                      ))}
                    </div>
                    <Button 
                      variant="ghost" size="icon" 
                      className={cn("absolute top-1 left-1 h-7 w-7 rounded-full bg-white/80", capsule.isFavorite && "text-primary")}
                      onClick={(e) => toggleFavorite(capsule.id, e)}
                    >
                      <Heart className={cn("w-4 h-4", capsule.isFavorite && "fill-current")} />
                    </Button>
                  </div>
                </Card>
              </div>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      )}

      {currentCapsule && (
        <div className="space-y-6 animate-in fade-in duration-500">
          <div className="bg-white p-6 rounded-3xl shadow-md flex items-start justify-between border border-primary/10">
            <div className="space-y-1">
              <h2 className="text-xl font-bold">{currentCapsule.name}</h2>
              <p className="text-xs text-muted-foreground">{currentCapsule.description}</p>
            </div>
            <Button variant="ghost" onClick={(e) => deleteCapsule(currentCapsule.id, e)} className="text-destructive"><Trash2 className="w-4 h-4" /></Button>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {currentCapsule.items.map((item, idx) => {
              const img = getItemImage(item);
              return (
                <Card key={idx} className="overflow-hidden border-none shadow-md rounded-2xl bg-white">
                  <div className="relative aspect-[3/4] flex items-center justify-center bg-muted/10">
                    {img ? (
                      <Image src={img} alt={item.name} fill className="object-cover" unoptimized />
                    ) : <Shirt className="w-8 h-8 text-muted-foreground/30" />}
                  </div>
                  <CardContent className="p-3">
                    <p className="font-bold text-[10px] truncate uppercase">{item.name}</p>
                    <p className="text-[8px] text-muted-foreground uppercase mt-1">{item.type}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
