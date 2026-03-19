"use client"

import { useState } from 'react';
import { useLocalStorage, UserProfile, INITIAL_USER_PROFILE, WardrobeItem as LocalWardrobeItem } from '@/lib/storage-hooks';
import { receiveAICapsuleRecommendations, Capsule, CapsuleItem } from '@/ai/flows/ai-capsule-recommendations';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, ArrowLeft, Sparkles, MapPin, CloudSun, ShoppingBag, FolderHeart, Layers, ExternalLink, CheckCircle2 } from "lucide-react";
import { PlaceHolderImages } from '@/lib/placeholder-images';
import Link from 'next/link';
import Image from 'next/image';
import { useToast } from "@/hooks/use-toast";

export default function CapsulesPage() {
  const [profile] = useLocalStorage<UserProfile>('estiliza_profile', INITIAL_USER_PROFILE);
  const [wardrobe] = useLocalStorage<LocalWardrobeItem[]>('estiliza_wardrobe', []);
  const [loading, setLoading] = useState(false);
  const [capsules, setCapsules] = useState<Capsule[]>([]);
  const { toast } = useToast();
  
  const [params, setParams] = useState({
    eventType: 'Casual',
    weather: 'Soleado y Templado'
  });

  const generateCapsules = async () => {
    const openaiKey = localStorage.getItem('openai_api_key') || undefined;
    if (!openaiKey) {
      toast({
        variant: "destructive",
        title: "API Key Faltante",
        description: "Configura tu OpenAI Key en Ajustes para generar cápsulas.",
      });
      return;
    }

    setLoading(true);
    try {
      const result = await receiveAICapsuleRecommendations({
        stylePreferences: profile.stylePreferences,
        colorimetryAnalysis: profile.colorimetryAnalysis || 'No definida',
        figureAnalysis: profile.figureAnalysis || 'No definida',
        eventType: params.eventType,
        weatherConditions: params.weather,
        wardrobeItems: wardrobe.map(i => ({ 
          id: i.id, 
          name: i.name, 
          type: i.type 
        })),
        openaiApiKey: openaiKey
      });
      
      setCapsules(result.capsules);
      if (result.capsules.length > 0) {
        toast({
          title: "¡Cápsulas Generadas!",
          description: "GPT-4o ha seleccionado las mejores prendas para ti.",
        });
      }
    } catch (err: any) {
      console.error(err);
      toast({
        variant: "destructive",
        title: "Error de IA",
        description: err.message || "No se pudo conectar con el cerebro de OpenAI.",
      });
    } finally {
      setLoading(false);
    }
  };

  const getItemImage = (item: CapsuleItem) => {
    // 1. Prioridad: Si es del armario y tenemos el ID, buscar la imagen real
    if (item.source === 'wardrobe' && item.wardrobeItemId) {
      const localItem = wardrobe.find(wi => wi.id === item.wardrobeItemId);
      if (localItem && localItem.imageDataUri) return localItem.imageDataUri;
    }
    
    // 2. Fallback: Mapeo de tipos a imágenes de placeholder de alta calidad
    const normalizedType = item.type.toLowerCase();
    const typeMapping: Record<string, string> = {
      'top': 'fashion-top',
      'bottom': 'fashion-bottom',
      'dress': 'fashion-dress',
      'outerwear': 'fashion-outerwear',
      'shoe': 'fashion-shoe',
      'accessory': 'fashion-accessory'
    };

    const targetId = typeMapping[normalizedType] || 'fashion-top';
    const placeholder = PlaceHolderImages.find(p => p.id === targetId);
    return placeholder?.imageUrl || PlaceHolderImages[0].imageUrl;
  };

  return (
    <div className="flex-1 max-w-4xl mx-auto w-full p-6 space-y-6 pb-20">
      <header className="flex items-center gap-4 pt-4">
        <Link href="/dashboard">
          <Button variant="ghost" size="icon" className="rounded-full"><ArrowLeft /></Button>
        </Link>
        <div>
          <h1 className="text-2xl font-headline font-bold">Cápsulas Estilizadas</h1>
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Cerebro GPT-4o Activo</p>
        </div>
      </header>

      <Card className="border-none shadow-xl bg-white/80 backdrop-blur-sm overflow-hidden rounded-[2rem]">
        <CardContent className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-[10px] uppercase tracking-wider font-black text-primary">
                <MapPin className="w-3 h-3" /> Plan del día
              </Label>
              <Select value={params.eventType} onValueChange={v => setParams({...params, eventType: v})}>
                <SelectTrigger className="rounded-2xl border-muted bg-white h-12 shadow-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Trabajo">Oficina / Trabajo</SelectItem>
                  <SelectItem value="Casual">Día Casual</SelectItem>
                  <SelectItem value="Cena Elegante">Cena / Evento Noche</SelectItem>
                  <SelectItem value="Viaje">Viaje / Vacaciones</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-[10px] uppercase tracking-wider font-black text-primary">
                <CloudSun className="w-3 h-3" /> Condición Climática
              </Label>
              <Select value={params.weather} onValueChange={v => setParams({...params, weather: v})}>
                <SelectTrigger className="rounded-2xl border-muted bg-white h-12 shadow-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Caluroso">Caluroso / Verano</SelectItem>
                  <SelectItem value="Soleado y Templado">Templado / Entretiempo</SelectItem>
                  <SelectItem value="Frío / Invierno">Frío / Invierno</SelectItem>
                  <SelectItem value="Lluvioso">Día Lluvioso</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button 
            onClick={generateCapsules} 
            disabled={loading} 
            className="w-full bg-primary h-14 text-white font-bold rounded-2xl shadow-lg transition-all active:scale-[0.98] text-lg"
          >
            {loading ? <><Loader2 className="mr-3 animate-spin" /> GPT-4o está razonando...</> : <><Sparkles className="mr-3" /> Crear Mi Cápsula Ideal</>}
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-16 mt-8">
        {capsules.length === 0 && !loading && (
          <div className="text-center py-20 bg-white/30 rounded-[3rem] border-2 border-dashed border-muted">
            <Layers className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-20" />
            <p className="text-sm font-bold text-muted-foreground/60">Define tu escenario para que la IA escanee tu armario</p>
          </div>
        )}

        {capsules.map((capsule, idx) => (
          <div key={idx} className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-12 w-2 bg-primary rounded-full" />
                <div>
                  <h2 className="text-3xl font-headline font-bold text-foreground">{capsule.name}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] bg-secondary text-white px-3 py-1 rounded-full font-bold uppercase tracking-widest">{capsule.occasion}</span>
                    <span className="text-[10px] text-muted-foreground font-bold flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-green-500" /> RAZONAMIENTO GPT-4o</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-[2rem] p-8 shadow-sm border-l-8 border-primary/20">
                <p className="text-sm leading-relaxed text-muted-foreground italic font-medium">"{capsule.description}"</p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {capsule.items.map((item, itemIdx) => (
                <Card key={itemIdx} className="overflow-hidden border-none shadow-md relative group hover:shadow-2xl transition-all duration-500 rounded-[2rem] bg-white ring-1 ring-black/5">
                  <div className="absolute top-4 left-4 z-10">
                    {item.source === 'wardrobe' ? (
                      <div className="bg-green-500/90 backdrop-blur-md text-[8px] font-black text-white px-3 py-1.5 rounded-full flex items-center gap-1 shadow-lg ring-2 ring-white/20">
                        <FolderHeart className="w-2.5 h-2.5" /> TU PRENDA REAL
                      </div>
                    ) : (
                      <div className="bg-primary/90 backdrop-blur-md text-[8px] font-black text-white px-3 py-1.5 rounded-full flex items-center gap-1 shadow-lg ring-2 ring-white/20">
                        <ShoppingBag className="w-2.5 h-2.5" /> SUGERENCIA IA
                      </div>
                    )}
                  </div>
                  <div className="relative aspect-[3/4] bg-muted overflow-hidden">
                    <Image 
                      src={getItemImage(item)} 
                      alt={item.name} 
                      fill 
                      className="object-cover transition-transform group-hover:scale-110 duration-700" 
                      unoptimized={true}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                        <p className="text-[9px] text-white font-bold leading-tight">{item.styleHint}</p>
                    </div>
                  </div>
                  <CardContent className="p-4 bg-white">
                    <p className="font-bold text-xs line-clamp-1">{item.name}</p>
                    <p className="text-[8px] text-primary uppercase font-black mt-1 tracking-tighter">{item.type}</p>
                    {item.shopLink && (
                      <Link href={item.shopLink} target="_blank" className="text-[9px] text-secondary hover:underline mt-3 flex items-center gap-1 font-black">
                        COMPRAR LOOK <ExternalLink className="w-2.5 h-2.5" />
                      </Link>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
