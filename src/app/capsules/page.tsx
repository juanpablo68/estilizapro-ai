"use client"

import { useState, useEffect } from 'react';
import { useLocalStorage, UserProfile, INITIAL_USER_PROFILE, WardrobeItem as LocalWardrobeItem } from '@/lib/storage-hooks';
import { receiveAICapsuleRecommendations, Capsule, CapsuleItem } from '@/ai/flows/ai-capsule-recommendations';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, ArrowLeft, Sparkles, MapPin, CloudSun, FolderHeart, Trash2, LayoutGrid, Info, ShoppingCart } from "lucide-react";
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useToast } from "@/hooks/use-toast";
import { PlaceHolderImages } from '@/lib/placeholder-images';
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
  const router = useRouter();
  
  const [params, setParams] = useState({
    eventType: 'Casual',
    weather: 'Templado'
  });

  // Lógica de límites dinámica: 10 base + 6 por cada compra
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
      toast({ variant: "destructive", title: "Límite alcanzado" });
      return;
    }

    const openaiKey = localStorage.getItem('openai_api_key');
    const unsplashKey = localStorage.getItem('unsplash_access_key');
    
    if (!openaiKey) {
      toast({ variant: "destructive", title: "Configura tu OpenAI Key en Ajustes" });
      return;
    }

    if (wardrobe.length < 3) {
      toast({ 
        variant: "destructive", 
        title: "Armario Insuficiente", 
        description: "Sube al menos 3 prendas para que la IA pueda crear combinaciones." 
      });
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
      
      if (result.capsules.length > 0) {
        // Garantizamos IDs únicos incluyendo el índice y un random robusto para evitar colisiones de keys
        const uniqueCapsules = result.capsules.map((c, index) => ({
          ...c,
          id: `capsule-${Date.now()}-${index}-${Math.random().toString(36).substring(2, 9)}`
        }));
        
        const newCapsules = [...uniqueCapsules, ...savedCapsules];
        setSavedCapsules(newCapsules);
        setSelectedCapsuleId(uniqueCapsules[0].id);
        toast({ title: "¡Outfits Generados!", description: `Se han creado nuevas propuestas híbridas.` });
      }
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error en Generación", description: err.message });
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
    toast({ title: "Outfit eliminado" });
  };

  const currentCapsule = savedCapsules.find(c => c.id === selectedCapsuleId);

  const getItemImage = (item: CapsuleItem) => {
    if (item.source === 'wardrobe' && item.wardrobeItemId) {
      const local = wardrobe.find(wi => wi.id === item.wardrobeItemId);
      if (local?.imageDataUri) return local.imageDataUri;
    }
    return item.imageUrl || PlaceHolderImages[0].imageUrl;
  };

  if (!mounted) return null;

  return (
    <div className="flex-1 max-w-5xl mx-auto w-full p-6 space-y-6 pb-20">
      <header className="flex items-center gap-4 pt-4">
        <Link href="/dashboard">
          <Button variant="ghost" size="icon" className="rounded-full"><ArrowLeft /></Button>
        </Link>
        <div>
          <h1 className="text-2xl font-headline font-bold">Capsulizador AI</h1>
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Búsqueda Inteligente • Armario Híbrido</p>
        </div>
      </header>

      {isLimitReached && (
        <Alert variant="destructive" className="bg-orange-50 border-orange-200 text-orange-800 animate-in fade-in slide-in-from-top-4 duration-500">
          <Info className="h-4 w-4 text-orange-600" />
          <AlertTitle className="font-bold">Límite de Outfits Alcanzado</AlertTitle>
          <AlertDescription className="text-xs">
            Llegaste a tu límite de {MAX_OUTFITS} outfits. Solicita una Cápsula Adicional para continuar siendo la envidia de tus amigos y familiares por el buen vestir.
            <Link href="/purchase" className="block mt-2 font-black underline">Adquirir Cápsula Adicional (+6 espacios) →</Link>
          </AlertDescription>
        </Alert>
      )}

      <Card className="border-none shadow-xl bg-white/80 backdrop-blur-sm rounded-[2rem]">
        <CardContent className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-[10px] uppercase font-black text-primary"><MapPin className="w-3 h-3" /> Evento</Label>
              <Select value={params.eventType} onValueChange={v => setParams({...params, eventType: v})}>
                <SelectTrigger className="rounded-2xl h-12"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Trabajo">Oficina / Negocios</SelectItem>
                  <SelectItem value="Casual">Día Casual</SelectItem>
                  <SelectItem value="Cena">Cena Romántica / Social</SelectItem>
                  <SelectItem value="Gala">Evento de Gala</SelectItem>
                  <SelectItem value="Viaje">Aeropuerto / Viaje</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-[10px] uppercase font-black text-primary"><CloudSun className="w-3 h-3" /> Clima</Label>
              <Select value={params.weather} onValueChange={v => setParams({...params, weather: v})}>
                <SelectTrigger className="rounded-2xl h-12"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Caluroso">Caluroso</SelectItem>
                  <SelectItem value="Templado">Templado</SelectItem>
                  <SelectItem value="Frio">Frío</SelectItem>
                  <SelectItem value="Lluvioso">Lluvioso</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button 
            onClick={isLimitReached ? () => router.push('/purchase') : generateCapsules} 
            disabled={loading} 
            className={cn(
              "w-full h-14 font-bold rounded-2xl shadow-lg text-lg transition-all hover:scale-[1.01]",
              isLimitReached ? "bg-orange-600 hover:bg-orange-700 text-white" : "bg-primary text-white"
            )}
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <Loader2 className="mr-3 animate-spin" /> GPT-4o analizando tu armario...
              </span>
            ) : isLimitReached ? (
              <span className="flex items-center justify-center">
                <ShoppingCart className="mr-3" /> Adquiere Capsula Adicional para generar
              </span>
            ) : (
              <span className="flex items-center justify-center">
                <Sparkles className="mr-3" /> Generar 2 Outfit
              </span>
            )}
          </Button>
        </CardContent>
      </Card>

      {savedCapsules.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
             <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2 text-primary">
                <LayoutGrid className="w-4 h-4" /> MIS OUTFITs
             </h3>
             <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-muted text-muted-foreground">
                {savedCapsules.length} / {MAX_OUTFITS} Guardados
             </span>
          </div>
          <ScrollArea className="w-full whitespace-nowrap pb-4">
            <div className="flex space-x-4">
              {savedCapsules.map((capsule) => (
                <div 
                  key={capsule.id} 
                  onClick={() => setSelectedCapsuleId(capsule.id)}
                  className={cn(
                    "relative group w-52 shrink-0 cursor-pointer transition-all duration-300",
                    selectedCapsuleId === capsule.id ? "scale-100" : "scale-95 opacity-70"
                  )}
                >
                  <Card className={cn(
                    "overflow-hidden border-2 rounded-2xl",
                    selectedCapsuleId === capsule.id ? "border-primary shadow-lg ring-4 ring-primary/5" : "border-transparent shadow-sm"
                  )}>
                    <div className="relative aspect-[4/3] bg-muted">
                       <div className="grid grid-cols-2 h-full">
                          {capsule.items.slice(0, 2).map((item, idx) => (
                             <div key={`${capsule.id}-preview-${idx}`} className="relative w-full h-full">
                                <Image src={getItemImage(item)} alt="" fill className="object-cover" unoptimized />
                             </div>
                          ))}
                       </div>
                       <Button 
                          variant="destructive" 
                          size="icon" 
                          className="absolute top-1 right-1 h-7 w-7 rounded-full opacity-100 shadow-xl z-20 hover:scale-110 transition-transform"
                          onClick={(e) => deleteCapsule(capsule.id, e)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                        <div className="absolute bottom-0 inset-x-0 bg-black/60 p-2 text-white">
                          <p className="text-[9px] font-black truncate uppercase">{capsule.name}</p>
                          <p className="text-[7px] flex items-center gap-1 opacity-90 truncate font-bold">
                            <MapPin className="w-2.5 h-2.5" /> {capsule.eventType} • <CloudSun className="w-2.5 h-2.5" /> {capsule.weatherConditions}
                          </p>
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
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center gap-4 bg-white p-6 rounded-3xl shadow-md border border-primary/10">
            <div className="h-12 w-2 bg-primary rounded-full" />
            <div className="flex-1">
              <h2 className="text-2xl font-headline font-bold">{currentCapsule.name}</h2>
              <p className="text-xs text-muted-foreground">{currentCapsule.description}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {currentCapsule.items.map((item, itemIdx) => (
              <Card key={`${currentCapsule.id}-detail-${itemIdx}`} className="overflow-hidden border-none shadow-md relative group rounded-2xl bg-white transition-transform hover:scale-[1.02]">
                <div className="absolute top-2 left-2 z-10">
                  {item.source === 'wardrobe' ? (
                    <div className="text-[8px] font-black text-white px-2 py-1 rounded-full flex items-center shadow-md bg-green-500 gap-1"><FolderHeart className="w-2.5 h-2.5" /> Mi Armario</div>
                  ) : (
                    <div className="text-[8px] font-black text-white px-2 py-1 rounded-full flex items-center shadow-md bg-pink-500 gap-1"><Sparkles className="w-2.5 h-2.5" /> Sugerencia IA</div>
                  )}
                </div>
                <div className="relative aspect-[3/4]">
                  <Image src={getItemImage(item)} alt={item.name} fill className="object-cover" unoptimized />
                </div>
                <CardContent className="p-3">
                  <p className="font-bold text-[11px] truncate uppercase">{item.name}</p>
                  <p className="text-[9px] text-muted-foreground mt-0.5 font-black uppercase tracking-tighter text-primary/70">{item.type}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ) : !loading && (
        <div className="flex flex-col items-center justify-center py-20 text-center opacity-30 grayscale">
           <Sparkles className="w-16 h-16 mb-4 text-primary" />
           <p className="text-sm font-black uppercase tracking-widest">Genera tus primeros outfits maestros</p>
        </div>
      )}
    </div>
  );
}
