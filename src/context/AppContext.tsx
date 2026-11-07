import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import {
  User,
  UserRole,
  Order,
  OrderStatus,
  ChatMessage,
  AppNotification,
  OrderRating,
  LocationPoint,
  PaymentMethod,
} from '../types';
import {
  ADMIN_CREDENTIALS,
  INITIAL_USERS,
  INITIAL_ORDERS,
  POPULAR_LOCATIONS,
} from '../utils/mockData';
import {
  calculateDistanceKm,
  calculateBearing,
  generateRoutePoints,
} from '../utils/geo';
import { soundPlayer } from '../utils/audio';
import { sendBrowserPushNotification } from '../utils/notifications';
import { realtimeTracker, CourierTelemetryPacket } from '../services/realtimeTracker';

interface AppContextType {
  currentUser: User;
  allUsers: User[];
  orders: Order[];
  activeOrder: Order | null;
  activeRole: UserRole;
  chatMessages: ChatMessage[];
  notifications: AppNotification[];
  activeToast: AppNotification | null;
  soundEnabled: boolean;
  isSimulating: boolean;
  simulationSpeed: number; // 1, 3, 6
  useRealGps: boolean;
  realGpsActive: boolean;
  liveTelemetry: CourierTelemetryPacket | null;
  socketConnected: boolean;

  // Actions
  switchRole: (role: UserRole) => void;
  loginAsAdmin: (email: string, pass: string) => boolean;
  loginWithGoogle: (role: UserRole) => void;
  toggleCourierOnline: () => void;
  toggleSound: () => void;
  dismissToast: () => void;
  updateClientProfile: (profile: Partial<User>) => void;
  registerNewUser: (userData: Omit<User, 'id'>) => User;
  switchUserAccount: (userId: string) => void;
  setSimulationSpeed: (speed: number) => void;
  setUseRealGps: (use: boolean) => void;
  setIsSimulating: (sim: boolean) => void;

  // Order workflow
  createNewOrder: (params: {
    origin: LocationPoint;
    destination: LocationPoint;
    packageType: Order['packageType'];
    packageNotes?: string;
    paymentMethod: PaymentMethod;
    cashChangeFor?: number;
  }) => Order;
  acceptOrder: (orderId: string) => void;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  confirmDeliveryWithPIN: (orderId: string, pin?: string) => boolean;
  cancelOrder: (orderId: string) => void;
  advanceSimulationStep: (orderId: string) => void;
  jumpToOrderStatus: (orderId: string, targetStatus: OrderStatus) => void;

  // Chat & Review & Payment
  sendChatMessage: (orderId: string, text: string, isQuickMsg?: boolean) => void;
  submitRating: (orderId: string, rating: OrderRating) => void;
  payAdminFee: (orderId: string, receiptNote?: string) => void;
  adminVerifyFee: (orderId: string) => void;
}

const AppContext = createContext<AppContextType | null>(null);

