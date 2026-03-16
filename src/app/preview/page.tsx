"use client"

import { useState } from 'react';
import { useLocalStorage, UserProfile, INITIAL_USER_PROFILE, WardrobeItem } from '@/lib/storage-hooks';
import { previewOutfitOnAvatar } from '@/ai/flows/preview-outfit-on-avatar';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Loader2, Sparkles, User, Shirt, CheckCircle } from "lucide-react";
import Link from 'next/link';
import Image from 'next/image';

export default function PreviewPage() {
  const [profile] = useLocalStorage<UserProfile>('estiliza_profile', INITIAL_USER_PROFILE);
  const [wardrobe] = useLocalStorage<WardrobeItem[]>('estiliza_wardrobe', []);
  const [selectedItem, setSelectedItem] = useState<WardrobeItem | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const [resultImage, setResultImage] = useState<string | null>(null);

  const handlePreview = async () => {
    if (!profile.avatarDataUri || !selectedItem) return;
    setPreviewing(true);
    setResultImage(null);
    try {
      const result = await previewOutfitOnAvatar({
        avatarDataUri: profile.avatarDataUri,
        clothingItemDataUri: selectedItem.imageDataUri
      });
      setResultImage(result.previewImageDataUri);
    } catch (err) {
      console.error(err);
    } finally {
      setPreviewing(false);
    }
  };

  return (
    <div className="flex-1 max-w-4xl mx-auto w-full p-6 space-y-6 pb-20">
      <header className="flex items-center gap-4 pt-4">
        <Link href="/dashboard">
          <Button variant="ghost" size="icon"><ArrowLeft /></Button>
        </Link>
        <h1 className="text-2xl font-headline font-bold">Probador Virtual</h1>
      </header>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <h2 className="text-lg font-bold flex items-center gap-2"><Shirt className="w-5 h-5 text-primary" /> Elige una prenda</h2>
          <div className="grid grid-cols-3 gap-3 max-h-[400px] overflow-y-auto p-1">
            {wardrobe.map(item => (
              <div 
                key={item.id} 
                onClick={() => setSelectedItem(item)}
                className={`relative aspect-square rounded-xl overflow-hidden cursor-pointer border-4 transition-all ${
                  selectedItem?.id === item.id ? 'border-primary' : 'border-transparent'
                }`}
              >
                <Image src={item.imageDataUri} alt={item.name} fill className="object-cover" />
                {selectedItem?.id === item.id && (
                  <div className="absolute top-1 right-1 bg-primary text-white rounded-full p-0.5">
                    <CheckCircle className="w-3 h-3" />
                  </div>
                )}
              </div>
            ))}
          </div>
          {wardrobe.length === 0 && (
            <p className="text-center text-muted-foreground text-sm italic">Sube prendas a tu armario primero.</p>
          )}
          <Button 
            className="w-full bg-secondary h-12" 
            disabled={!selectedItem || !profile.avatarDataUri || previewing}
            onClick={handlePreview}
          >
            {previewing ? <><Loader2 className="mr-2 animate-spin" /> Procesando look...</> : <><Sparkles className="mr-2" /> Probar en mi Avatar</>}
          </Button>
        </div>

        <div className="space-y-6">
          <h2 className="text-lg font-bold flex items-center gap-2"><User className="w-5 h-5 text-primary" /> Vista Previa</h2>
          <Card className="aspect-[3/4] w-full max-w-[350px] mx-auto overflow-hidden relative shadow-2xl border-none ring-8 ring-white">
            {resultImage ? (
              <Image src={resultImage} alt="Result" fill className="object-cover" />
            ) : previewing ? (
              <div className="w-full h-full flex flex-col items-center justify-center bg-muted/20">
                <Loader2 className="w-10 h-10 text-primary animate-spin mb-2" />
                <p className="text-xs text-muted-foreground">La IA está vistiendo a tu avatar...</p>
              </div>
            ) : profile.avatarDataUri ? (
              <div className="relative w-full h-full">
                <Image src={profile.avatarDataUri} alt="Avatar Base" fill className="object-cover opacity-50 grayscale-[50%]" />
                <div className="absolute inset-0 flex items-center justify-center p-8 text-center bg-black/5">
                  <p className="text-xs font-medium bg-white/80 p-3 rounded-lg shadow-sm">Selecciona una prenda para ver el resultado</p>
                </div>
              </div>
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-muted">
                <p className="text-sm">Crea tu avatar primero.</p>
              </div>
            )}
          </Card>
          {resultImage && (
            <div className="text-center">
              <Button variant="outline" size="sm" onClick={() => setResultImage(null)}>Limpiar Probador</Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
