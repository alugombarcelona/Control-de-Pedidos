/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useMemo } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc, deleteDoc, serverTimestamp, orderBy } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from './firebase';
import { format, differenceInDays } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { LogOut, Plus, CheckCircle, Clock, Package, BarChart3, User as UserIcon, Activity, ChevronRight, FileDown, Search, Filter, Edit2, Trash2, Inbox, PackageOpen, ChevronLeft, X } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Order {
  id: string;
  orderNumber: string;
  color: string;
  client: string;
  jobType: string;
  creationDate: string;
  entryDate?: string;
  status: 'pending' | 'entered';
  userId: string;
  createdAt: number;
  notes?: string;
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
      <Toaster position="top-right" toastOptions={{
        style: {
          background: '#111',
          color: '#fff',
          border: '1px solid rgba(255,255,255,0.1)',
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: '14px'
        }
      }} />
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
            <OrderForm user={user} orders={orders} />
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

function OrderForm({ user, orders }: { user: User, orders: Order[] }) {
  const [orderNumber, setOrderNumber] = useState('');
  const [color, setColor] = useState('');
  const [client, setClient] = useState('');
  const [jobType, setJobType] = useState('Lacado Estándar');
  const [creationDate, setCreationDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isDuplicate = useMemo(() => {
    if (!orderNumber.trim()) return false;
    return orders.some(
      (o) => o.orderNumber.toLowerCase() === orderNumber.toLowerCase().trim()
    );
  }, [orderNumber, orders]);

  const handleOrderNumberBlur = () => {
    if (isDuplicate) {
      toast.error(`El pedido ${orderNumber} ya existe.`, {
        style: {
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.5)',
          color: '#f87171',
        },
        iconTheme: {
          primary: '#ef4444',
          secondary: '#fff',
        }
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderNumber || !color || !client || !creationDate) return;

    if (isDuplicate) {
      toast.error(`El pedido ${orderNumber} ya existe.`, {
        style: {
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.5)',
          color: '#f87171',
        },
        iconTheme: {
          primary: '#ef4444',
          secondary: '#fff',
        }
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'orders'), {
        orderNumber,
        color,
        client,
        jobType,
        creationDate,
        notes,
        status: 'pending',
        userId: user.uid,
        createdAt: Date.now()
      });
      setOrderNumber('');
      setColor('');
      setClient('');
      setJobType('Lacado Estándar');
      setNotes('');
      setCreationDate(format(new Date(), 'yyyy-MM-dd'));
      toast.success('Pedido añadido correctamente');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'orders');
      toast.error('Error al añadir el pedido');
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
            onBlur={handleOrderNumberBlur}
            className={`w-full px-4 py-2.5 bg-black/40 border ${isDuplicate ? 'border-red-500/50 focus:ring-red-500 focus:border-red-500' : 'border-white/10 focus:ring-neon-accent focus:border-neon-accent'} rounded-xl outline-none transition-all text-white placeholder-gray-700 font-mono text-sm`}
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
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Trabajo</label>
          <select
            value={jobType}
            onChange={(e) => setJobType(e.target.value)}
            className="w-full px-4 py-2.5 bg-black/40 border border-white/10 rounded-xl focus:ring-1 focus:ring-neon-accent focus:border-neon-accent outline-none transition-all text-white text-sm appearance-none"
          >
            <option value="Lacado Estándar">Lacado Estándar</option>
            <option value="Lacado Especial">Lacado Especial</option>
            <option value="Metalizado">Metalizado</option>
            <option value="Anodizado">Anodizado</option>
            <option value="Madera">Madera</option>
            <option value="Bicolor">Bicolor</option>
            <option value="Otro">Otro</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Notas / Incidencias</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-4 py-2.5 bg-black/40 border border-white/10 rounded-xl focus:ring-1 focus:ring-neon-accent focus:border-neon-accent outline-none transition-all text-white placeholder-gray-700 text-sm resize-none h-24"
            placeholder="Información adicional..."
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
  const [searchTerm, setSearchTerm] = useState('');
  const [filterColor, setFilterColor] = useState('');
  const [filterJobType, setFilterJobType] = useState('');
  
  const [currentPagePending, setCurrentPagePending] = useState(1);
  const [currentPageEntered, setCurrentPageEntered] = useState(1);
  const itemsPerPage = 10;

  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [confirmDate, setConfirmDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [confirmNotes, setConfirmNotes] = useState('');

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingOrderId, setDeletingOrderId] = useState<string | null>(null);

  // Derived unique colors for filter
  const uniqueColors = useMemo(() => {
    const colors = new Set(orders.map(o => o.color.toLowerCase().trim()));
    return Array.from(colors).sort();
  }, [orders]);

  // Derived unique job types for filter
  const uniqueJobTypes = useMemo(() => {
    const types = new Set(orders.map(o => o.jobType).filter(Boolean));
    return Array.from(types).sort();
  }, [orders]);

  // Filtered orders
  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      const matchesSearch = o.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            o.client.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesColor = filterColor ? o.color.toLowerCase().trim() === filterColor : true;
      const matchesJobType = filterJobType ? o.jobType === filterJobType : true;
      return matchesSearch && matchesColor && matchesJobType;
    });
  }, [orders, searchTerm, filterColor, filterJobType]);

  const pendingOrders = filteredOrders.filter(o => o.status === 'pending');
  const enteredOrders = filteredOrders.filter(o => o.status === 'entered');

  // Pagination logic
  const paginatedPending = pendingOrders.slice((currentPagePending - 1) * itemsPerPage, currentPagePending * itemsPerPage);
  const totalPagesPending = Math.ceil(pendingOrders.length / itemsPerPage);

  const paginatedEntered = enteredOrders.slice((currentPageEntered - 1) * itemsPerPage, currentPageEntered * itemsPerPage);
  const totalPagesEntered = Math.ceil(enteredOrders.length / itemsPerPage);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPagePending(1);
    setCurrentPageEntered(1);
  }, [searchTerm, filterColor, filterJobType]);

  const openConfirmModal = (order: Order) => {
    setSelectedOrderId(order.id);
    setConfirmDate(format(new Date(), 'yyyy-MM-dd'));
    setConfirmNotes(order.notes || '');
    setConfirmModalOpen(true);
  };

  const executeConfirmEntry = async () => {
    if (!selectedOrderId) return;
    try {
      const orderRef = doc(db, 'orders', selectedOrderId);
      await updateDoc(orderRef, {
        status: 'entered',
        entryDate: confirmDate,
        notes: confirmNotes.trim()
      });
      setConfirmModalOpen(false);
      setSelectedOrderId(null);
      toast.success('Entrada confirmada');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `orders/${selectedOrderId}`);
      toast.error('Error al confirmar entrada');
    }
  };

  const openEditModal = (order: Order) => {
    setEditingOrder({ ...order });
    setEditModalOpen(true);
  };

  const executeEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOrder) return;
    
    // Check for duplicates if orderNumber changed
    const originalOrder = orders.find(o => o.id === editingOrder.id);
    if (originalOrder && originalOrder.orderNumber.toLowerCase() !== editingOrder.orderNumber.toLowerCase()) {
      const isDuplicate = orders.some(
        (o) => o.id !== editingOrder.id && o.orderNumber.toLowerCase() === editingOrder.orderNumber.toLowerCase().trim()
      );
      if (isDuplicate) {
        toast.error(`El pedido ${editingOrder.orderNumber} ya existe.`);
        return;
      }
    }

    try {
      const orderRef = doc(db, 'orders', editingOrder.id);
      await updateDoc(orderRef, {
        orderNumber: editingOrder.orderNumber.trim(),
        client: editingOrder.client.trim(),
        color: editingOrder.color.trim(),
        jobType: editingOrder.jobType,
        creationDate: editingOrder.creationDate,
        notes: editingOrder.notes?.trim() || '',
        ...(editingOrder.status === 'entered' ? { entryDate: editingOrder.entryDate } : {})
      });
      setEditModalOpen(false);
      setEditingOrder(null);
      toast.success('Pedido actualizado');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `orders/${editingOrder.id}`);
      toast.error('Error al actualizar pedido');
    }
  };

  const openDeleteModal = (orderId: string) => {
    setDeletingOrderId(orderId);
    setDeleteModalOpen(true);
  };

  const executeDelete = async () => {
    if (!deletingOrderId) return;
    try {
      await deleteDoc(doc(db, 'orders', deletingOrderId));
      setDeleteModalOpen(false);
      setDeletingOrderId(null);
      toast.success('Pedido eliminado');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `orders/${deletingOrderId}`);
      toast.error('Error al eliminar pedido');
    }
  };

  const renderPagination = (currentPage: number, totalPages: number, setPage: (p: number) => void) => {
    if (totalPages <= 1) return null;
    return (
      <div className="flex items-center justify-between px-5 py-3 border-t border-white/10 bg-black/20">
        <span className="text-xs text-gray-500 font-mono">
          Página {currentPage} de {totalPages}
        </span>
        <div className="flex gap-2">
          <button
            onClick={() => setPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="p-1.5 rounded-lg border border-white/10 text-gray-400 hover:bg-white/5 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={() => setPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="p-1.5 rounded-lg border border-white/10 text-gray-400 hover:bg-white/5 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Search and Filters */}
      <div className="glass-panel rounded-2xl p-4 flex flex-col sm:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Buscar por ID o Cliente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-black/40 border border-white/10 rounded-xl focus:ring-1 focus:ring-neon-accent focus:border-neon-accent outline-none transition-all text-white placeholder-gray-600 text-sm"
          />
        </div>
        <div className="relative w-full sm:w-64">
          <Filter size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <select
            value={filterColor}
            onChange={(e) => setFilterColor(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-black/40 border border-white/10 rounded-xl focus:ring-1 focus:ring-neon-accent focus:border-neon-accent outline-none transition-all text-white text-sm appearance-none"
          >
            <option value="">Todos los colores</option>
            {uniqueColors.map(c => (
              <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
            ))}
          </select>
        </div>
        <div className="relative w-full sm:w-64">
          <Filter size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <select
            value={filterJobType}
            onChange={(e) => setFilterJobType(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-black/40 border border-white/10 rounded-xl focus:ring-1 focus:ring-neon-accent focus:border-neon-accent outline-none transition-all text-white text-sm appearance-none"
          >
            <option value="">Todos los trabajos</option>
            {uniqueJobTypes.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Pending Orders */}
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
          <div className="glass-panel border-dashed border-white/20 p-12 flex flex-col items-center justify-center text-gray-500 rounded-2xl">
            <Inbox size={48} className="mb-4 text-white/10" />
            <p className="font-mono text-sm tracking-widest">NO HAY PEDIDOS PENDIENTES</p>
          </div>
        ) : (
          <div className="glass-panel rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-black/40 text-gray-400 font-mono text-xs uppercase tracking-wider border-b border-white/10">
                  <tr>
                    <th className="px-5 py-4">ID</th>
                    <th className="px-5 py-4">Cliente</th>
                    <th className="px-5 py-4">Trabajo</th>
                    <th className="px-5 py-4">Color</th>
                    <th className="px-5 py-4">Creación</th>
                    <th className="px-5 py-4">Notas</th>
                    <th className="px-5 py-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {paginatedPending.map(order => (
                    <tr key={order.id} className="hover:bg-white/5 transition-colors group">
                      <td className="px-5 py-4 font-display font-bold text-white tracking-wide">{order.orderNumber}</td>
                      <td className="px-5 py-4 text-gray-300">{order.client}</td>
                      <td className="px-5 py-4 text-gray-300">{order.jobType}</td>
                      <td className="px-5 py-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-xs font-medium text-gray-300">
                          {order.color}
                        </span>
                      </td>
                      <td className="px-5 py-4 font-mono text-gray-400 text-xs">{order.creationDate}</td>
                      <td className="px-5 py-4 text-gray-400 text-xs max-w-[150px] truncate" title={order.notes}>{order.notes || '-'}</td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditModal(order)}
                            className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                            title="Editar"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => openDeleteModal(order.id)}
                            className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                            title="Eliminar"
                          >
                            <Trash2 size={16} />
                          </button>
                          <button
                            onClick={() => openConfirmModal(order)}
                            className="inline-flex items-center gap-1.5 bg-neon-accent/10 text-neon-accent border border-neon-accent/30 hover:bg-neon-accent hover:text-black px-3 py-1.5 rounded-lg text-xs font-bold tracking-wider transition-all ml-2"
                          >
                            <CheckCircle size={14} />
                            CONFIRMAR
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {renderPagination(currentPagePending, totalPagesPending, setCurrentPagePending)}
          </div>
        )}
      </div>

      {/* Entered Orders */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold uppercase tracking-widest text-gray-300 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-neon-accent neon-glow"></div>
            Entregados
          </h2>
          <span className="bg-neon-accent/10 text-neon-accent border border-neon-accent/20 px-2 py-0.5 rounded text-xs font-mono">
            {enteredOrders.length}
          </span>
        </div>
        
        {enteredOrders.length === 0 ? (
          <div className="glass-panel border-dashed border-white/20 p-12 flex flex-col items-center justify-center text-gray-500 rounded-2xl">
            <PackageOpen size={48} className="mb-4 text-white/10" />
            <p className="font-mono text-sm tracking-widest">NO HAY REGISTROS ENTREGADOS</p>
          </div>
        ) : (
          <div className="glass-panel rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-black/40 text-gray-400 font-mono text-xs uppercase tracking-wider border-b border-white/10">
                  <tr>
                    <th className="px-5 py-4">ID</th>
                    <th className="px-5 py-4">Cliente</th>
                    <th className="px-5 py-4">Trabajo</th>
                    <th className="px-5 py-4">Color</th>
                    <th className="px-5 py-4">Entrada</th>
                    <th className="px-5 py-4">Notas</th>
                    <th className="px-5 py-4 text-right">Tiempo</th>
                    <th className="px-5 py-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {paginatedEntered.map(order => {
                    const days = differenceInDays(new Date(order.entryDate!), new Date(order.creationDate));
                    const isDelayed = days > 5;
                    const isWarning = days >= 3 && days <= 5;
                    
                    return (
                      <tr key={order.id} className="hover:bg-white/5 transition-colors">
                        <td className="px-5 py-4 font-display font-bold text-white tracking-wide">{order.orderNumber}</td>
                        <td className="px-5 py-4 text-gray-300">{order.client}</td>
                        <td className="px-5 py-4 text-gray-300">{order.jobType}</td>
                        <td className="px-5 py-4">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-xs font-medium text-gray-300">
                            {order.color}
                          </span>
                        </td>
                        <td className="px-5 py-4 font-mono text-gray-400 text-xs">{order.entryDate}</td>
                        <td className="px-5 py-4 text-gray-400 text-xs max-w-[150px] truncate" title={order.notes}>{order.notes || '-'}</td>
                        <td className="px-5 py-4 text-right">
                          <span className={`inline-flex items-center px-2 py-1 border rounded font-mono text-xs ${
                            isDelayed ? 'bg-red-500/10 border-red-500/30 text-red-400' :
                            isWarning ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' :
                            'bg-neon-accent/10 border-neon-accent/30 text-neon-accent'
                          }`}>
                            {days}D
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openEditModal(order)}
                              className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                              title="Editar"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => openDeleteModal(order.id)}
                              className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                              title="Eliminar"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {renderPagination(currentPageEntered, totalPagesEntered, setCurrentPageEntered)}
          </div>
        )}
      </div>

      {/* Confirm Entry Modal */}
      {confirmModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="glass-panel rounded-2xl p-6 max-w-sm w-full border border-neon-accent/30 shadow-[0_0_30px_rgba(0,255,204,0.15)]">
            <h3 className="text-lg font-bold text-white mb-4">Confirmar Entrada</h3>
            <p className="text-sm text-gray-400 mb-4">Selecciona la fecha de entrada al almacén y actualiza las notas si es necesario.</p>
            
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Fecha de Entrada</label>
            <input
              type="date"
              value={confirmDate}
              onChange={(e) => setConfirmDate(e.target.value)}
              className="w-full px-4 py-2.5 bg-black/60 border border-white/10 rounded-xl focus:ring-1 focus:ring-neon-accent focus:border-neon-accent outline-none transition-all text-white text-sm font-mono mb-4 [&::-webkit-calendar-picker-indicator]:filter-[invert(1)]"
            />
            
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Notas / Incidencias</label>
            <textarea
              value={confirmNotes}
              onChange={(e) => setConfirmNotes(e.target.value)}
              className="w-full px-4 py-2.5 bg-black/60 border border-white/10 rounded-xl focus:ring-1 focus:ring-neon-accent focus:border-neon-accent outline-none transition-all text-white text-sm resize-none h-24 mb-6"
              placeholder="Información adicional..."
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

      {/* Edit Modal */}
      {editModalOpen && editingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="glass-panel rounded-2xl p-6 max-w-md w-full border border-white/20 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-white">Editar Pedido</h3>
              <button onClick={() => setEditModalOpen(false)} className="text-gray-400 hover:text-white">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={executeEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">ID Pedido</label>
                <input
                  type="text"
                  required
                  value={editingOrder.orderNumber}
                  onChange={(e) => setEditingOrder({...editingOrder, orderNumber: e.target.value})}
                  className="w-full px-4 py-2.5 bg-black/40 border border-white/10 rounded-xl focus:ring-1 focus:ring-neon-accent focus:border-neon-accent outline-none transition-all text-white font-mono text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Color</label>
                  <input
                    type="text"
                    required
                    value={editingOrder.color}
                    onChange={(e) => setEditingOrder({...editingOrder, color: e.target.value})}
                    className="w-full px-4 py-2.5 bg-black/40 border border-white/10 rounded-xl focus:ring-1 focus:ring-neon-accent focus:border-neon-accent outline-none transition-all text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Fecha Creación</label>
                  <input
                    type="date"
                    required
                    value={editingOrder.creationDate}
                    onChange={(e) => setEditingOrder({...editingOrder, creationDate: e.target.value})}
                    className="w-full px-4 py-2.5 bg-black/40 border border-white/10 rounded-xl focus:ring-1 focus:ring-neon-accent focus:border-neon-accent outline-none transition-all text-white text-sm font-mono [&::-webkit-calendar-picker-indicator]:filter-[invert(1)]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Cliente</label>
                <input
                  type="text"
                  required
                  value={editingOrder.client}
                  onChange={(e) => setEditingOrder({...editingOrder, client: e.target.value})}
                  className="w-full px-4 py-2.5 bg-black/40 border border-white/10 rounded-xl focus:ring-1 focus:ring-neon-accent focus:border-neon-accent outline-none transition-all text-white text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Trabajo</label>
                <select
                  value={editingOrder.jobType}
                  onChange={(e) => setEditingOrder({...editingOrder, jobType: e.target.value})}
                  className="w-full px-4 py-2.5 bg-black/40 border border-white/10 rounded-xl focus:ring-1 focus:ring-neon-accent focus:border-neon-accent outline-none transition-all text-white text-sm appearance-none"
                >
                  <option value="Lacado Estándar">Lacado Estándar</option>
                  <option value="Lacado Especial">Lacado Especial</option>
                  <option value="Metalizado">Metalizado</option>
                  <option value="Anodizado">Anodizado</option>
                  <option value="Madera">Madera</option>
                  <option value="Bicolor">Bicolor</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>
              {editingOrder.status === 'entered' && (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Fecha Entrada</label>
                  <input
                    type="date"
                    required
                    value={editingOrder.entryDate || ''}
                    onChange={(e) => setEditingOrder({...editingOrder, entryDate: e.target.value})}
                    className="w-full px-4 py-2.5 bg-black/40 border border-white/10 rounded-xl focus:ring-1 focus:ring-neon-accent focus:border-neon-accent outline-none transition-all text-white text-sm font-mono [&::-webkit-calendar-picker-indicator]:filter-[invert(1)]"
                  />
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Notas</label>
                <textarea
                  value={editingOrder.notes || ''}
                  onChange={(e) => setEditingOrder({...editingOrder, notes: e.target.value})}
                  className="w-full px-4 py-2.5 bg-black/40 border border-white/10 rounded-xl focus:ring-1 focus:ring-neon-accent focus:border-neon-accent outline-none transition-all text-white text-sm resize-none h-20"
                />
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-white/10 text-gray-300 hover:bg-white/5 transition-colors text-sm font-bold"
                >
                  CANCELAR
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 rounded-xl bg-white text-black hover:bg-gray-200 transition-colors text-sm font-bold"
                >
                  GUARDAR CAMBIOS
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="glass-panel rounded-2xl p-6 max-w-sm w-full border border-red-500/30 shadow-[0_0_30px_rgba(239,68,68,0.15)]">
            <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mb-4 border border-red-500/20">
              <Trash2 size={24} />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Eliminar Pedido</h3>
            <p className="text-sm text-gray-400 mb-6">¿Estás seguro de que deseas eliminar este pedido? Esta acción no se puede deshacer.</p>
            
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteModalOpen(false)}
                className="flex-1 py-2.5 px-4 rounded-xl border border-white/10 text-gray-300 hover:bg-white/5 transition-colors text-sm font-bold"
              >
                CANCELAR
              </button>
              <button
                onClick={executeDelete}
                className="flex-1 py-2.5 px-4 rounded-xl bg-red-500 text-white hover:bg-red-600 transition-colors text-sm font-bold shadow-[0_0_15px_rgba(239,68,68,0.3)]"
              >
                ELIMINAR
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Statistics({ orders }: { orders: Order[] }) {
  const [groupBy, setGroupBy] = useState<'color' | 'jobType' | 'client'>('color');
  const [filterValue, setFilterValue] = useState<string>('');

  // Reset filter when grouping changes
  useEffect(() => {
    setFilterValue('');
  }, [groupBy]);

  // Derived unique options for the secondary filter based on current grouping
  const uniqueOptions = useMemo(() => {
    const options = new Set<string>();
    orders.forEach(o => {
      let key = '';
      if (groupBy === 'color') key = o.color.toLowerCase().trim();
      else if (groupBy === 'jobType') key = o.jobType || 'Sin Trabajo';
      else if (groupBy === 'client') key = o.client.toLowerCase().trim();
      if (key) options.add(key);
    });
    return Array.from(options).sort();
  }, [orders, groupBy]);

  // Filter orders based on the secondary filter
  const filteredAllOrders = useMemo(() => {
    if (!filterValue) return orders;
    return orders.filter(o => {
      let key = '';
      if (groupBy === 'color') key = o.color.toLowerCase().trim();
      else if (groupBy === 'jobType') key = o.jobType || 'Sin Trabajo';
      else if (groupBy === 'client') key = o.client.toLowerCase().trim();
      return key === filterValue;
    });
  }, [orders, groupBy, filterValue]);

  const enteredOrders = filteredAllOrders.filter(o => o.status === 'entered' && o.entryDate);

  // Calculate average days per selected grouping
  let totalDaysAll = 0;
  const statsGrouped = enteredOrders.reduce((acc, order) => {
    const days = differenceInDays(new Date(order.entryDate!), new Date(order.creationDate));
    totalDaysAll += days;
    
    let key = '';
    if (groupBy === 'color') key = order.color.toLowerCase().trim();
    else if (groupBy === 'jobType') key = order.jobType || 'Sin Trabajo';
    else if (groupBy === 'client') key = order.client.toLowerCase().trim();
    
    if (!acc[key]) {
      acc[key] = { name: key, totalDays: 0, count: 0 };
    }
    acc[key].totalDays += days;
    acc[key].count += 1;
    return acc;
  }, {} as Record<string, { name: string, totalDays: number, count: number }>);

  const chartData = Object.values(statsGrouped).map(stat => ({
    name: stat.name.toUpperCase(),
    Promedio: Number((stat.totalDays / stat.count).toFixed(1))
  })).sort((a, b) => b.Promedio - a.Promedio);

  const overallAverage = enteredOrders.length > 0 ? (totalDaysAll / enteredOrders.length).toFixed(1) : '0';
  const completionRate = filteredAllOrders.length > 0 ? Math.round((enteredOrders.length / filteredAllOrders.length) * 100) : 0;
  const fastestGroup = chartData.length > 0 ? chartData[chartData.length - 1].name : '-';

  const exportToPDF = () => {
    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(18);
    const titleFilter = filterValue ? ` - ${filterValue.toUpperCase()}` : '';
    doc.text(`Reporte de Pedidos por ${groupBy === 'color' ? 'Color' : groupBy === 'jobType' ? 'Trabajo' : 'Cliente'}${titleFilter}`, 14, 22);
    
    // Statistics
    doc.setFontSize(12);
    doc.text(`Total Entradas: ${enteredOrders.length}`, 14, 32);
    doc.text(`Tasa Completado: ${completionRate}%`, 14, 38);
    doc.text(`Promedio Global: ${overallAverage} días`, 14, 44);
    doc.text(`Más Rápido: ${fastestGroup}`, 14, 50);

    // Table
    const tableData = enteredOrders.map(order => {
      const days = differenceInDays(new Date(order.entryDate!), new Date(order.creationDate));
      return [
        order.orderNumber,
        order.client,
        order.jobType || '-',
        order.color,
        format(new Date(order.creationDate), 'dd/MM/yyyy'),
        format(new Date(order.entryDate!), 'dd/MM/yyyy'),
        `${days} días`,
        order.notes || '-'
      ];
    });

    autoTable(doc, {
      startY: 60,
      head: [['Pedido', 'Cliente', 'Trabajo', 'Color', 'Creación', 'Entrada', 'Retraso', 'Notas']],
      body: tableData,
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [0, 255, 204], textColor: [0, 0, 0] },
    });

    doc.save(`reporte-pedidos-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
    toast.success('PDF exportado correctamente');
  };

  return (
    <div className="glass-panel rounded-2xl p-6 relative overflow-hidden">
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/5 rounded-full blur-3xl pointer-events-none"></div>
      
      <div className="flex items-center justify-between mb-6 relative z-10">
        <h2 className="text-sm font-bold uppercase tracking-widest text-gray-300 flex items-center gap-2">
          <BarChart3 size={16} className="text-purple-400" />
          Métricas
        </h2>
        <div className="flex items-center gap-2">
          <select
            value={groupBy}
            onChange={(e) => setGroupBy(e.target.value as any)}
            className="text-xs font-mono bg-black/40 border border-white/10 rounded-lg px-2 py-1.5 text-white outline-none focus:border-purple-400/50 appearance-none"
          >
            <option value="color">Por Color</option>
            <option value="jobType">Por Trabajo</option>
            <option value="client">Por Cliente</option>
          </select>
          <select
            value={filterValue}
            onChange={(e) => setFilterValue(e.target.value)}
            className="text-xs font-mono bg-black/40 border border-white/10 rounded-lg px-2 py-1.5 text-white outline-none focus:border-purple-400/50 appearance-none max-w-[120px] sm:max-w-[150px] truncate"
          >
            <option value="">Todos</option>
            {uniqueOptions.map(opt => (
              <option key={opt} value={opt}>{opt.toUpperCase()}</option>
            ))}
          </select>
          {enteredOrders.length > 0 && (
            <button
              onClick={exportToPDF}
              className="text-xs font-mono bg-white/5 hover:bg-white/10 border border-white/10 hover:border-neon-accent/50 text-white py-1.5 px-3 rounded-lg transition-all flex items-center gap-2"
            >
              EXPORTAR PDF
            </button>
          )}
        </div>
      </div>
      
      {filteredAllOrders.length === 0 ? (
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
              <p className="text-[10px] font-mono text-gray-500 mb-1">MÁS RÁPIDO</p>
              <p className="text-sm font-mono text-purple-400 mt-1 truncate" title={fastestGroup}>{fastestGroup}</p>
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