const STORAGE_KEY_ORDERS = 'motoflash_orders_v1';
const STORAGE_KEY_USERS = 'motoflash_users_v1';
const STORAGE_KEY_CHAT = 'motoflash_chat_v1';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load users or fallback
  const [allUsers, setAllUsers] = useState<User[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_USERS);
      return saved ? JSON.parse(saved) : INITIAL_USERS;
    } catch {
      return INITIAL_USERS;
    }
  });

  // Current active role & user
  const [activeRole, setActiveRole] = useState<UserRole>('client');
  const [currentUser, setCurrentUser] = useState<User>(() => {
    return allUsers.find(u => u.role === 'client') || allUsers[3];
  });

  // Orders
  const [orders, setOrders] = useState<Order[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_ORDERS);
      return saved ? JSON.parse(saved) : INITIAL_ORDERS;
    } catch {
      return INITIAL_ORDERS;
    }
  });

  // Chat messages
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CHAT);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Notifications and Toast
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [activeToast, setActiveToast] = useState<AppNotification | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Simulation controls
  const [isSimulating, setIsSimulating] = useState(true);
  const [simulationSpeed, setSimulationSpeed] = useState<number>(2); // default 2x smooth
  const [useRealGps, setUseRealGps] = useState(false);
  const [realGpsActive, setRealGpsActive] = useState(false);

  // Real-time Socket & Telemetry stream state
  const [liveTelemetry, setLiveTelemetry] = useState<CourierTelemetryPacket | null>(null);
  const [socketConnected, setSocketConnected] = useState(true);

  // Active in-progress order
  const activeOrder = orders.find(
    o => o.status !== 'delivered' && o.status !== 'cancelled'
  ) || null;

  // Listen to incoming real-time telemetry from socket/BroadcastChannel
  useEffect(() => {
    const unsub = realtimeTracker.onCourierLocation((packet) => {
      setLiveTelemetry(packet);
      // Synchronize order location state if this is the active order
      setOrders(prev =>
        prev.map(o => {
          if (o.id === packet.orderId) {
            return {
              ...o,
              currentWaypointIndex: packet.currentWaypointIndex,
              estimatedArrivalMin: Math.ceil(packet.estimatedArrivalSeconds / 60),
              courierLocation: {
                lat: packet.lat,
                lng: packet.lng,
                heading: packet.heading,
                speedKmH: packet.speedKmH,
                remainingDistanceMeters: packet.remainingDistanceMeters,
                estimatedArrivalSeconds: packet.estimatedArrivalSeconds,
              },
            };
          }
          return o;
        })
      );
    });

    return () => unsub();
  }, []);

  // Save changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_ORDERS, JSON.stringify(orders));
    } catch (e) {
      console.warn('LocalStorage save error:', e);
    }
  }, [orders]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(allUsers));
    } catch (e) {
      console.warn('LocalStorage save error:', e);
    }
  }, [allUsers]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_CHAT, JSON.stringify(chatMessages));
    } catch (e) {
      console.warn('LocalStorage save error:', e);
    }
  }, [chatMessages]);

  // Sync current user when activeRole changes
  useEffect(() => {
    const user = allUsers.find(u => u.role === activeRole);
    if (user) {
      setCurrentUser(user);
    }
  }, [activeRole, allUsers]);

  const toggleSound = () => {
    setSoundEnabled(prev => {
      const next = !prev;
      soundPlayer.setSoundEnabled(next);
      return next;
    });
  };

  const notify = useCallback((title: string, message: string, type: AppNotification['type'] = 'order', orderId?: string) => {
    const newNotif: AppNotification = {
      id: 'notif_' + Date.now(),
      title,
      message,
      type,
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      orderId,
      read: false,
    };

    setNotifications(prev => [newNotif, ...prev]);
    setActiveToast(newNotif);

    // Browser Push Notification
    sendBrowserPushNotification(title, message);

    // Audio chime
    if (type === 'chat') {
      soundPlayer.playMessagePing();
    } else {
      soundPlayer.playStatusChime();
    }
  }, []);

  const dismissToast = () => {
    setActiveToast(null);
  };

  const switchRole = (role: UserRole) => {
    setActiveRole(role);
    const target = allUsers.find(u => u.role === role);
    if (target) {
      setCurrentUser(target);
    }
  };

  const loginAsAdmin = (email: string, pass: string): boolean => {
    if (email.trim().toLowerCase() === ADMIN_CREDENTIALS.email && pass.trim() === ADMIN_CREDENTIALS.password) {
      switchRole('admin');
      notify('Painel Admin', 'Acesso administrativo autorizado com sucesso!', 'admin');
      return true;
    }
    return false;
  };

  const loginWithGoogle = (role: UserRole) => {
    // Simulated instant Google Auth flow
    let user = allUsers.find(u => u.role === role);
    if (!user) {
      user = {
        id: `google_${Date.now()}`,
        name: role === 'courier' ? 'Lucas Motoboy (Google)' : 'Cliente Google',
        email: 'usuario.google@gmail.com',
        phone: '(95) 99188-7766',
        role,
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
        isOnline: true,
      };
      setAllUsers(prev => [...prev, user!]);
    }
    setActiveRole(role);
    setCurrentUser(user);
    notify('Login Google', `Conectado como ${user.name} via Conta Google!`, 'admin');
  };

  const toggleCourierOnline = () => {
    if (currentUser.role !== 'courier') return;
    const updatedStatus = !currentUser.isOnline;
    setCurrentUser(prev => ({ ...prev, isOnline: updatedStatus }));
    setAllUsers(prev =>
      prev.map(u => (u.id === currentUser.id ? { ...u, isOnline: updatedStatus } : u))
    );
    notify(
      'Status Motoboy',
      updatedStatus ? 'Você está ONLINE e apto a receber corridas!' : 'Você está OFFLINE no momento.',
      'admin'
    );
  };

  const updateClientProfile = (profile: Partial<User>) => {
    setCurrentUser(prev => {
      const updated: User = { ...prev, ...profile };
      setAllUsers(all => all.map(u => (u.id === updated.id ? updated : u)));
      return updated;
    });
    notify('Cadastro Atualizado', 'Seus dados e foto foram registrados com sucesso!', 'admin');
  };

  const registerNewUser = (userData: Omit<User, 'id'>): User => {
    const newUser: User = {
      ...userData,
      id: `${userData.role}_${Date.now()}`,
      isRegistered: true,
      rating: userData.role === 'courier' ? (userData.rating || 5.0) : undefined,
      totalDeliveries: userData.role === 'courier' ? 0 : undefined,
      isOnline: userData.role === 'courier' ? true : undefined,
    };

    setAllUsers(prev => [newUser, ...prev]);
    setCurrentUser(newUser);
    setActiveRole(newUser.role);

    notify(
      'Cadastro Realizado com Sucesso!',
      newUser.role === 'courier'
        ? `Bem-vindo(a), ${newUser.name}! Você já está apto a receber pedidos de entrega.`
        : `Bem-vindo(a), ${newUser.name}! Seu cadastro foi concluído e você já pode solicitar corridas.`,
      newUser.role === 'courier' ? 'order' : 'admin'
    );

    return newUser;
  };

  const switchUserAccount = (userId: string) => {
    const target = allUsers.find(u => u.id === userId);
    if (target) {
      setCurrentUser(target);
      setActiveRole(target.role);
      notify('Conta Alterada', `Operando como ${target.name} (${target.role === 'courier' ? 'Motoboy' : target.role === 'client' ? 'Cliente' : 'Admin'})`, 'admin');
    }
  };

  // Create new order by Client
  const createNewOrder = ({
    origin,
    destination,
    packageType,
    packageNotes,
    paymentMethod,
    cashChangeFor,
  }: {
    origin: LocationPoint;
    destination: LocationPoint;
    packageType: Order['packageType'];
    packageNotes?: string;
    paymentMethod: PaymentMethod;
    cashChangeFor?: number;
  }): Order => {
    const dist = calculateDistanceKm(origin.lat, origin.lng, destination.lat, destination.lng);
    // Base fee R$ 8.00 + R$ 2.50 per KM (min R$ 10.00)
    const calculatedPrice = Math.max(10, Math.round((8 + dist * 2.5) * 100) / 100);
    const durationMin = Math.max(5, Math.round(dist * 3 + 4));

    // Courier starting position (near origin for realistic pickup run)
    const courierStartLat = origin.lat + 0.008;
    const courierStartLng = origin.lng - 0.006;

    // Full route coordinates: courier -> origin -> destination
    const toOrigin = generateRoutePoints([courierStartLat, courierStartLng], [origin.lat, origin.lng], 15);
    const toDest = generateRoutePoints([origin.lat, origin.lng], [destination.lat, destination.lng], 25);
    const fullRoute = [...toOrigin, ...toDest.slice(1)];

    // 4-digit security delivery confirmation code (e.g. 8492)
    const deliveryConfirmationCode = Math.floor(1000 + Math.random() * 9000).toString();

    const newOrder: Order = {
      id: 'ord_' + Date.now(),
      code: '#MF-' + Math.floor(1000 + Math.random() * 9000),
      clientId: currentUser.id,
      clientName: currentUser.name,
      clientPhone: currentUser.phone,
      clientAvatar: currentUser.avatar,
      origin,
      destination,
      packageType,
      packageNotes,
      distanceKm: dist,
      durationMin,
      price: calculatedPrice,
      adminFee: ADMIN_CREDENTIALS.feeAmount, // R$ 15.00
      status: 'pending',
      paymentMethod,
      cashChangeFor,
      paymentStatus: 'pending',
      courierAdminFeeStatus: 'pending',
      createdAt: new Date().toISOString(),
      routeCoordinates: fullRoute,
      currentWaypointIndex: 0,
      estimatedArrivalMin: durationMin,
      deliveryConfirmationCode,
      courierLocation: {
        lat: courierStartLat,
        lng: courierStartLng,
        heading: calculateBearing(courierStartLat, courierStartLng, origin.lat, origin.lng),
      },
    };

    setOrders(prev => [newOrder, ...prev]);

    // Play alert sound for new ride
    soundPlayer.playNewOrderAlert();
    notify(
      'Nova Corrida Criada!',
      `Pedido ${newOrder.code} aguardando motoboy aceitar. Valor: R$ ${newOrder.price.toFixed(2)}`,
      'order',
      newOrder.id
    );

    return newOrder;
  };

  // Courier accepts order
  const acceptOrder = (orderId: string) => {
    const courier = allUsers.find(u => u.role === 'courier') || INITIAL_USERS[1];

    setOrders(prev =>
      prev.map(o => {
        if (o.id === orderId) {
          return {
            ...o,
            status: 'accepted',
            courierId: courier.id,
            courierName: courier.name,
            courierPhone: courier.phone,
            courierAvatar: courier.avatar,
            courierRating: courier.rating || 4.9,
            courierVehicle: courier.vehicle || {
              model: 'Honda CG 160 Fan',
              plate: 'RR-8M42',
              color: 'Vermelha',
            },
            acceptedAt: new Date().toISOString(),
          };
        }
        return o;
      })
    );

    notify(
      'Corrida Aceita!',
      `${courier.name} aceitou sua entrega e está a caminho do ponto de coleta!`,
      'order',
      orderId
    );
  };

  // Advance order status manually
  const updateOrderStatus = (orderId: string, status: OrderStatus) => {
    setOrders(prev =>
      prev.map(o => {
        if (o.id === orderId) {
          const isDelivered = status === 'delivered';
          return {
            ...o,
            status,
            paymentStatus: isDelivered ? 'paid_to_courier' : o.paymentStatus,
            completedAt: isDelivered ? new Date().toISOString() : o.completedAt,
            currentWaypointIndex: isDelivered ? o.routeCoordinates.length - 1 : o.currentWaypointIndex,
            estimatedArrivalMin: isDelivered ? 0 : o.estimatedArrivalMin,
          };
        }
        return o;
      })
    );

    if (status === 'delivered') {
      soundPlayer.playSuccessFanfare();
      notify('Entrega Concluída!', 'O motoboy finalizou a entrega com sucesso!', 'order', orderId);
    } else if (status === 'arrived_pickup') {
      notify('Motoboy na Coleta!', 'O entregador chegou ao endereço de retirada do pacote.', 'order', orderId);
    } else if (status === 'in_transit') {
      notify('Pacote em Trânsito!', 'O motoboy coletou o pacote e está a caminho do destino.', 'order', orderId);
    } else if (status === 'arriving') {
      notify('Chegando ao Destino!', 'O motoboy está a menos de 2 minutos do endereço de entrega!', 'order', orderId);
    }
  };

  const confirmDeliveryWithPIN = (orderId: string, pin?: string): boolean => {
    const targetOrder = orders.find(o => o.id === orderId);
    if (!targetOrder) return false;

    if (pin && targetOrder.deliveryConfirmationCode && pin.trim() !== targetOrder.deliveryConfirmationCode) {
      notify('Código Inválido', 'O código de confirmação informado não confere com o código do cliente.', 'order');
      return false;
    }

    updateOrderStatus(orderId, 'delivered');
    return true;
  };

  const cancelOrder = (orderId: string) => {
    setOrders(prev =>
      prev.map(o => (o.id === orderId ? { ...o, status: 'cancelled' } : o))
    );
    notify('Corrida Cancelada', 'O pedido foi cancelado.', 'order', orderId);
  };

  // Advance step in simulation with continuous telemetry broadcasting
  const advanceSimulationStep = (orderId: string) => {
    setOrders(prev =>
      prev.map(o => {
        if (o.id !== orderId || !o.routeCoordinates.length) return o;

        const maxIdx = o.routeCoordinates.length - 1;
        const nextIdx = Math.min(o.currentWaypointIndex + 1, maxIdx);
        const currentCoord = o.routeCoordinates[nextIdx];
        const nextCoord = o.routeCoordinates[Math.min(nextIdx + 1, maxIdx)];

        const heading = calculateBearing(
          currentCoord[0],
          currentCoord[1],
          nextCoord[0],
          nextCoord[1]
        );

        // Calculate progress percentage
        const progressPct = nextIdx / maxIdx;

        // Dynamic status transitions based on route progress
        let nextStatus: OrderStatus = o.status;
        if (progressPct >= 0.25 && o.status === 'accepted') {
          nextStatus = 'arrived_pickup';
        } else if (progressPct >= 0.35 && o.status === 'arrived_pickup') {
          nextStatus = 'in_transit';
        } else if (progressPct >= 0.85 && o.status === 'in_transit') {
          nextStatus = 'arriving';
        } else if (progressPct >= 1.0 && o.status !== 'delivered') {
          nextStatus = 'delivered';
        }

        // Target: If not reached pickup yet, distance is to origin, else to destination
        const targetCoord = progressPct < 0.3 ? [o.origin.lat, o.origin.lng] : [o.destination.lat, o.destination.lng];
        const remainingKm = calculateDistanceKm(
          currentCoord[0],
          currentCoord[1],
          targetCoord[0],
          targetCoord[1]
        );
        const remainingMeters = Math.round(remainingKm * 1000);

        // Realistic urban motorcycle speed between 32 and 46 km/h
        const baseSpeed = 36 + Math.sin(nextIdx * 0.4) * 8;
        const speedKmH = Math.max(15, Math.round(baseSpeed));
        const estimatedArrivalSeconds = Math.max(5, Math.round((remainingKm / speedKmH) * 3600));
        const remainingMin = Math.ceil(estimatedArrivalSeconds / 60);

        // Emit real-time telemetry packet over socket stream / BroadcastChannel
        const telemetryPacket: CourierTelemetryPacket = {
          orderId: o.id,
          courierId: o.courierId || 'courier_1',
          lat: currentCoord[0],
          lng: currentCoord[1],
          heading: heading || 0,
          speedKmH: nextStatus === 'delivered' ? 0 : speedKmH,
          remainingDistanceMeters: nextStatus === 'delivered' ? 0 : remainingMeters,
          estimatedArrivalSeconds: nextStatus === 'delivered' ? 0 : estimatedArrivalSeconds,
          currentWaypointIndex: nextIdx,
          progressPercent: Math.round(progressPct * 100),
          timestamp: Date.now(),
        };

        realtimeTracker.emitCourierLocation(telemetryPacket);

        return {
          ...o,
          currentWaypointIndex: nextIdx,
          status: nextStatus,
          estimatedArrivalMin: nextStatus === 'delivered' ? 0 : remainingMin,
          courierLocation: {
            lat: currentCoord[0],
            lng: currentCoord[1],
            heading: heading || 0,
            speedKmH: nextStatus === 'delivered' ? 0 : speedKmH,
            remainingDistanceMeters: nextStatus === 'delivered' ? 0 : remainingMeters,
            estimatedArrivalSeconds: nextStatus === 'delivered' ? 0 : estimatedArrivalSeconds,
          },
          completedAt: nextStatus === 'delivered' ? (o.completedAt || new Date().toISOString()) : o.completedAt,
          paymentStatus: nextStatus === 'delivered' ? 'paid_to_courier' : o.paymentStatus,
        };
      })
    );
  };

  // Jump order to state for testing convenience
  const jumpToOrderStatus = (orderId: string, targetStatus: OrderStatus) => {
    setOrders(prev =>
      prev.map(o => {
        if (o.id !== orderId) return o;
        const total = o.routeCoordinates.length;
        let index = 0;
        if (targetStatus === 'arrived_pickup') index = Math.floor(total * 0.25);
        if (targetStatus === 'in_transit') index = Math.floor(total * 0.4);
        if (targetStatus === 'arriving') index = Math.floor(total * 0.85);
        if (targetStatus === 'delivered') index = total - 1;

        const coord = o.routeCoordinates[index] || [o.origin.lat, o.origin.lng];
        return {
          ...o,
          status: targetStatus,
          currentWaypointIndex: index,
          estimatedArrivalMin: targetStatus === 'delivered' ? 0 : 4,
          courierLocation: {
            lat: coord[0],
            lng: coord[1],
            heading: 0,
            speedKmH: targetStatus === 'delivered' ? 0 : 38,
            remainingDistanceMeters: targetStatus === 'delivered' ? 0 : 800,
            estimatedArrivalSeconds: targetStatus === 'delivered' ? 0 : 240,
          },
          completedAt: targetStatus === 'delivered' ? new Date().toISOString() : o.completedAt,
        };
      })
    );
  };

  // Continuous High-Cadence GPS Simulation Loop
  useEffect(() => {
    if (!isSimulating || !activeOrder || activeOrder.status === 'pending' || activeOrder.status === 'delivered') {
      return;
    }

    // High cadence interval for continuous streaming (e.g. 500ms at 2x, 250ms at 4x)
    const intervalMs = Math.max(180, Math.floor(900 / simulationSpeed));

    const timer = setInterval(() => {
      advanceSimulationStep(activeOrder.id);
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isSimulating, activeOrder, simulationSpeed]);

  // Real GPS tracking using navigator.geolocation
  useEffect(() => {
    if (!useRealGps || typeof window === 'undefined' || !navigator.geolocation || !activeOrder) {
      setRealGpsActive(false);
      return;
    }

    setRealGpsActive(true);
    const watchId = navigator.geolocation.watchPosition(
      pos => {
        const { latitude, longitude, heading } = pos.coords;
        const speedKmH = pos.coords.speed ? Math.round(pos.coords.speed * 3.6) : 35;
        const remainingKm = calculateDistanceKm(
          latitude,
          longitude,
          activeOrder.destination.lat,
          activeOrder.destination.lng
        );
        const remainingMeters = Math.round(remainingKm * 1000);
        const estimatedSeconds = Math.max(10, Math.round((remainingKm / (speedKmH || 35)) * 3600));

        // Emit real GPS location to socket subscribers
        const packet: CourierTelemetryPacket = {
          orderId: activeOrder.id,
          courierId: activeOrder.courierId || 'courier_1',
          lat: latitude,
          lng: longitude,
          heading: heading || activeOrder.courierLocation?.heading || 0,
          speedKmH,
          remainingDistanceMeters: remainingMeters,
          estimatedArrivalSeconds: estimatedSeconds,
          currentWaypointIndex: activeOrder.currentWaypointIndex,
          progressPercent: 50,
          timestamp: Date.now(),
        };

        realtimeTracker.emitCourierLocation(packet);

        setOrders(prev =>
          prev.map(o => {
            if (o.id === activeOrder.id) {
              return {
                ...o,
                courierLocation: {
                  lat: latitude,
                  lng: longitude,
                  heading: heading || o.courierLocation?.heading || 0,
                  speedKmH,
                  remainingDistanceMeters: remainingMeters,
                  estimatedArrivalSeconds: estimatedSeconds,
                },
              };
            }
            return o;
          })
        );
      },
      err => {
        console.warn('Geolocation error:', err);
        setRealGpsActive(false);
      },
      { enableHighAccuracy: true, maximumAge: 1000 }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
      setRealGpsActive(false);
    };
  }, [useRealGps, activeOrder]);

  // Chat message sending
  const sendChatMessage = (orderId: string, text: string, isQuickMsg = false) => {
    const newMsg: ChatMessage = {
      id: 'msg_' + Date.now(),
      orderId,
      senderId: currentUser.id,
      senderRole: activeRole,
      senderName: currentUser.name,
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      isQuickMsg,
    };

    setChatMessages(prev => [...prev, newMsg]);
    soundPlayer.playMessagePing();

    // Auto simulated reply from other party if needed
    if (activeRole === 'client') {
      setTimeout(() => {
        const replyMsg: ChatMessage = {
          id: 'msg_reply_' + Date.now(),
          orderId,
          senderId: 'courier_1',
          senderRole: 'courier',
          senderName: activeOrder?.courierName || 'Marcos "Flash" Silva',
          text: 'Recebido! Estou focado no trânsito e cuidando bem da sua entrega.',
          timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        };
        setChatMessages(prev => [...prev, replyMsg]);
        soundPlayer.playMessagePing();
        notify(replyMsg.senderName, replyMsg.text, 'chat', orderId);
      }, 3500);
    } else if (activeRole === 'courier') {
      setTimeout(() => {
        const replyMsg: ChatMessage = {
          id: 'msg_reply_' + Date.now(),
          orderId,
          senderId: 'client_1',
          senderRole: 'client',
          senderName: activeOrder?.clientName || 'Juliana Costa',
          text: 'Perfeito, muito obrigado! Já estou aguardando.',
          timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        };
        setChatMessages(prev => [...prev, replyMsg]);
        soundPlayer.playMessagePing();
        notify(replyMsg.senderName, replyMsg.text, 'chat', orderId);
      }, 3500);
    }
  };

  // Submit Rating & Review
  const submitRating = (orderId: string, rating: OrderRating) => {
    setOrders(prev =>
      prev.map(o => (o.id === orderId ? { ...o, rating } : o))
    );

    // Update courier average score
    const targetOrder = orders.find(o => o.id === orderId);
    if (targetOrder?.courierId) {
      setAllUsers(prev =>
        prev.map(u => {
          if (u.id === targetOrder.courierId) {
            const currentRating = u.rating || 4.9;
            const totalCount = u.totalDeliveries || 10;
            const newAvg = (currentRating * totalCount + rating.stars) / (totalCount + 1);
            return {
              ...u,
              rating: Math.round(newAvg * 100) / 100,
              totalDeliveries: totalCount + 1,
            };
          }
          return u;
        })
      );
    }

    notify(
      'Avaliação Enviada!',
      `Obrigado por avaliar com ${rating.stars} estrelas! Sua opinião é fundamental.`,
      'order',
      orderId
    );
  };

  // Courier pays R$ 15 admin fee via Pix
  const payAdminFee = (orderId: string, receiptNote?: string) => {
    setOrders(prev =>
      prev.map(o => {
        if (o.id === orderId) {
          return {
            ...o,
            courierAdminFeeStatus: 'paid',
            courierAdminFeeReceipt: receiptNote || `Comprovante Pix R$ 15,00 chave ${ADMIN_CREDENTIALS.pixKey} enviado em ${new Date().toLocaleTimeString()}`,
          };
        }
        return o;
      })
    );

    notify(
      'Taxa R$ 15,00 Registrada!',
      `Comprovante enviado para o Admin (${ADMIN_CREDENTIALS.pixKey}). Aguardando verificação no painel.`,
      'payment',
      orderId
    );
  };

  // Admin approves courier fee payment
  const adminVerifyFee = (orderId: string) => {
    setOrders(prev =>
      prev.map(o => (o.id === orderId ? { ...o, courierAdminFeeStatus: 'verified_by_admin' } : o))
    );
    notify(
      'Taxa Aprovada pelo Admin!',
      'O pagamento da taxa de R$ 15,00 foi confirmado com sucesso.',
      'admin',
      orderId
    );
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        allUsers,
        orders,
        activeOrder,
        activeRole,
        chatMessages,
        notifications,
        activeToast,
        soundEnabled,
        isSimulating,
        simulationSpeed,
        useRealGps,
        realGpsActive,
        liveTelemetry,
        socketConnected,
        switchRole,
        loginAsAdmin,
        loginWithGoogle,
        toggleCourierOnline,
        toggleSound,
        dismissToast,
        updateClientProfile,
        registerNewUser,
        switchUserAccount,
        setSimulationSpeed,
        setUseRealGps,
        setIsSimulating,
        createNewOrder,
        acceptOrder,
        updateOrderStatus,
        confirmDeliveryWithPIN,
        cancelOrder,
        advanceSimulationStep,
        jumpToOrderStatus,
        sendChatMessage,
        submitRating,
        payAdminFee,
        adminVerifyFee,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
