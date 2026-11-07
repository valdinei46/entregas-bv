import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { UserRole } from './types';
import { Navbar } from './components/Navbar';
import { ClientDashboard } from './components/client/ClientDashboard';
import { ClientActiveOrderView } from './components/client/ClientActiveOrderView';
import { ClientNewOrderModal } from './components/client/ClientNewOrderModal';
import { CourierDashboard } from './components/courier/CourierDashboard';
import { CourierFeeModal } from './components/courier/CourierFeeModal';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { AdminLoginModal } from './components/admin/AdminLoginModal';
import { ChatModal } from './components/shared/ChatModal';
import { RatingModal } from './components/shared/RatingModal';
import { OrderHistoryModal } from './components/shared/OrderHistoryModal';
import { NotificationsModal } from './components/shared/NotificationsModal';
import { NotificationToast } from './components/shared/NotificationToast';
import { RegisterModal } from './components/auth/RegisterModal';

const MainAppContent: React.FC = () => {
  const { activeRole, activeOrder, orders, currentUser } = useApp();

  // Modals state
  const [isNewOrderOpen, setIsNewOrderOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isRatingOpen, setIsRatingOpen] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [registerRole, setRegisterRole] = useState<UserRole>('client');
  const [feeModalOrderId, setFeeModalOrderId] = useState<string | null>(null);

  // Target order for chat/rating/fees
  const chatOrder = activeOrder || orders.find(o => o.status === 'delivered') || orders[0] || null;

  const handleStartOrder = () => {
    // If client hasn't registered or has no photo, open registration first
    if (!currentUser.isRegistered && !currentUser.avatar) {
      setRegisterRole('client');
      setIsRegisterOpen(true);
    } else {
      setIsNewOrderOpen(true);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 font-sans antialiased selection:bg-orange-500 selection:text-white flex flex-col">
      {/* Top Navbar */}
      <Navbar
        onOpenHistory={() => setIsHistoryOpen(true)}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        onOpenAdminLogin={() => setIsAdminLoginOpen(true)}
        onOpenProfile={() => {
          setRegisterRole(activeRole);
          setIsRegisterOpen(true);
        }}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-6">
        {activeRole === 'client' && (
          <>
            {activeOrder ? (
              <ClientActiveOrderView
                order={activeOrder}
                onOpenChat={() => setIsChatOpen(true)}
                onOpenRating={() => setIsRatingOpen(true)}
              />
            ) : (
              <ClientDashboard
                onOpenNewOrder={handleStartOrder}
                onOpenHistory={() => setIsHistoryOpen(true)}
                onOpenRegister={() => {
                  setRegisterRole('client');
                  setIsRegisterOpen(true);
                }}
              />
            )}
          </>
        )}

        {activeRole === 'courier' && (
          <CourierDashboard
            onOpenChat={() => setIsChatOpen(true)}
            onOpenFeeModal={(orderId) => setFeeModalOrderId(orderId)}
            onOpenRegister={() => {
              setRegisterRole('courier');
              setIsRegisterOpen(true);
            }}
          />
        )}

        {activeRole === 'admin' && <AdminDashboard />}
      </main>

      {/* Floating Push Notification Toast */}
      <NotificationToast />

      {/* Floating Action Button for Client when no active order */}
      {activeRole === 'client' && !activeOrder && (
        <div className="fixed bottom-6 right-6 z-30">
          <button
            onClick={handleStartOrder}
            className="px-5 py-3.5 bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-700 hover:to-amber-600 text-white font-extrabold text-sm rounded-full shadow-2xl shadow-orange-500/40 flex items-center gap-2 transition-all hover:scale-105 active:scale-95"
          >
            <span className="text-lg">🛵</span>
            <span>Chamar Motoboy</span>
          </button>
        </div>
      )}

      {/* Cadastro de Novo Cliente ou Novo Motoboy com Foto */}
      <RegisterModal
        isOpen={isRegisterOpen}
        defaultRole={registerRole}
        onClose={() => setIsRegisterOpen(false)}
        onSuccess={() => {
          if (registerRole === 'client') {
            setIsNewOrderOpen(true);
          }
        }}
      />

      {/* All Application Modals */}
      <ClientNewOrderModal
        isOpen={isNewOrderOpen}
        onClose={() => setIsNewOrderOpen(false)}
        onOpenRegister={() => setIsRegisterOpen(true)}
      />

      <ChatModal
        order={chatOrder}
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
      />

      <RatingModal
        order={chatOrder}
        isOpen={isRatingOpen}
        onClose={() => setIsRatingOpen(false)}
      />

      <CourierFeeModal
        orderId={feeModalOrderId}
        isOpen={!!feeModalOrderId}
        onClose={() => setFeeModalOrderId(null)}
      />

      <AdminLoginModal
        isOpen={isAdminLoginOpen}
        onClose={() => setIsAdminLoginOpen(false)}
      />

      <OrderHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
      />

      <NotificationsModal
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainAppContent />
    </AppProvider>
  );
}
