
"use client"

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUserScopedStorage, WardrobeItem, UserProfile, INITIAL_USER_PROFILE } from '@/lib/storage-hooks';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Camera, Plus, Trash2, ArrowLeft, Shirt, Loader2 } from "lucide-react";
import Image from 'next/image';
import Link from 'next/link';
import { useToast } from "@/hooks/use-toast";

const resizeImage = (base64Str: string): Promise<string> => {
  return new Promise((resolve) => {
    const img = new window.Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const MAX_WIDTH = 600;
      const MAX_HEIGHT = 600;
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
      } else {
        if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; }
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', 0.7));
    };
  });
};

export default function WardrobePage() {
  const router = useRouter();
  const [items, setItems] = useUserScopedStorage<WardrobeItem[]>('estiliza_wardrobe', []);
  const [profile] = useUserScopedStorage<UserProfile>('estiliza_profile', INITIAL_USER_PROFILE);
  const [mounted, setMounted] = useState(false);
  const [adding, setAdding] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newItem, setNewItem] = useState({ name: '', type: 'top', imageDataUri: '' });
  const { toast } = useToast();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLoading(true);
      const reader = new FileReader();
      reader.onloadend = async () => {
        const optimized = await resizeImage(reader.result as string);
        setNewItem({ ...newItem, imageDataUri: optimized });
        setLoading(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const addItem = () => {
    if (!newItem.name || !newItem.imageDataUri) {
      toast({ variant: "destructive", title: "Datos incompletos", description: "Añade un nombre y una foto." });
      return;
    }
    
    const randomId = Math.random().toString(36).substring(2, 9);
    const item: WardrobeItem = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `item-${Date.now()}-${randomId}`,
      name: newItem.name,
      type: newItem.type,
      imageDataUri: newItem.imageDataUri,
      dateAdded: new Date().toISOString(),
    };
    
    setItems([item, ...items]);
    toast({ title: "Guardado", description: `${newItem.name} añadida al armario de ${profile.name}.` });
    setAdding(false);
    setNewItem({ name: '', type: 'top', imageDataUri: '' });
  };

  const deleteItem = (id: string) => {
    setItems(items.filter(i => i.id !== id));
    toast({ title: "Eliminado" });
  };

  if (!mounted) return null;

  return (
    <div className="flex-1 max-w-4xl mx-auto w-full p-6 space-y-6 pb-20">
      <header className="flex items-center gap-4 pt-4">
        <Button variant="ghost" size="icon" className="rounded-full" onClick={() => router.push('/dashboard')}>
          <ArrowLeft />
        </Button>
        <div>
          <h1 className="text-2xl font-headline font-bold text-primary">Mi Armario</h1>
          <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">Sesión: {profile.name || 'Cargando...'}</p>
        </div>
      </header>

      {adding ? (
        <Card className="border-none shadow-xl bg-white rounded-3xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
          <CardContent className="p-8 space-y-6">
            <h2 className="font-bold text-xl text-primary flex items-center gap-2">
              <Plus className="w-5 h-5" /> Nueva Prenda
            </h2>
            
            <div className="space-y-6">
              <div className="relative aspect-square w-full max-w-[280px] mx-auto bg-muted rounded-2xl flex items-center justify-center overflow-hidden border-2 border-dashed border-primary/20">
                {loading ? (
                  <Loader2 className="w-10 h-10 animate-spin text-primary" />
                ) : newItem.imageDataUri ? (
                  <>
                    <Image src={newItem.imageDataUri} alt="Preview" fill className="object-cover" unoptimized />
                    <Button 
                      variant="secondary" 
                      size="icon" 
                      className="absolute top-2 right-2 rounded-full h-8 w-8 shadow-md"
                      onClick={() => setNewItem({...newItem, imageDataUri: ''})}
                    >
                      ×
                    </Button>
                  </>
                ) : (
                  <label className="cursor-pointer flex flex-col items-center justify-center w-full h-full p-4 hover:bg-primary/5 transition-colors">
                    <Camera className="w-12 h-12 text-muted-foreground mb-3" />
                    <span className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Subir Foto</span>
                    <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                  </label>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-black text-primary">Nombre de la prenda</Label>
                <Input 
                  placeholder="Ej: Camisa Blanca Lino" 
                  value={newItem.name} 
                  onChange={e => setNewItem({...newItem, name: e.target.value})}
                  className="rounded-xl h-12 border-muted"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-black text-primary">Categoría</Label>
                <Select value={newItem.type} onValueChange={v => setNewItem({...newItem, type: v})}>
                  <SelectTrigger className="rounded-xl h-12 border-muted"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="top">Superior</SelectItem>
                    <SelectItem value="bottom">Inferior</SelectItem>
                    <SelectItem value="dress">Vestido</SelectItem>
                    <SelectItem value="outerwear">Exterior</SelectItem>
                    <SelectItem value="shoe">Calzado</SelectItem>
                    <SelectItem value="accessory">Accesorio</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-4 pt-4">
                <Button variant="outline" className="flex-1 h-12 rounded-xl" onClick={() => setAdding(false)}>Cancelar</Button>
                <Button className="flex-1 h-12 rounded-xl bg-primary font-bold shadow-lg" onClick={addItem}>Guardar Prenda</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <Button onClick={() => setAdding(true)} className="w-full h-14 bg-primary shadow-xl rounded-2xl font-bold text-lg sticky top-4 z-10 hover:scale-[1.01] transition-transform">
            <Plus className="mr-2" /> Añadir al Armario
          </Button>

          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center space-y-4 bg-white/50 rounded-[2rem] border border-dashed border-muted">
              <Shirt className="w-20 h-20 text-muted-foreground/20 animate-pulse" />
              <div className="space-y-1">
                <p className="font-bold text-muted-foreground">Tu armario está vacío</p>
                <p className="text-xs text-muted-foreground/60">Empieza a digitalizar tus prendas para que la IA cree looks por ti.</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 animate-in fade-in duration-500">
              {items.map(item => (
                <Card key={item.id} className="overflow-hidden border-none shadow-md group rounded-2xl bg-white hover:shadow-xl transition-shadow">
                  <div className="relative aspect-[3/4] bg-muted">
                    <Image src={item.imageDataUri} alt={item.name} fill className="object-cover" unoptimized />
                    <Button 
                      variant="destructive" 
                      size="icon" 
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 h-8 w-8 rounded-full shadow-lg transition-opacity"
                      onClick={() => deleteItem(item.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                    <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm px-2 py-0.5 rounded-full shadow-sm">
                      <p className="text-[8px] font-black uppercase text-primary">{item.type}</p>
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <p className="font-bold text-[10px] truncate uppercase tracking-tighter">{item.name}</p>
                    <p className="text-[8px] text-muted-foreground uppercase mt-1">Añadido: {new Date(item.dateAdded).toLocaleDateString()}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
