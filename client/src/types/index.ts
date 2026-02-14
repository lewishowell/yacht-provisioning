export type Category =
  | 'FOOD'
  | 'BEVERAGES'
  | 'CLEANING'
  | 'TOILETRIES'
  | 'DECK_SUPPLIES'
  | 'GALLEY'
  | 'SAFETY'
  | 'OTHER';

export type ListStatus = 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
}

export interface InventoryItem {
  id: string;
  userId: string;
  name: string;
  category: Category;
  quantity: number;
  targetQuantity: number;
  unit: string;
  expiryDate: string | null;
  reorderThreshold: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProvisioningList {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  status: ListStatus;
  createdAt: string;
  updatedAt: string;
  items?: ProvisioningListItem[];
  _count?: { items: number };
}

export interface ProvisioningListItem {
  id: string;
  listId: string;
  name: string;
  category: Category;
  quantity: number;
  unit: string;
  purchased: boolean;
  purchasedAt: string | null;
  createdAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface DashboardStats {
  totalItems: number;
  lowStockCount: number;
  activeLists: number;
  pendingPurchases: number;
  lowStockItems: InventoryItem[];
  expiringSoon: InventoryItem[];
  recentLists: ProvisioningList[];
}
