"use client"

import { useState } from 'react';
import { useLocalStorage, UserProfile, INITIAL_USER_PROFILE, WardrobeItem as LocalWardrobeItem } from '@/lib/storage-hooks';
import { receiveAICapsuleRecommendations, Capsule, CapsuleItem } from '@/ai/flows/ai-capsule-recommendations';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, ArrowLeft, Sparkles, MapPin, CloudSun, Pin, FolderHeart, ExternalLink } from "lucide-react";
import Link from 'next/link';
import Image from 'next/image';
import { useToast } from "@/hooks/use-toast";
import { PlaceHolderImages } from '@/lib/placeholder-images';

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
    const openaiKey = localStorage.getItem('openai_api_key');
    if (!openaiKey) {
      toast({ variant: "destructive", title: "Configura tu OpenAI Key en Ajustes" });
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
        wardrobeItems: wardrobe.map(i => ({ id: i.id, name: i.name, type: i.type })),
        openaiApiKey: openaiKey,
        pinterestToken: localStorage.getItem('pinterest_token') || undefined,
      });
      
      setCapsules(result.capsules);
      toast({ title: "¡Cápsulas Híbridas Listas!", description: "GPT-4o ha procesado tu armario e inspiración visual." });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error en Generación", description: err.message });
    } finally {
      setLoading(false);
    }
  };

  const getItemImage = (item: CapsuleItem) => {
    if (item.source === 'wardrobe' && item.wardrobeItemId) {
      const local = wardrobe.find(wi => wi.id === item.wardrobeItemId);
      if (local?.imageDataUri) return local.imageDataUri;
    }
    return item.imageUrl || PlaceHolderImages[0].imageUrl;
  };

  return (
    <div className="flex-1 max-w-4xl mx-auto w-full p-6 space-y-6 pb-20">
      <header className="flex items-center gap-4 pt-4">
        <Link href="/dashboard">
          <Button variant="ghost" size="icon" className="rounded-full"><ArrowLeft /></Button>
        </Link>
        <div>
          <h1 className="text-2xl font-headline font-bold">Styling Híbrido</h1>
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">GPT-4o + Pinterest Inspiration</p>
        </div>
      </header>

      <Card className="border-none shadow-xl bg-white/80 backdrop-blur-sm rounded-[2rem]">
        <CardContent className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-[10px] uppercase font-black text-primary"><MapPin className="w-3 h-3" /> Evento</Label>
              <Select value={params.eventType} onValueChange={v => setParams({...params, eventType: v})}>
                <SelectTrigger className="rounded-2xl h-12"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Trabajo">Oficina</SelectItem>
                  <SelectItem value="Casual">Día Casual</SelectItem>
                  <SelectItem value="Cena">Noche</SelectItem>
                  <SelectItem value="Gala">Evento Formal</SelectItem>
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
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={generateCapsules} disabled={loading} className="w-full bg-primary h-14 text-white font-bold rounded-2xl shadow-lg text-lg">
            {loading ? <><Loader2 className="mr-3 animate-spin" /> GPT-4o buscando inspiración...</> : <><Sparkles className="mr-3" /> Crear Cápsula Maestra</>}
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-12 mt-8">
        {capsules.map((capsule, idx) => (
          <div key={idx} className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-4">
              <div className="h-10 w-1.5 bg-primary rounded-full" />
              <div>
                <h2 className="text-2xl font-headline font-bold">{capsule.name}</h2>
                <p className="text-xs text-muted-foreground">{capsule.description}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {capsule.items.map((item, itemIdx) => (
                <Card key={itemIdx} className="overflow-hidden border-none shadow-md relative group rounded-2xl bg-white">
                  <div className="absolute top-2 left-2 z-10">
                    {item.source === 'wardrobe' ? (
                      <Badge className="bg-green-500 gap-1"><FolderHeart className="w-2.5 h-2.5" /> Armario</Badge>
                    ) : (
                      <Badge className="bg-red-500 gap-1"><Pin className="w-2.5 h-2.5" /> Pinterest</Badge>
                    )}
                  </div>
                  <div className="relative aspect-[3/4]">
                    <Image src={getItemImage(item)} alt={item.name} fill className="object-cover" unoptimized />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity p-3 flex items-end">
                      <p className="text-[9px] text-white font-medium leading-tight">{item.styleHint}</p>
                    </div>
                  </div>
                  <CardContent className="p-3">
                    <p className="font-bold text-[11px] truncate uppercase">{item.name}</p>
                    <p className="text-[9px] text-muted-foreground mt-0.5">{item.type}</p>
                    {item.externalUrl && (
                      <Link href={item.externalUrl} target="_blank" className="text-[9px] text-secondary hover:underline mt-2 flex items-center gap-1 font-bold">
                        VER REFERENCIA <ExternalLink className="w-2 h-2" />
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

function Badge({ children, className }: { children: React.ReactNode, className?: string }) {
  return (
    <div className={`text-[8px] font-black text-white px-2 py-1 rounded-full flex items-center shadow-md ${className}`}>
      {children}
    </div>
  );
}
