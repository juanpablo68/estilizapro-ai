
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
      reader.onloadend = () => {
        setNewItem({ ...newItem, imageDataUri: reader.result as string });
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
        description: "Por favor, añade un nombre y una foto a la prenda."
      });
      return;
    }
    
    const item: WardrobeItem = {
      id: crypto.randomUUID(),
      name: newItem.name,
      type: newItem.type,
      imageDataUri: newItem.imageDataUri,
      dateAdded: new Date().toISOString(),
    };
    
    setItems([item, ...items]);
    
    toast({
      title: "Prenda Guardada",
      description: `${newItem.name} ha sido añadida a tu armario.`
    });
    
    setAdding(false);
    setNewItem({ name: '', type: 'top', imageDataUri: '' });
  };

  const deleteItem = (id: string) => {
    setItems(items.filter(i => i.id !== id));
    toast({
      title: "Prenda Eliminada",
    });
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
              <div className="relative aspect-square w-full max-w-[280px] mx-auto bg-muted rounded-2xl flex items-center justify-center overflow-hidden border-2 border-dashed border-primary/20 hover:border-primary/50 transition-colors">
                {loading ? (
                  <Loader2 className="w-10 h-10 animate-spin text-primary" />
                ) : newItem.imageDataUri ? (
                  <>
                    <Image src={newItem.imageDataUri} alt="Preview" fill className="object-cover" />
                    <Button 
                      variant="secondary" 
                      size="icon" 
                      className="absolute top-2 right-2 rounded-full shadow-md"
                      onClick={() => setNewItem({...newItem, imageDataUri: ''})}
                    >
                      ×
                    </Button>
                  </>
                ) : (
                  <label className="cursor-pointer flex flex-col items-center justify-center w-full h-full text-center p-4">
                    <Camera className="w-12 h-12 text-muted-foreground mb-3" />
                    <span className="text-sm font-bold text-muted-foreground">SUBIR FOTO</span>
                    <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                  </label>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-black text-muted-foreground">Nombre de la prenda</Label>
                <Input 
                  placeholder="Ej: Blazer Lino Crudo" 
                  value={newItem.name} 
                  onChange={e => setNewItem({...newItem, name: e.target.value})}
                  className="rounded-xl h-12"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-black text-muted-foreground">Categoría</Label>
                <Select value={newItem.type} onValueChange={v => setNewItem({...newItem, type: v})}>
                  <SelectTrigger className="rounded-xl h-12">
                    <SelectValue placeholder="Tipo de prenda" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="top">Superior (Camiseta, Blusa)</SelectItem>
                    <SelectItem value="bottom">Inferior (Pantalón, Falda)</SelectItem>
                    <SelectItem value="dress">Vestido</SelectItem>
                    <SelectItem value="outerwear">Exterior (Chaqueta, Abrigo)</SelectItem>
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
          <Button onClick={() => setAdding(true)} className="w-full h-14 bg-primary shadow-xl rounded-2xl font-bold text-lg sticky top-4 z-10 hover:scale-[1.02] transition-transform">
            <Plus className="mr-2" /> Añadir al Armario
          </Button>

          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
              <div className="p-10 bg-muted/30 rounded-full">
                <Shirt className="w-20 h-20 text-muted-foreground/40" />
              </div>
              <div className="space-y-1">
                <p className="font-bold text-muted-foreground">Tu armario está vacío</p>
                <p className="text-xs text-muted-foreground/60 max-w-[200px]">Empieza a fotografiar tu ropa para que la IA pueda crear tus looks.</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {items.map(item => (
                <Card key={item.id} className="overflow-hidden border-none shadow-md group rounded-2xl bg-white hover:shadow-xl transition-all">
                  <div className="relative aspect-[3/4] bg-muted">
                    <Image src={item.imageDataUri} alt={item.name} fill className="object-cover" />
                    <Button 
                      variant="destructive" 
                      size="icon" 
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 rounded-full shadow-lg"
                      onClick={() => deleteItem(item.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <CardContent className="p-4 bg-white">
                    <p className="font-bold text-xs truncate uppercase tracking-tight">{item.name}</p>
                    <p className="text-[9px] text-muted-foreground uppercase font-black tracking-widest mt-1 text-primary/70">{item.type}</p>
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
