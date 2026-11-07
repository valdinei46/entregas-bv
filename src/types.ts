export type UserRole = 'client' | 'courier' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  avatar: string;
  cpf?: string;
  cnh?: string;
  password?: string;
  isRegistered?: boolean;
  rating?: number;
  totalDeliveries?: number;
  vehicle?: {
    model: string;
    plate: string;
    color: string;
    year?: string;
  };
  isOnline?: boolean;
}

export type OrderStatus =
  | 'pending'
  | 'accepted'
  | 'arrived_pickup'
  | 'in_transit'
  | 'arriving'
  | 'delivered'
  | 'cancelled';

export type PaymentMethod = 'pix' | 'cash' | 'card';

export interface LocationPoint {
  address: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  lat: number;
  lng: number;
}

export interface OrderRating {
  stars: number;
  tags: string[];
  comment: string;
  tip: number;
  createdAt: string;
}

export interface Order {
  id: string;
  code: string;
  clientId: string;
  clientName: string;
  clientPhone: string;
  clientAvatar: string;
  courierId?: string;
  courierName?: string;
  courierPhone?: string;
  courierAvatar?: string;
  courierRating?: number;
  courierVehicle?: {
    model: string;
    plate: string;
    color: string;
  };
  origin: LocationPoint;
  destination: LocationPoint;
  packageType: 'documento' | 'comida' | 'encomenda' | 'fragil' | 'medicamento';
  packageNotes?: string;
  distanceKm: number;
  durationMin: number;
  price: number;
  adminFee: number; // R$ 15.00
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  cashChangeFor?: number;
  paymentStatus: 'pending' | 'paid_to_courier';
  courierAdminFeeStatus: 'pending' | 'paid' | 'verified_by_admin';
  courierAdminFeeReceipt?: string;
  createdAt: string;
  acceptedAt?: string;
  completedAt?: string;
  courierLocation?: {
    lat: number;
    lng: number;
    heading: number;
    speedKmH?: number;
    remainingDistanceMeters?: number;
    estimatedArrivalSeconds?: number;
  };
  routeCoordinates: [number, number][];
  currentWaypointIndex: number;
  estimatedArrivalMin: number;
  deliveryConfirmationCode?: string; // 4-digit security code for client and courier
  deliveryProofPhoto?: string;
  rating?: OrderRating;
}

export interface ChatMessage {
  id: string;
  orderId: string;
  senderId: string;
  senderRole: UserRole;
  senderName: string;
  text: string;
  timestamp: string;
  isQuickMsg?: boolean;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'order' | 'chat' | 'payment' | 'admin';
  timestamp: string;
  orderId?: string;
  read: boolean;
}
