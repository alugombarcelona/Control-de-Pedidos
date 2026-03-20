/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc, serverTimestamp, orderBy } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from './firebase';
import { format, differenceInDays } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { LogOut, Plus, CheckCircle, Clock, Package, BarChart3, User as UserIcon, Activity, ChevronRight } from 'lucide-react';

interface Order {
  id: string;
  orderNumber: string;
  color: string;
  client: string;
  creationDate: string;
  entryDate?: string;
  status: 'pending' | 'entered';
  userId: string;
  createdAt: number;
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!isAuthReady) return;
    if (!user) {
      setOrders([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'orders'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersData: Order[] = [];
      snapshot.forEach((doc) => {
        ordersData.push({ id: doc.id, ...doc.data() } as Order);
      });
      setOrders(ordersData);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'orders');
    });

    return () => unsubscribe();
  }, [user, isAuthReady]);

  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    if (usernameInput === 'ABARCELONA' && passwordInput === 'Mogula129699') {
      const email = 'abarcelona@controlpedidos.com';
      try {
        try {
          await signInWithEmailAndPassword(auth, email, passwordInput);
        } catch (err: any) {
          if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential' || err.code === 'auth/invalid-login-credentials') {
            try {
              await createUserWithEmailAndPassword(auth, email, passwordInput);
            } catch (createErr: any) {
              if (createErr.code === 'auth/operation-not-allowed') {
                setLoginError('Debes habilitar el proveedor de "Correo/Contraseña" en Firebase Console.');
              } else {
                setLoginError('Error al crear usuario: ' + createErr.message);
              }
            }
          } else if (err.code === 'auth/operation-not-allowed') {
            setLoginError('Debes habilitar el proveedor de "Correo/Contraseña" en Firebase Console.');
          } else {
            setLoginError('Error de autenticación: ' + err.message);
          }
        }
      } catch (error: any) {
        setLoginError('Error: ' + error.message);
      }
    } else {
      setLoginError('Usuario o contraseña incorrectos.');
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout failed', error);
    }
  };

  if (!isAuthReady || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-dark">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neon-accent"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-bg-dark p-4 relative overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-neon-accent/10 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[120px] pointer-events-none"></div>
        
        <div className="max-w-md w-full glass-panel rounded-2xl p-8 text-center relative z-10 border border-white/10 shadow-2xl">
          <div className="w-16 h-16 bg-black/50 border border-white/10 text-neon-accent rounded-2xl flex items-center justify-center mx-auto mb-6 neon-glow">
            <Package size={32} />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Control de <span className="text-neon-accent neon-text">Pedidos</span></h1>
          <p className="text-gray-400 mb-8 text-sm">Acceso seguro al sistema de gestión de almacén.</p>
          
          <form onSubmit={handleLogin} className="space-y-5 text-left">
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Usuario</label>
              <input
                type="text"
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-xl focus:ring-1 focus:ring-neon-accent focus:border-neon-accent outline-none transition-all text-white placeholder-gray-600 font-mono text-sm"
                placeholder="Ingresa tu usuario"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Contraseña</label>
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-xl focus:ring-1 focus:ring-neon-accent focus:border-neon-accent outline-none transition-all text-white placeholder-gray-600 font-mono text-sm"
                placeholder="••••••••••••"
              />
            </div>
            {loginError && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                <p className="text-red-400 text-sm font-medium">{loginError}</p>
              </div>
            )}
            <button
              type="submit"
              className="w-full bg-neon-accent text-black font-bold py-3 px-4 rounded-xl hover:bg-neon-accent-hover transition-all flex items-center justify-center gap-2 mt-6 shadow-[0_0_20px_rgba(0,255,204,0.3)] hover:shadow-[0_0_30px_rgba(0,255,204,0.5)]"
            >
              <UserIcon size={18} />
              AUTENTICAR
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-dark text-white font-sans selection:bg-neon-accent selection:text-black">
      <header className="glass-panel sticky top-0 z-50 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-neon-accent/10 border border-neon-accent/30 rounded-lg flex items-center justify-center text-neon-accent">
              <Activity size={18} />
            </div>
            <span className="font-bold text-lg tracking-tight">
              CONTROL<span className="text-neon-accent">PEDIDOS</span>
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-full">
              <div className="w-2 h-2 rounded-full bg-neon-accent neon-glow"></div>
              <span className="text-xs font-mono text-gray-300">{usernameInput || 'ABARCELONA'}</span>
            </div>
            <button
              onClick={handleLogout}
              className="text-gray-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/5 border border-transparent hover:border-white/10"
              title="Cerrar sesión"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4 space-y-8">
            <OrderForm user={user} />
            <Statistics orders={orders} />
          </div>
          <div className="lg:col-span-8">
            <OrderList orders={orders} />
          </div>
        </div>
      </main>
    </div>
  );
}

