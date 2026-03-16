
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
        wardrobeItems: wardrobe.map(i => ({ name: i.name, type: i.type, imageDataUri: i.imageDataUri }))
      });
      setCapsules(result.capsules);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getItemImage = (item: CapsuleItem) => {
    // 1. Prioritize real wardrobe data if available
    if (item.source === 'wardrobe' && item.imageDataUri?.startsWith('data:')) {
      return item.imageDataUri;
    }
    
    // 2. If it's already a valid URL
    if (item.imageDataUri?.startsWith('http')) {
      return item.imageDataUri;
    }

    // 3. Fallback to placeholder based on category
    const normalizedType = item.type.toLowerCase();
    
    // Mapping various potential type strings to our placeholder IDs
    const typeMapping: Record<string, string> = {
      'top': 'fashion-top',
      'superior': 'fashion-top',
      'camisa': 'fashion-top',
      'bottom': 'fashion-bottom',
      'inferior': 'fashion-bottom',
      'pantalón': 'fashion-bottom',
      'falda': 'fashion-bottom',
      'dress': 'fashion-dress',
      'vestido': 'fashion-dress',
      'outerwear': 'fashion-outerwear',
      'exterior': 'fashion-outerwear',
      'chaqueta': 'fashion-outerwear',
      'shoe': 'fashion-shoe',
      'zapatos': 'fashion-shoe',
      'calzado': 'fashion-shoe',
      'accessory': 'fashion-accessory',
      'accesorio': 'fashion-accessory'
    };

    const targetId = typeMapping[normalizedType] || 'fashion-top';
    const placeholder = PlaceHolderImages.find(p => p.id === targetId) || PlaceHolderImages[0];
    
    return placeholder.imageUrl;
  };

  const getItemHint = (item: CapsuleItem) => {
    const normalizedType = item.type.toLowerCase();
    const typeMapping: Record<string, string> = {
      'top': 'fashion top',
      'bottom': 'fashion pants',
      'dress': 'fashion dress',
      'outerwear': 'fashion jacket',
      'shoe': 'fashion shoes',
      'accessory': 'fashion accessory'
    };
    return typeMapping[normalizedType] || 'fashion item';
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
              <Label className="flex items-center gap-2"><MapPin className="w-3 h-3" /> Evento</Label>
              <Select value={params.eventType} onValueChange={v => setParams({...params, eventType: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Trabajo">Oficina</SelectItem>
                  <SelectItem value="Casual">Casual</SelectItem>
                  <SelectItem value="Cena Elegante">Evento Noche</SelectItem>
                  <SelectItem value="Viaje">Viaje / Vacaciones</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2"><CloudSun className="w-3 h-3" /> Clima</Label>
              <Select value={params.weather} onValueChange={v => setParams({...params, weather: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Caluroso">Caluroso / Verano</SelectItem>
                  <SelectItem value="Soleado y Templado">Soleado y Templado</SelectItem>
                  <SelectItem value="Frío / Invierno">Frío / Invierno</SelectItem>
                  <SelectItem value="Lluvioso">Lluvioso</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button 
            onClick={generateCapsules} 
            disabled={loading} 
            className="w-full bg-secondary h-12 text-white font-bold"
          >
            {loading ? <><Loader2 className="mr-2 animate-spin" /> Creando Looks...</> : <><Sparkles className="mr-2" /> Generar Cápsulas</>}
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-8">
        {capsules.length === 0 && !loading && (
          <div className="text-center py-12 text-muted-foreground opacity-60">
            <Layers className="w-12 h-12 mx-auto mb-4" />
            <p>Selecciona tus preferencias y pulsa Generar</p>
          </div>
        )}

        {capsules.map((capsule, idx) => (
          <div key={idx} className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-2">
              <div className="h-8 w-1 bg-primary rounded-full" />
              <h2 className="text-xl font-headline font-bold">{capsule.name}</h2>
            </div>
            <p className="text-sm text-muted-foreground bg-white/50 border p-4 rounded-xl shadow-sm">{capsule.description}</p>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {capsule.items.map((item, itemIdx) => (
                <Card key={itemIdx} className="overflow-hidden border-none shadow-sm relative group hover:shadow-md transition-shadow">
                  <div className="absolute top-2 left-2 z-10">
                    {item.source === 'wardrobe' ? (
                      <div className="bg-primary/90 backdrop-blur-sm text-[10px] text-white px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                        <FolderHeart className="w-3 h-3" /> Armario
                      </div>
                    ) : (
                      <div className="bg-secondary/90 backdrop-blur-sm text-[10px] text-white px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                        <ShoppingBag className="w-3 h-3" /> Tienda
                      </div>
                    )}
                  </div>
                  <div className="relative aspect-[3/4] bg-muted overflow-hidden">
                    <Image 
                      src={getItemImage(item)} 
                      alt={item.name} 
                      fill 
                      className="object-cover transition-transform group-hover:scale-105 duration-500" 
                      data-ai-hint={getItemHint(item)}
                    />
                  </div>
                  <CardContent className="p-3 bg-white">
                    <p className="font-bold text-[10px] truncate">{item.name}</p>
                    <p className="text-[9px] text-muted-foreground uppercase">{item.type}</p>
                    {item.shopLink && (
                      <Link href={item.shopLink} target="_blank" className="text-[8px] text-secondary hover:underline mt-1 block font-medium">
                        Ver en tienda →
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
