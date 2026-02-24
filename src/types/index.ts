export interface StockItem {
  id: string;
  name: string;
  sku: string;
  category: string;
  description: string;
  supplier: string;
  supplierRef: string;
  imageUrl: string;
  quantity: number;
  minQuantity: number;
  unit: string;
  location: string;
  price: number;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  description: string;
  assemblyListId: string;
  quantityProduced: number;
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