function OrderForm({ user }: { user: User }) {
  const [orderNumber, setOrderNumber] = useState('');
  const [color, setColor] = useState('');
  const [client, setClient] = useState('');
  const [creationDate, setCreationDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderNumber || !color || !client || !creationDate) return;

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'orders'), {
        orderNumber,
        color,
        client,
        creationDate,
        status: 'pending',
        userId: user.uid,
        createdAt: Date.now()
      });
      setOrderNumber('');
      setColor('');
      setClient('');
      setCreationDate(format(new Date(), 'yyyy-MM-dd'));
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'orders');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="glass-panel rounded-2xl p-6 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-neon-accent/5 rounded-full blur-3xl pointer-events-none"></div>
      
      <h2 className="text-sm font-bold uppercase tracking-widest text-gray-300 mb-6 flex items-center gap-2">
        <Plus size={16} className="text-neon-accent" />
        Nuevo Registro
      </h2>
      <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">ID Pedido</label>
          <input
            type="text"
            required
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value)}
            className="w-full px-4 py-2.5 bg-black/40 border border-white/10 rounded-xl focus:ring-1 focus:ring-neon-accent focus:border-neon-accent outline-none transition-all text-white placeholder-gray-700 font-mono text-sm"
            placeholder="PED-1001"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Color</label>
            <input
              type="text"
              required
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-full px-4 py-2.5 bg-black/40 border border-white/10 rounded-xl focus:ring-1 focus:ring-neon-accent focus:border-neon-accent outline-none transition-all text-white placeholder-gray-700 text-sm"
              placeholder="Rojo"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Fecha</label>
            <input
              type="date"
              required
              value={creationDate}
              onChange={(e) => setCreationDate(e.target.value)}
              className="w-full px-4 py-2.5 bg-black/40 border border-white/10 rounded-xl focus:ring-1 focus:ring-neon-accent focus:border-neon-accent outline-none transition-all text-white text-sm font-mono [&::-webkit-calendar-picker-indicator]:filter-[invert(1)]"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Cliente</label>
          <input
            type="text"
            required
            value={client}
            onChange={(e) => setClient(e.target.value)}
            className="w-full px-4 py-2.5 bg-black/40 border border-white/10 rounded-xl focus:ring-1 focus:ring-neon-accent focus:border-neon-accent outline-none transition-all text-white placeholder-gray-700 text-sm"
            placeholder="Empresa S.A."
          />
        </div>
        
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-white/5 hover:bg-white/10 border border-white/10 hover:border-neon-accent/50 text-white font-medium py-3 px-4 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 group"
        >
          {isSubmitting ? (
            <span className="font-mono text-sm">PROCESANDO...</span>
          ) : (
            <>
              <span className="font-mono text-sm tracking-widest">REGISTRAR</span>
              <ChevronRight size={16} className="text-neon-accent group-hover:translate-x-1 transition-transform" />
            </>
          )}
        </button>
      </form>
    </div>
  );
}

