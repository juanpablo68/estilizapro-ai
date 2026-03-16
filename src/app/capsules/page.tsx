"use client"

import { useState } from 'react';
import { useLocalStorage, UserProfile, INITIAL_USER_PROFILE, WardrobeItem as LocalWardrobeItem } from '@/lib/storage-hooks';
import { receiveAICapsuleRecommendations, Capsule, CapsuleItem } from '@/ai/flows/ai-capsule-recommendations';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, ArrowLeft, Sparkles, MapPin, CloudSun, ShoppingBag, FolderHeart, Layers } from "lucide-react";
import { PlaceHolderImages } from '@/lib/placeholder-images';
import Link from 'next/link';
import Image from 'next/image';

export default function CapsulesPage() {
  const [profile] = useLocalStorage<UserProfile>('estiliza_profile', INITIAL_USER_PROFILE);
  const [wardrobe] = useLocalStorage<LocalWardrobeItem[]>('estiliza_wardrobe', []);
  const [loading, setLoading] = useState(false);
  const [capsules, setCapsules] = useState<Capsule[]>([]);
  
  const [params, setParams] = useState({
    eventType: 'Casual',
    weather: 'Soleado y Templado'
  });

  const generateCapsules = async () => {
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
          type: i.type, 
          imageDataUri: i.imageDataUri 
        }))
      });
      setCapsules(result.capsules);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getItemImage = (item: CapsuleItem) => {
    // 1. If it's from wardrobe, find the actual local image URI using the ID returned by AI
    if (item.source === 'wardrobe' && item.wardrobeItemId) {
      const localItem = wardrobe.find(wi => wi.id === item.wardrobeItemId);
      if (localItem) return localItem.imageDataUri;
    }
    
    // 2. Fallback to placeholder based on category for 'shop' items or missing wardrobe images
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
    const placeholder = PlaceHolderImages.find(p => p.id === targetId) || PlaceHolderImages[0];
    
    return placeholder.imageUrl;
  };

  const getItemHint = (item: CapsuleItem) => {
    const normalizedType = item.type.toLowerCase();
    const typeMapping: Record<string, string> = {
      'top': 'fashion top clothing',
      'bottom': 'fashion pants trousers',
      'dress': 'fashion dress clothing',
      'outerwear': 'fashion jacket coat',
      'shoe': 'fashion shoes footwear',
      'accessory': 'fashion accessory style'
    };
    return typeMapping[normalizedType] || 'fashion clothing';
  };

  return (
    <div className="flex-1 max-w-3xl mx-auto w-full p-6 space-y-6 pb-20">
      <header className="flex items-center gap-4 pt-4">
        <Link href="/dashboard">
          <Button variant="ghost" size="icon"><ArrowLeft /></Button>
        </Link>
        <h1 className="text-2xl font-headline font-bold">Cápsulas AI</h1>
      </header>

      <Card className="border-none shadow-lg bg-white/80 backdrop-blur-sm">
        <CardContent className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-xs uppercase tracking-wider font-bold opacity-70">
                <MapPin className="w-3 h-3" /> Evento
              </Label>
              <Select value={params.eventType} onValueChange={v => setParams({...params, eventType: v})}>
                <SelectTrigger className="rounded-xl border-muted bg-white/50"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Trabajo">Oficina / Trabajo</SelectItem>
                  <SelectItem value="Casual">Día Casual</SelectItem>
                  <SelectItem value="Cena Elegante">Cena / Evento Noche</SelectItem>
                  <SelectItem value="Viaje">Viaje / Vacaciones</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-xs uppercase tracking-wider font-bold opacity-70">
                <CloudSun className="w-3 h-3" /> Clima
              </Label>
              <Select value={params.weather} onValueChange={v => setParams({...params, weather: v})}>
                <SelectTrigger className="rounded-xl border-muted bg-white/50"><SelectValue /></SelectTrigger>
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
            className="w-full bg-secondary h-12 text-white font-bold rounded-xl shadow-md transition-all active:scale-[0.98]"
          >
            {loading ? <><Loader2 className="mr-2 animate-spin" /> Creando Looks...</> : <><Sparkles className="mr-2" /> Generar Cápsulas</>}
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-12">
        {capsules.length === 0 && !loading && (
          <div className="text-center py-20 text-muted-foreground opacity-40">
            <Layers className="w-16 h-16 mx-auto mb-4" />
            <p className="text-sm font-medium">Configura el evento y pulsa Generar</p>
          </div>
        )}

        {capsules.map((capsule, idx) => (
          <div key={idx} className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="flex items-center gap-3">
              <div className="h-10 w-1.5 bg-primary rounded-full" />
              <div>
                <h2 className="text-2xl font-headline font-bold text-foreground">{capsule.name}</h2>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest">{capsule.occasion}</p>
              </div>
            </div>
            
            <div className="bg-white/40 backdrop-blur-sm border rounded-2xl p-5 shadow-sm">
                <p className="text-sm leading-relaxed text-muted-foreground italic">"{capsule.description}"</p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {capsule.items.map((item, itemIdx) => (
                <Card key={itemIdx} className="overflow-hidden border-none shadow-sm relative group hover:shadow-xl transition-all duration-300 rounded-2xl">
                  <div className="absolute top-3 left-3 z-10">
                    {item.source === 'wardrobe' ? (
                      <div className="bg-primary/95 backdrop-blur-md text-[9px] font-bold text-white px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-lg border border-white/20">
                        <FolderHeart className="w-3 h-3" /> TU ARMARIO
                      </div>
                    ) : (
                      <div className="bg-secondary/95 backdrop-blur-md text-[9px] font-bold text-white px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-lg border border-white/20">
                        <ShoppingBag className="w-3 h-3" /> SUGERENCIA
                      </div>
                    )}
                  </div>
                  <div className="relative aspect-[3/4] bg-muted overflow-hidden">
                    <Image 
                      src={getItemImage(item)} 
                      alt={item.name} 
                      fill 
                      className="object-cover transition-transform group-hover:scale-110 duration-700" 
                      data-ai-hint={getItemHint(item)}
                    />
                  </div>
                  <CardContent className="p-3 bg-white">
                    <p className="font-bold text-xs line-clamp-1">{item.name}</p>
                    <p className="text-[9px] text-muted-foreground uppercase font-semibold">{item.type}</p>
                    {item.shopLink && (
                      <Link href={item.shopLink} target="_blank" className="text-[9px] text-secondary hover:underline mt-2 flex items-center gap-1 font-bold">
                        VER OPCIÓN TIENDA <ArrowLeft className="w-2 h-2 rotate-180" />
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
