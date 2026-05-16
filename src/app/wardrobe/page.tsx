
"use client"

import { useState, useEffect } from 'react';
import { useLocalStorage, WardrobeItem } from '@/lib/storage-hooks';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Camera, Plus, Trash2, ArrowLeft, Shirt, Loader2 } from "lucide-react";
import Image from 'next/image';
import Link from 'next/link';
import { useToast } from "@/hooks/use-toast";

// Optimizado a 600px para garantizar que el armario no exceda límites de almacenamiento ni de red
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
        if (width > MAX_WIDTH) {
          height *= MAX_WIDTH / width;
          width = MAX_WIDTH;
        }
      } else {
        if (height > MAX_HEIGHT) {
          width *= MAX_HEIGHT / height;
          height = MAX_HEIGHT;
        }
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, width, height);
      // Calidad 0.7 para minimizar peso del payload en Server Actions
      resolve(canvas.toDataURL('image/jpeg', 0.7));
    };
  });
};

export default function WardrobePage() {
  const [items, setItems] = useLocalStorage<WardrobeItem[]>('estiliza_wardrobe', []);
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
      toast({
        variant: "destructive",
        title: "Datos incompletos",
        description: "Añade un nombre y una foto."
      });
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
    toast({
      title: "Guardado",
      description: `${newItem.name} añadida al armario.`
    });
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
        <Link href="/dashboard">
          <Button variant="ghost" size="icon" className="rounded-full"><ArrowLeft /></Button>
        </Link>
        <h1 className="text-2xl font-headline font-bold">Mi Armario</h1>
      </header>

      {adding ? (
        <Card className="border-none shadow-xl bg-white rounded-3xl overflow-hidden">
          <CardContent className="p-8 space-y-6">
            <h2 className="font-bold text-xl text-primary flex items-center gap-2">
              <Shirt className="w-5 h-5" /> Nueva Prenda
            </h2>
            
            <div className="space-y-6">
              <div className="relative aspect-square w-full max-w-[280px] mx-auto bg-muted rounded-2xl flex items-center justify-center overflow-hidden border-2 border-dashed border-primary/20">
                {loading ? (
                  <Loader2 className="w-10 h-10 animate-spin text-primary" />
                ) : newItem.imageDataUri ? (
                  <>
                    <Image src={newItem.imageDataUri} alt="Preview" fill className="object-cover" />
                    <Button 
                      variant="secondary" 
                      size="icon" 
                      className="absolute top-2 right-2 rounded-full"
                      onClick={() => setNewItem({...newItem, imageDataUri: ''})}
                    >
                      ×
                    </Button>
                  </>
                ) : (
                  <label className="cursor-pointer flex flex-col items-center justify-center w-full h-full p-4">
                    <Camera className="w-12 h-12 text-muted-foreground mb-3" />
                    <span className="text-sm font-bold text-muted-foreground">SUBIR FOTO</span>
                    <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                  </label>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-black">Nombre</Label>
                <Input 
                  placeholder="Ej: Camisa Blanca" 
                  value={newItem.name} 
                  onChange={e => setNewItem({...newItem, name: e.target.value})}
                  className="rounded-xl h-12"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-black">Categoría</Label>
                <Select value={newItem.type} onValueChange={v => setNewItem({...newItem, type: v})}>
                  <SelectTrigger className="rounded-xl h-12">
                    <SelectValue />
                  </SelectTrigger>
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
                <Button className="flex-1 h-12 rounded-xl bg-primary font-bold shadow-lg" onClick={addItem}>Guardar</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <Button onClick={() => setAdding(true)} className="w-full h-14 bg-primary shadow-xl rounded-2xl font-bold text-lg sticky top-4 z-10">
            <Plus className="mr-2" /> Añadir al Armario
          </Button>

          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
              <Shirt className="w-20 h-20 text-muted-foreground/40" />
              <p className="font-bold text-muted-foreground">Tu armario está vacío</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {items.map(item => (
                <Card key={item.id} className="overflow-hidden border-none shadow-md group rounded-2xl bg-white">
                  <div className="relative aspect-[3/4] bg-muted">
                    <Image src={item.imageDataUri} alt={item.name} fill className="object-cover" />
                    <Button 
                      variant="destructive" 
                      size="icon" 
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 h-8 w-8 rounded-full"
                      onClick={() => deleteItem(item.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <CardContent className="p-4">
                    <p className="font-bold text-xs truncate uppercase">{item.name}</p>
                    <p className="text-[9px] text-primary/70 uppercase font-black mt-1">{item.type}</p>
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
