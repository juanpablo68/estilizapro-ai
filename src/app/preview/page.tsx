
"use client"

import { useState, useEffect } from 'react';
import { useUserScopedStorage, UserProfile, INITIAL_USER_PROFILE, WardrobeItem, loadHeavyImage, saveHeavyImage } from '@/lib/storage-hooks';
import { previewOutfitOnAvatar } from '@/ai/flows/preview-outfit-on-avatar';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Loader2, Sparkles, User, Shirt, CheckCircle, Info, X } from "lucide-react";
import Link from 'next/link';
import Image from 'next/image';
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { db, dataURItoBlob } from '@/lib/local-db';

const compressForAction = (base64Str: string): Promise<string> => {
  return new Promise((resolve) => {
    const img = new window.Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const MAX_SIZE = 600;
      let width = img.width;
      let height = img.height;
      if (width > height) { if (width > MAX_SIZE) { height *= MAX_SIZE / width; width = MAX_SIZE; } }
      else { if (height > MAX_SIZE) { width *= MAX_SIZE / height; height = MAX_SIZE; } }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', 0.8));
    };
  });
};

export default function PreviewPage() {
  const [profile] = useUserScopedStorage<UserProfile>('estiliza_profile', INITIAL_USER_PROFILE);
  const [wardrobe] = useUserScopedStorage<WardrobeItem[]>('estiliza_wardrobe', []);
  const [mounted, setMounted] = useState(false);
  const [selectedItems, setSelectedItems] = useState<WardrobeItem[]>([]);
  const [previewing, setPreviewing] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [wardrobeUrls, setWardrobeUrls] = useState<Record<string, string>>({});
  const { toast } = useToast();

  const userSlug = profile.name ? profile.name.toLowerCase().replace(/\s+/g, '_') : 'user';

  useEffect(() => {
    setMounted(true);
    const loadAssets = async () => {
      // Cargar Avatar
      if (profile.avatarDataUri) {
        const url = await loadHeavyImage(profile.avatarDataUri);
        if (url) setAvatarUrl(url);
      }
      // Cargar Armario
      const urls: Record<string, string> = {};
      for (const item of wardrobe) {
        const url = await loadHeavyImage(item.imageDataUri);
        if (url) urls[item.id] = url;
      }
      setWardrobeUrls(urls);
    };
    loadAssets();
  }, [profile.avatarDataUri, wardrobe]);

  const toggleItem = (item: WardrobeItem) => {
    setSelectedItems(prev => {
      const isSelected = prev.find(i => i.id === item.id);
      return isSelected ? prev.filter(i => i.id !== item.id) : [...prev, item];
    });
  };

  const handlePreview = async () => {
    if (!profile.avatarDataUri || selectedItems.length === 0) return;
    
    const localKey = localStorage.getItem('openai_api_key');
    const openaiKey = localKey && localKey.trim() !== '' ? localKey : undefined;

    setPreviewing(true);
    setResultUrl(null);

    try {
      // 1. Obtener avatares e imágenes reales de IndexedDB para la IA
      const avatarImg = await db.images.get(profile.avatarDataUri);
      if (!avatarImg) throw new Error("No se pudo cargar el avatar base.");
      
      const avatarB64 = await new Promise<string>((res) => {
        const reader = new FileReader();
        reader.onload = () => res(reader.result as string);
        reader.readAsDataURL(avatarImg.blob);
      });

      const clothingB64s = await Promise.all(selectedItems.map(async (item) => {
        const img = await db.images.get(item.imageDataUri);
        if (!img) return "";
        const b64 = await new Promise<string>((res) => {
          const reader = new FileReader();
          reader.onload = () => res(reader.result as string);
          reader.readAsDataURL(img.blob);
        });
        return await compressForAction(b64);
      }));

      const result = await previewOutfitOnAvatar({
        avatarDataUri: avatarB64,
        clothingItemsDataUris: clothingB64s.filter(s => s !== ""),
        biometricData: profile.biometricData,
        openaiApiKey: openaiKey,
        userId: userSlug
      });

      // 2. Guardar resultado en IndexedDB
      const resultId = await saveHeavyImage(userSlug, 'tryon', result.previewImageDataUri);
      setResultUrl(URL.createObjectURL(dataURItoBlob(result.previewImageDataUri)));
      
      toast({ title: "¡Montaje Completado!", description: "Look guardado en tu memoria local." });
    } catch (err: any) {
      console.error(err);
      toast({ variant: "destructive", title: "Error", description: err.message || "No se pudo generar el montaje." });
    } finally {
      setPreviewing(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="flex-1 max-w-6xl mx-auto w-full p-6 space-y-6 pb-24">
      <header className="flex items-center gap-4 pt-4">
        <Link href="/dashboard">
          <Button variant="ghost" size="icon" className="rounded-full"><ArrowLeft /></Button>
        </Link>
        <div>
          <h1 className="text-2xl font-headline font-bold text-primary">Probador Virtual</h1>
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black">Persistencia Binaria Activa</p>
        </div>
      </header>

      {!profile.avatarDataUri && (
        <Alert variant="destructive" className="bg-destructive/5">
          <Info className="h-4 w-4" />
          <AlertTitle>Falta Avatar</AlertTitle>
          <AlertDescription>
            Debes crear tu avatar primero. <Link href="/avatar-creation" className="underline font-bold">Crear Avatar →</Link>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-4 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold flex items-center gap-2"><Shirt className="w-5 h-5 text-primary" /> Mi Armario</h2>
            <Badge variant="secondary" className="bg-primary/10 text-primary font-black">
              {selectedItems.length} Seleccionados
            </Badge>
          </div>
          
          <div className="grid grid-cols-2 gap-3 max-h-[500px] overflow-y-auto p-1 pr-2 scrollbar-thin">
            {wardrobe.map(item => {
              const isSelected = selectedItems.find(i => i.id === item.id);
              const url = wardrobeUrls[item.id];
              return (
                <Card 
                  key={item.id} 
                  onClick={() => toggleItem(item)}
                  className={`relative aspect-[3/4] rounded-2xl overflow-hidden cursor-pointer border-4 transition-all hover:scale-105 ${
                    isSelected ? 'border-primary shadow-lg' : 'border-transparent'
                  }`}
                >
                  {url && <Image src={url} alt={item.name} fill className="object-cover" />}
                  <div className="absolute bottom-0 inset-x-0 bg-black/40 p-2">
                    <p className="text-[8px] text-white font-bold truncate uppercase">{item.name}</p>
                  </div>
                </Card>
              );
            })}
          </div>

          <Button 
            className="w-full h-14 bg-primary text-white font-bold shadow-xl rounded-2xl text-lg transition-transform" 
            disabled={selectedItems.length === 0 || !profile.avatarDataUri || previewing}
            onClick={handlePreview}
          >
            {previewing ? <><Loader2 className="mr-3 animate-spin" /> Creando Look...</> : <><Sparkles className="mr-3" /> Probar Conjunto</>}
          </Button>
        </div>

        <div className="lg:col-span-8 space-y-6">
          <h2 className="text-lg font-bold flex items-center gap-2"><User className="w-5 h-5 text-primary" /> Visualización Local</h2>
          <Card className="aspect-[4/5] w-full max-w-[500px] mx-auto overflow-hidden relative shadow-2xl border-none ring-[12px] ring-primary/5 rounded-[3rem] bg-white">
            {resultUrl ? (
              <div className="animate-in fade-in zoom-in duration-700 h-full w-full">
                <Image src={resultUrl} alt="Resultado" fill className="object-cover" unoptimized />
              </div>
            ) : previewing ? (
              <div className="w-full h-full flex flex-col items-center justify-center bg-muted/20 space-y-4">
                <Loader2 className="w-16 h-16 text-primary animate-spin" />
                <p className="text-sm font-bold text-primary">Procesando en Memoria Local...</p>
              </div>
            ) : avatarUrl ? (
              <div className="relative w-full h-full group">
                <Image src={avatarUrl} alt="Avatar Base" fill className="object-cover opacity-60 grayscale-[30%]" unoptimized />
                <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center bg-black/5 backdrop-blur-[1px]">
                  <div className="bg-white/90 p-6 rounded-[2rem] shadow-2xl border border-primary/10">
                    <Shirt className="w-12 h-12 text-primary mx-auto mb-4" />
                    <h3 className="text-sm font-bold mb-2">Listo para el montaje</h3>
                    <p className="text-[10px] text-muted-foreground">Selecciona prendas para vestir tu avatar localmente.</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-muted p-12 text-center">
                <User className="w-16 h-16 text-muted-foreground/30 mb-4" />
                <p className="text-sm font-medium text-muted-foreground">Carga tu avatar para habilitar el probador local.</p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
