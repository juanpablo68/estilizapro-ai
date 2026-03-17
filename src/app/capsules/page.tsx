"use client"

import { useState } from 'react';
import { useLocalStorage, UserProfile, INITIAL_USER_PROFILE, WardrobeItem as LocalWardrobeItem } from '@/lib/storage-hooks';
import { receiveAICapsuleRecommendations, Capsule, CapsuleItem } from '@/ai/flows/ai-capsule-recommendations';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, ArrowLeft, Sparkles, MapPin, CloudSun, ShoppingBag, FolderHeart, Layers, ExternalLink } from "lucide-react";
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
    // 1. Prioritize AI-generated image for Shop items
    if (item.source === 'shop' && item.imageDataUri) {
      return item.imageDataUri;
    }

    // 2. Prioritize Wardrobe photo if source is wardrobe
    if (item.source === 'wardrobe' && item.wardrobeItemId) {
      const localItem = wardrobe.find(wi => wi.id === item.wardrobeItemId);
      if (localItem && localItem.imageDataUri) return localItem.imageDataUri;
    }
    
    // 3. Fallback to placeholder based on category
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
          <Button variant="ghost" size="icon"><ArrowLeft /></Button>
        </Link>
        <h1 className="text-2xl font-headline font-bold">Cápsulas Personalizadas</h1>
      </header>

      <Card className="border-none shadow-lg bg-white/80 backdrop-blur-sm">
        <CardContent className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-xs uppercase tracking-wider font-bold opacity-70">
                <MapPin className="w-3 h-3" /> Plan / Evento
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
                <CloudSun className="w-3 h-3" /> Clima Actual
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
            {loading ? <><Loader2 className="mr-2 animate-spin" /> Creando Look con IA...</> : <><Sparkles className="mr-2" /> Generar Cápsula con Fotos Reales</>}
          </Button>
          {loading && (
            <p className="text-[10px] text-center text-muted-foreground animate-pulse">
              Esto puede tardar hasta 40 segundos mientras la IA genera las imágenes de las prendas...
            </p>
          )}
        </CardContent>
      </Card>

      <div className="space-y-16">
        {capsules.length === 0 && !loading && (
          <div className="text-center py-20 text-muted-foreground opacity-30">
            <Layers className="w-16 h-16 mx-auto mb-4" />
            <p className="text-sm font-medium">Define tu evento y la IA vestirá tu avatar</p>
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
            
            <div className="bg-white/60 backdrop-blur-md border border-white rounded-2xl p-5 shadow-sm">
                <p className="text-sm leading-relaxed text-muted-foreground italic">"{capsule.description}"</p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {capsule.items.map((item, itemIdx) => (
                <Card key={itemIdx} className="overflow-hidden border-none shadow-sm relative group hover:shadow-xl transition-all duration-300 rounded-2xl bg-white">
                  <div className="absolute top-2 left-2 z-10">
                    {item.source === 'wardrobe' ? (
                      <div className="bg-primary/90 backdrop-blur-md text-[8px] font-bold text-white px-2 py-1 rounded-full flex items-center gap-1 shadow-lg">
                        <FolderHeart className="w-2.5 h-2.5" /> TU ARMARIO
                      </div>
                    ) : (
                      <div className="bg-secondary/90 backdrop-blur-md text-[8px] font-bold text-white px-2 py-1 rounded-full flex items-center gap-1 shadow-lg">
                        <ShoppingBag className="w-2.5 h-2.5" /> IA GENERADA
                      </div>
                    )}
                  </div>
                  <div className="relative aspect-[3/4] bg-muted overflow-hidden">
                    <Image 
                      src={getItemImage(item)} 
                      alt={item.name} 
                      fill 
                      className="object-cover transition-transform group-hover:scale-105 duration-500" 
                      unoptimized={item.source === 'shop'} // Generated images are already data uris
                    />
                  </div>
                  <CardContent className="p-3">
                    <p className="font-bold text-xs line-clamp-1 h-4">{item.name}</p>
                    <p className="text-[8px] text-muted-foreground uppercase font-bold mt-1">{item.type}</p>
                    {item.shopLink && (
                      <Link href={item.shopLink} target="_blank" className="text-[9px] text-primary hover:underline mt-2 flex items-center gap-1 font-bold">
                        BUSCAR EN TIENDA <ExternalLink className="w-2.5 h-2.5" />
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
