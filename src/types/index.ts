export interface StockItem {
  id: string;
  name: string;
  sku: string;
  category: string;
  description: string;
  supplier: string;
  supplierRef: string;
  supplierLink: string;
  imageUrl: string;
  quantity: number;
  minQuantity: number;
  unit: string;
  location: string;
  price: number;
  createdAt: string;
  updatedAt: string;
  // Composants fields
  componentValue?: string;
  componentVoltage?: string;
  componentFootprint?: string;
  // Visserie fields
  screwType?: string;
  screwLength?: string;
  screwShape?: string;
  link?: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  description: string;
  imageUrl?: string;
  assemblyListId: string;
  quantityProduced: number;
  minQuantity: number;
  createdAt: string;
}

export interface AssemblyItem {
  stockItemId: string;
  quantity: number;
}

export interface AssemblyList {
  id: string;
  name: string;
  productName: string;
  description: string;
  items: AssemblyItem[];
  createdAt: string;
}
