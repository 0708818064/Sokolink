import { Role, UserStatus, SmeStatus, DeliveryStatusEnum, FulfillmentStatus, PaymentStatus, DeliveryJobStatus } from "@prisma/client";

export interface UserSession {
  userId: string;
  email: string;
  role: Role;
  name: string;
  smeId?: string;
  deliveryId?: string;
}

export interface ProductItem {
  id: string;
  name: string;
  slug: string;
  description: string;
  sku: string;
  price: number;
  discountedPrice?: number | null;
  stock: number;
  condition?: string | null;
  location?: string | null;
  rating: number;
  reviewCount: number;
  images: { url: string; altText?: string | null; isPrimary: boolean }[];
  category: { id: string; name: string; slug: string };
  sme: {
    id: string;
    businessName: string;
    businessSlug: string;
    location: string;
    rating: number;
    ratingCount: number;
  };
}

export interface CartItemType {
  productId: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    discountedPrice?: number | null;
    stock: number;
    imageUrl?: string;
    smeId: string;
    smeName: string;
    smeSlug: string;
  };
}

export interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  imageUrl?: string | null;
  icon?: string | null;
  _count?: {
    products: number;
  };
}

export interface SMEStoreItem {
  id: string;
  businessName: string;
  businessSlug: string;
  businessDescription?: string | null;
  category: string;
  phone: string;
  location: string;
  address: string;
  logoUrl?: string | null;
  bannerUrl?: string | null;
  status: SmeStatus;
  rating: number;
  ratingCount: number;
  isFeatured: boolean;
  productsCount?: number;
}