function OrderList({ orders }: { orders: Order[] }) {
  const pendingOrders = orders.filter(o => o.status === 'pending');
  const enteredOrders = orders.filter(o => o.status === 'entered');

  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [confirmDate, setConfirmDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  const openConfirmModal = (orderId: string) => {
    setSelectedOrderId(orderId);
    setConfirmDate(format(new Date(), 'yyyy-MM-dd'));
    setConfirmModalOpen(true);
  };

  const executeConfirmEntry = async () => {
    if (!selectedOrderId) return;
    try {
      const orderRef = doc(db, 'orders', selectedOrderId);
      await updateDoc(orderRef, {
        status: 'entered',
        entryDate: confirmDate
      });
      setConfirmModalOpen(false);
      setSelectedOrderId(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `orders/${selectedOrderId}`);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold uppercase tracking-widest text-gray-300 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></div>
            Pendientes
          </h2>
          <span className="bg-amber-500/10 text-amber-500 border border-amber-500/20 px-2 py-0.5 rounded text-xs font-mono">
            {pendingOrders.length}
          </span>
        </div>
        
        {pendingOrders.length === 0 ? (
          <div className="glass-panel border-dashed border-white/20 p-8 text-center text-gray-500 rounded-2xl font-mono text-sm">
            NO HAY PEDIDOS PENDIENTES
          </div>
        ) : (
          <div className="glass-panel rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-black/40 text-gray-400 font-mono text-xs uppercase tracking-wider border-b border-white/10">
                  <tr>
                    <th className="px-5 py-4">ID</th>
                    <th className="px-5 py-4">Cliente</th>
                    <th className="px-5 py-4">Color</th>
                    <th className="px-5 py-4">Creación</th>
                    <th className="px-5 py-4 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {pendingOrders.map(order => (
                    <tr key={order.id} className="hover:bg-white/5 transition-colors group">
                      <td className="px-5 py-4 font-mono text-white">{order.orderNumber}</td>
                      <td className="px-5 py-4 text-gray-300">{order.client}</td>
                      <td className="px-5 py-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-xs font-medium text-gray-300">
                          {order.color}
                        </span>
                      </td>
                      <td className="px-5 py-4 font-mono text-gray-400 text-xs">{order.creationDate}</td>
                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() => openConfirmModal(order.id)}
                          className="inline-flex items-center gap-1.5 bg-neon-accent/10 text-neon-accent border border-neon-accent/30 hover:bg-neon-accent hover:text-black px-3 py-1.5 rounded-lg text-xs font-bold tracking-wider transition-all"
                        >
                          <CheckCircle size={14} />
                          CONFIRMAR
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold uppercase tracking-widest text-gray-300 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-neon-accent neon-glow"></div>
            En Almacén
          </h2>
          <span className="bg-neon-accent/10 text-neon-accent border border-neon-accent/20 px-2 py-0.5 rounded text-xs font-mono">
            {enteredOrders.length}
          </span>
        </div>
        
        {enteredOrders.length === 0 ? (
          <div className="glass-panel border-dashed border-white/20 p-8 text-center text-gray-500 rounded-2xl font-mono text-sm">
            NO HAY REGISTROS
          </div>
        ) : (
          <div className="glass-panel rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-black/40 text-gray-400 font-mono text-xs uppercase tracking-wider border-b border-white/10">
                  <tr>
                    <th className="px-5 py-4">ID</th>
                    <th className="px-5 py-4">Cliente</th>
                    <th className="px-5 py-4">Color</th>
                    <th className="px-5 py-4">Entrada</th>
                    <th className="px-5 py-4 text-right">Tiempo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {enteredOrders.map(order => {
                    const days = differenceInDays(new Date(order.entryDate!), new Date(order.creationDate));
                    return (
                      <tr key={order.id} className="hover:bg-white/5 transition-colors">
                        <td className="px-5 py-4 font-mono text-white">{order.orderNumber}</td>
                        <td className="px-5 py-4 text-gray-300">{order.client}</td>
                        <td className="px-5 py-4">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-xs font-medium text-gray-300">
                            {order.color}
                          </span>
                        </td>
                        <td className="px-5 py-4 font-mono text-gray-400 text-xs">{order.entryDate}</td>
                        <td className="px-5 py-4 text-right">
                          <span className="inline-flex items-center px-2 py-1 bg-black/50 border border-white/10 rounded font-mono text-neon-accent text-xs">
                            {days}D
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {confirmModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="glass-panel rounded-2xl p-6 max-w-sm w-full border border-neon-accent/30 shadow-[0_0_30px_rgba(0,255,204,0.15)]">
            <h3 className="text-lg font-bold text-white mb-4">Confirmar Entrada</h3>
            <p className="text-sm text-gray-400 mb-4">Selecciona la fecha de entrada al almacén.</p>
            <input
              type="date"
              value={confirmDate}
              onChange={(e) => setConfirmDate(e.target.value)}
              className="w-full px-4 py-2.5 bg-black/60 border border-white/10 rounded-xl focus:ring-1 focus:ring-neon-accent focus:border-neon-accent outline-none transition-all text-white text-sm font-mono mb-6 [&::-webkit-calendar-picker-indicator]:filter-[invert(1)]"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmModalOpen(false)}
                className="flex-1 py-2.5 px-4 rounded-xl border border-white/10 text-gray-300 hover:bg-white/5 transition-colors text-sm font-bold"
              >
                CANCELAR
              </button>
              <button
                onClick={executeConfirmEntry}
                className="flex-1 py-2.5 px-4 rounded-xl bg-neon-accent text-black hover:bg-neon-accent-hover transition-colors text-sm font-bold shadow-[0_0_15px_rgba(0,255,204,0.3)]"
              >
                GUARDAR
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Statistics({ orders }: { orders: Order[] }) {
  const enteredOrders = orders.filter(o => o.status === 'entered' && o.entryDate);

  // Calculate average days per color
  let totalDaysAll = 0;
  const statsByColor = enteredOrders.reduce((acc, order) => {
    const days = differenceInDays(new Date(order.entryDate!), new Date(order.creationDate));
    totalDaysAll += days;
    const color = order.color.toLowerCase().trim();
    
    if (!acc[color]) {
      acc[color] = { color: order.color, totalDays: 0, count: 0 };
    }
    acc[color].totalDays += days;
    acc[color].count += 1;
    return acc;
  }, {} as Record<string, { color: string, totalDays: number, count: number }>);

  const chartData = Object.values(statsByColor).map(stat => ({
    name: stat.color.toUpperCase(),
    Promedio: Number((stat.totalDays / stat.count).toFixed(1))
  })).sort((a, b) => b.Promedio - a.Promedio);

  const overallAverage = enteredOrders.length > 0 ? (totalDaysAll / enteredOrders.length).toFixed(1) : '0';
  const completionRate = orders.length > 0 ? Math.round((enteredOrders.length / orders.length) * 100) : 0;
  const fastestColor = chartData.length > 0 ? chartData[chartData.length - 1].name : '-';

  return (
    <div className="glass-panel rounded-2xl p-6 relative overflow-hidden">
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/5 rounded-full blur-3xl pointer-events-none"></div>
      
      <h2 className="text-sm font-bold uppercase tracking-widest text-gray-300 mb-6 flex items-center gap-2">
        <BarChart3 size={16} className="text-purple-400" />
        Métricas
      </h2>
      
      {orders.length === 0 ? (
        <div className="h-48 flex items-center justify-center border border-dashed border-white/10 rounded-xl">
          <p className="text-xs font-mono text-gray-600">DATOS INSUFICIENTES</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-black/40 border border-white/5 rounded-xl p-3">
              <p className="text-[10px] font-mono text-gray-500 mb-1">TOTAL ENTRADAS</p>
              <p className="text-xl font-mono text-white">{enteredOrders.length}</p>
            </div>
            <div className="bg-black/40 border border-white/5 rounded-xl p-3">
              <p className="text-[10px] font-mono text-gray-500 mb-1">TASA COMPLETADO</p>
              <p className="text-xl font-mono text-neon-accent">{completionRate}%</p>
            </div>
            <div className="bg-black/40 border border-white/5 rounded-xl p-3">
              <p className="text-[10px] font-mono text-gray-500 mb-1">PROMEDIO GLOBAL</p>
              <p className="text-xl font-mono text-white">{overallAverage} <span className="text-xs text-gray-500">días</span></p>
            </div>
            <div className="bg-black/40 border border-white/5 rounded-xl p-3">
              <p className="text-[10px] font-mono text-gray-500 mb-1">COLOR MÁS RÁPIDO</p>
              <p className="text-sm font-mono text-purple-400 mt-1 truncate" title={fastestColor}>{fastestColor}</p>
            </div>
          </div>
          
          {chartData.length > 0 && (
            <div>
              <p className="text-xs font-mono text-gray-500 mb-4">TIEMPO PROMEDIO (DÍAS)</p>
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 10, fill: '#9ca3af', fontFamily: 'JetBrains Mono' }} 
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 10, fill: '#9ca3af', fontFamily: 'JetBrains Mono' }} 
                    />
                    <Tooltip 
                      cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                      contentStyle={{ 
                        backgroundColor: 'rgba(17,17,17,0.9)', 
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '8px',
                        fontFamily: 'JetBrains Mono',
                        fontSize: '12px',
                        color: '#fff'
                      }}
                      itemStyle={{ color: '#00ffcc' }}
                    />
                    <Bar dataKey="Promedio" fill="#00ffcc" radius={[2, 2, 0, 0]} maxBarSize={30} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

