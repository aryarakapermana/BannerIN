'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useMemo, useState } from 'react'
import { logoutAction } from '@/app/(auth)/actions'
import { NumericInput } from '@/components/ui/NumericInput'
import { Order, priceCalculator } from '@/domain'
import {
  updateOrderStatusAction,
  adminCreateOrderAction,
  adminUpdateOrderAction,
  deleteOrderAction,
  updateMaterialPriceAction,
  toggleMaterialStatusAction,
  createMaterialAction,
  updateMaterialAction,
  deleteMaterialAction,
} from './actions'

export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'completed' | 'cancelled'

export type DashboardOrder = {
  id: string
  orderNumber: string
  customerName: string
  customerPhone: string
  materialId?: string
  material: string
  width: number
  height: number
  quantity?: number
  areaSqm?: number
  total: number
  status: OrderStatus
  notes?: string | null
  paymentMethod?: string
  paymentProofPath?: string | null
  paymentProofUrl?: string | null
  preview: string
  originalFilePath?: string
  fileSize: string
  createdAt: string
  dateFormatted: string
}

type OrderFormState = {
  id?: string
  customerName: string
  whatsappNumber: string
  materialId: string
  width: number | ''
  height: number | ''
  quantity: number | ''
  status: OrderStatus
  notes: string
}

export type DashboardMaterial = {
  id: string
  code: string
  name: string
  category: string
  weight: string
  description: string
  price: number
  active: boolean
  lastUpdated: string
}

type EditingMaterialState = Omit<DashboardMaterial, 'price'> & { price: number | '' }

const rupiah = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
})

const defaultOrders: DashboardOrder[] = [
  {
    id: 'ord-1',
    orderNumber: '#BK-202611-007',
    customerName: 'Dewi Lestari',
    customerPhone: '0813 ···· 2408',
    material: 'Flexi Korea 440g',
    width: 200,
    height: 100,
    total: 90000,
    status: 'pending',
    preview: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=300&q=80',
    fileSize: 'PDF · 8,2 MB',
    createdAt: '08 Nov · 10.42',
    dateFormatted: '08 November 2026',
  },
  {
    id: 'ord-2',
    orderNumber: '#BK-202611-006',
    customerName: 'Budi Santoso',
    customerPhone: '0857 ···· 1132',
    material: 'Flexi Premium 340g',
    width: 200,
    height: 100,
    total: 56000,
    status: 'pending',
    preview: 'https://images.unsplash.com/photo-1542744094-3a31f272c490?auto=format&fit=crop&w=300&q=80',
    fileSize: 'PDF · 5,6 MB',
    createdAt: '08 Nov · 10.18',
    dateFormatted: '08 November 2026',
  },
  {
    id: 'ord-3',
    orderNumber: '#BK-202611-005',
    customerName: 'Siti Rahma',
    customerPhone: '0812 ···· 7821',
    material: 'Flexi Korea 440g',
    width: 300,
    height: 100,
    total: 135000,
    status: 'confirmed',
    preview: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=300&q=80',
    fileSize: 'PNG · 6,4 MB',
    createdAt: '08 Nov · 09.50',
    dateFormatted: '08 November 2026',
  },
  {
    id: 'ord-4',
    orderNumber: '#BK-202611-001',
    customerName: 'Andi Pratama',
    customerPhone: '0812 ···· 6789',
    material: 'Flexi Premium 340g',
    width: 300,
    height: 100,
    total: 168000,
    status: 'processing',
    preview: 'https://images.unsplash.com/photo-1506617420156-8e4536971650?auto=format&fit=crop&w=300&q=80',
    fileSize: 'PNG · 4,8 MB',
    createdAt: '06 Nov · 14.20',
    dateFormatted: '06 November 2026',
  },
  {
    id: 'ord-5',
    orderNumber: '#BK-202611-004',
    customerName: 'Rizky Saputra',
    customerPhone: '0821 ···· 4490',
    material: 'Flexi 280g',
    width: 200,
    height: 100,
    total: 50000,
    status: 'completed',
    preview: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=300&q=80',
    fileSize: 'PDF · 3,1 MB',
    createdAt: '08 Nov · 09.12',
    dateFormatted: '08 November 2026',
  },
  {
    id: 'ord-6',
    orderNumber: '#BK-202611-003',
    customerName: 'Nadia Putri',
    customerPhone: '0819 ···· 9054',
    material: 'Flexi 280g',
    width: 100,
    height: 100,
    total: 25000,
    status: 'cancelled',
    preview: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=300&q=80',
    fileSize: 'PDF · 2,7 MB',
    createdAt: '08 Nov · 08.46',
    dateFormatted: '08 November 2026',
  },
]

const defaultMaterials: DashboardMaterial[] = [
  {
    id: 'mat-1',
    code: 'BHN-001',
    name: 'Flexi Premium 340g',
    category: 'Banner outdoor',
    weight: '340g',
    description: 'Permukaan halus untuk banner promosi harian.',
    price: 28000,
    active: true,
    lastUpdated: '08 Nov 2026 oleh Arya',
  },
  {
    id: 'mat-2',
    code: 'BHN-002',
    name: 'Flexi Korea 440g',
    category: 'Banner outdoor',
    weight: '440g',
    description: 'Bahan lebih tebal untuk banner promosi jangka panjang.',
    price: 45000,
    active: true,
    lastUpdated: '06 Nov 2026 oleh Arya',
  },
  {
    id: 'mat-3',
    code: 'BHN-003',
    name: 'Flexi 280g',
    category: 'Banner outdoor',
    weight: '280g',
    description: 'Pilihan ringan dan ekonomis untuk promosi harian.',
    price: 25000,
    active: true,
    lastUpdated: '05 Nov 2026 oleh Arya',
  },
  {
    id: 'mat-4',
    code: 'BHN-004',
    name: 'Albatros',
    category: 'Display indoor',
    weight: '260g',
    description: 'Hasil cetak tajam untuk poster dan display indoor.',
    price: 65000,
    active: true,
    lastUpdated: '04 Nov 2026 oleh Arya',
  },
  {
    id: 'mat-5',
    code: 'BHN-005',
    name: 'Luster',
    category: 'Display indoor',
    weight: '260g',
    description: 'Finishing semi-gloss untuk roll banner dan display.',
    price: 70000,
    active: true,
    lastUpdated: '04 Nov 2026 oleh Arya',
  },
  {
    id: 'mat-6',
    code: 'BHN-006',
    name: 'Stiker Vinyl',
    category: 'Stiker',
    weight: '120g',
    description: 'Media perekat tahan air untuk kaca dan permukaan rata.',
    price: 85000,
    active: false,
    lastUpdated: '02 Nov 2026 oleh Arya',
  },
  {
    id: 'mat-7',
    code: 'BHN-007',
    name: 'Backlite',
    category: 'Signage',
    weight: '510g',
    description: 'Media tembus cahaya untuk neon box dan signage.',
    price: 95000,
    active: false,
    lastUpdated: '01 Nov 2026 oleh Arya',
  },
]

interface DashboardClientProps {
  initialMaterials?: DashboardMaterial[]
  initialOrders?: DashboardOrder[]
  adminName?: string
  isDemo?: boolean
}

export default function DashboardClient({
  initialMaterials,
  initialOrders,
  adminName = 'Arya',
  isDemo = false,
}: DashboardClientProps = {}) {
  const [currentView, setCurrentView] = useState<'summary' | 'orders' | 'materials'>('summary')
  const [orders, setOrders] = useState<DashboardOrder[]>(
    initialOrders !== undefined ? initialOrders : isDemo ? defaultOrders : []
  )
  const [materials, setMaterials] = useState<DashboardMaterial[]>(
    initialMaterials && initialMaterials.length > 0 ? initialMaterials : defaultMaterials
  )

  // Orders filters
  const [orderSearch, setOrderSearch] = useState('')
  const [orderFilterTab, setOrderFilterTab] = useState<'all' | 'pending' | 'processing'>('all')

  // Materials filters & quick edit
  const [materialSearch, setMaterialSearch] = useState('')
  const [materialFilterTab, setMaterialFilterTab] = useState<'all' | 'active' | 'inactive'>('all')
  const [quickEditId, setQuickEditId] = useState<string | null>('mat-1')
  const [quickEditPrice, setQuickEditPrice] = useState<number | ''>(28000)

  // Edit Modal State
  const [editingMaterial, setEditingMaterial] = useState<EditingMaterialState | null>(null)
  const [isNewMaterial, setIsNewMaterial] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalError, setModalError] = useState<string | null>(null)
  const [isSavingModal, setIsSavingModal] = useState(false)

  // Modal Verifikasi Bukti Pembayaran State
  const [selectedProofOrder, setSelectedProofOrder] = useState<DashboardOrder | null>(null)
  const [isUpdatingProofStatus, setIsUpdatingProofStatus] = useState(false)

  // Modal Tambah / Edit Pesanan & Hapus Pesanan State (CRUD Pesanan)
  const [editingOrder, setEditingOrder] = useState<OrderFormState | null>(null)
  const [isNewOrder, setIsNewOrder] = useState(false)
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false)
  const [orderModalError, setOrderModalError] = useState<string | null>(null)
  const [isSavingOrderModal, setIsSavingOrderModal] = useState(false)
  const [deletingOrder, setDeletingOrder] = useState<DashboardOrder | null>(null)
  const [deleteOrderError, setDeleteOrderError] = useState<string | null>(null)
  const [isDeletingOrder, setIsDeletingOrder] = useState(false)
  const [orderFeedback, setOrderFeedback] = useState<{
    type: 'success' | 'error'
    message: string
  } | null>(null)

  // Filtered orders
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      if (orderFilterTab === 'pending' && o.status !== 'pending') return false
      if (orderFilterTab === 'processing' && o.status !== 'processing') return false
      if (
        orderSearch &&
        !o.orderNumber.toLowerCase().includes(orderSearch.toLowerCase()) &&
        !o.customerName.toLowerCase().includes(orderSearch.toLowerCase()) &&
        !o.customerPhone.includes(orderSearch)
      ) {
        return false
      }
      return true
    })
  }, [orders, orderFilterTab, orderSearch])

  // Filtered materials
  const filteredMaterials = useMemo(() => {
    return materials.filter((m) => {
      if (materialFilterTab === 'active' && !m.active) return false
      if (materialFilterTab === 'inactive' && m.active) return false
      if (
        materialSearch &&
        !m.name.toLowerCase().includes(materialSearch.toLowerCase()) &&
        !m.code.toLowerCase().includes(materialSearch.toLowerCase())
      ) {
        return false
      }
      return true
    })
  }, [materials, materialFilterTab, materialSearch])

  // Metrics
  const metrics = useMemo(() => {
    const todayOrders = orders.length
    const pendingOrders = orders.filter((o) => o.status === 'pending').length
    const processingOrders = orders.filter((o) => o.status === 'processing').length
    const revenue = orders.reduce(
      (sum, o) => sum + (o.status !== 'cancelled' ? o.total : 0),
      0
    )
    const activeMaterials = materials.filter((m) => m.active).length
    const inactiveMaterials = materials.filter((m) => !m.active).length
    return {
      todayOrders,
      pendingOrders,
      processingOrders,
      revenue,
      totalMaterials: materials.length,
      activeMaterials,
      inactiveMaterials,
    }
  }, [orders, materials])

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    const previousOrder = orders.find((o) => o.id === orderId)
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)),
    )
    setSelectedProofOrder((prev) =>
      prev && prev.id === orderId ? { ...prev, status: newStatus } : prev,
    )
    if (!orderId.startsWith('ord-')) {
      const res = await updateOrderStatusAction(orderId, newStatus)
      if (!res.success && previousOrder) {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: previousOrder.status } : o)),
        )
        setSelectedProofOrder((prev) =>
          prev && prev.id === orderId ? { ...prev, status: previousOrder.status } : prev,
        )
        setOrderFeedback({
          type: 'error',
          message: res.error || 'Gagal memperbarui status pesanan.',
        })
      } else if (res.success) {
        setOrderFeedback({
          type: 'success',
          message: `Status pesanan ${previousOrder?.orderNumber ?? ''} diperbarui ke ${newStatus}.`,
        })
      }
    }
  }

  const handleConfirmPaymentFromModal = async (order: DashboardOrder) => {
    setIsUpdatingProofStatus(true)
    try {
      await handleStatusChange(order.id, 'confirmed')
    } finally {
      setIsUpdatingProofStatus(false)
    }
  }

  const orderModalMaterials = useMemo(() => {
    if (!editingOrder) return materials.filter((m) => m.active)
    return materials.filter((m) => m.active || m.id === editingOrder.materialId)
  }, [materials, editingOrder])

  const orderModalPreview = useMemo(() => {
    if (!editingOrder) return null
    const selectedMat = materials.find((m) => m.id === editingOrder.materialId)
    const w = Number(editingOrder.width)
    const h = Number(editingOrder.height)
    const q = Number(editingOrder.quantity)
    if (
      !selectedMat ||
      !Number.isFinite(w) ||
      !Number.isFinite(h) ||
      !Number.isFinite(q) ||
      w < 10 ||
      h < 10 ||
      q < 1
    ) {
      return null
    }
    return {
      material: selectedMat,
      ...priceCalculator.calculateBreakdown({
        widthCm: w,
        heightCm: h,
        pricePerSqm: selectedMat.price,
        quantity: Math.floor(q),
      }),
    }
  }, [editingOrder, materials])

  const handleOpenNewOrderModal = () => {
    const defaultMat = materials.find((m) => m.active) ?? materials[0]
    setEditingOrder({
      customerName: '',
      whatsappNumber: '',
      materialId: defaultMat?.id ?? '',
      width: 200,
      height: 100,
      quantity: 1,
      status: 'confirmed',
      notes: '',
    })
    setIsNewOrder(true)
    setOrderModalError(null)
    setIsOrderModalOpen(true)
  }

  const handleOpenEditOrderModal = (ord: DashboardOrder) => {
    const matchedMat =
      (ord.materialId && materials.find((m) => m.id === ord.materialId)) ||
      materials.find((m) => m.name.toLowerCase() === ord.material.toLowerCase()) ||
      materials.find((m) => m.active) ||
      materials[0]

    setEditingOrder({
      id: ord.id,
      customerName: ord.customerName,
      whatsappNumber: ord.customerPhone === '-' ? '' : ord.customerPhone,
      materialId: matchedMat?.id ?? '',
      width: ord.width,
      height: ord.height,
      quantity: ord.quantity ?? 1,
      status: ord.status,
      notes: ord.notes ?? '',
    })
    setIsNewOrder(false)
    setOrderModalError(null)
    setIsOrderModalOpen(true)
  }

  const handleSaveOrderModal = async () => {
    if (!editingOrder) return
    if (!editingOrder.customerName.trim()) {
      setOrderModalError('Nama pemesan wajib diisi.')
      return
    }
    if (!editingOrder.whatsappNumber.trim()) {
      setOrderModalError('Nomor WhatsApp wajib diisi.')
      return
    }
    if (!editingOrder.materialId) {
      setOrderModalError('Bahan cetak wajib dipilih.')
      return
    }
    const w = Number(editingOrder.width)
    const h = Number(editingOrder.height)
    const q = Number(editingOrder.quantity)
    if (!Number.isFinite(w) || w < 10 || w > 5000) {
      setOrderModalError('Lebar banner harus di antara 10 cm hingga 5.000 cm.')
      return
    }
    if (!Number.isFinite(h) || h < 10 || h > 5000) {
      setOrderModalError('Tinggi banner harus di antara 10 cm hingga 5.000 cm.')
      return
    }
    if (!Number.isFinite(q) || q < 1 || !Number.isInteger(q)) {
      setOrderModalError('Jumlah cetak minimal 1 lembar (bilangan bulat).')
      return
    }

    setIsSavingOrderModal(true)
    setOrderModalError(null)

    try {
      const selectedMat = materials.find((m) => m.id === editingOrder.materialId)
      const isMockOperation =
        isDemo ||
        (!isNewOrder && editingOrder.id?.startsWith('ord-')) ||
        Boolean(editingOrder.materialId.startsWith('mat-'))

      if (isMockOperation) {
        const waNormalized = Order.normalizeWhatsApp(editingOrder.whatsappNumber).e164
        const cleanName = Order.normalizeCustomerName(editingOrder.customerName)
        const cleanNotes = Order.normalizeNotes(editingOrder.notes)
        const breakdown = priceCalculator.calculateBreakdown({
          widthCm: w,
          heightCm: h,
          pricePerSqm: selectedMat?.price ?? 25000,
          quantity: q,
        })

        if (isNewOrder) {
          const mockId = `ord-demo-${Date.now()}`
          const newDemoOrder: DashboardOrder = {
            id: mockId,
            orderNumber: `#BK-DEMO-${orders.length + 1}`,
            customerName: cleanName,
            customerPhone: waNormalized,
            materialId: selectedMat?.id,
            material: selectedMat?.name || 'Bahan Banner',
            width: w,
            height: h,
            quantity: q,
            areaSqm: breakdown.areaSqm,
            total: breakdown.totalPrice,
            status: editingOrder.status,
            notes: cleanNotes,
            paymentMethod: 'qris_static',
            preview: '',
            fileSize: 'Tanpa lampiran desain',
            createdAt: new Date().toLocaleTimeString('id-ID', {
              hour: '2-digit',
              minute: '2-digit',
            }),
            dateFormatted: new Date().toLocaleDateString('id-ID', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            }),
          }
          setOrders((prev) => [newDemoOrder, ...prev])
          setOrderFeedback({
            type: 'success',
            message: `Pesanan ${newDemoOrder.orderNumber} berhasil ditambahkan.`,
          })
        } else if (editingOrder.id) {
          setOrders((prev) =>
            prev.map((o) =>
              o.id === editingOrder.id
                ? {
                    ...o,
                    customerName: cleanName,
                    customerPhone: waNormalized,
                    materialId: selectedMat?.id ?? o.materialId,
                    material: selectedMat?.name ?? o.material,
                    width: w,
                    height: h,
                    quantity: q,
                    areaSqm: breakdown.areaSqm,
                    total: breakdown.totalPrice,
                    status: editingOrder.status,
                    notes: cleanNotes,
                  }
                : o
            )
          )
          setOrderFeedback({
            type: 'success',
            message: 'Perubahan pesanan berhasil disimpan.',
          })
        }
        setIsOrderModalOpen(false)
        return
      }

      if (isNewOrder) {
        const res = await adminCreateOrderAction({
          customerName: editingOrder.customerName,
          whatsappNumber: editingOrder.whatsappNumber,
          materialId: editingOrder.materialId,
          widthCm: w,
          heightCm: h,
          quantity: q,
          status: editingOrder.status,
          notes: editingOrder.notes,
        })
        if (!res.success || !res.order) {
          setOrderModalError(res.error || 'Gagal menambahkan pesanan baru.')
          return
        }
        const createdOrder: DashboardOrder = {
          ...res.order,
          paymentProofPath: null,
          paymentProofUrl: null,
          preview: '',
          originalFilePath: undefined,
          fileSize: 'Tanpa lampiran desain',
        }
        setOrders((prev) => [createdOrder, ...prev])
        setOrderFeedback({
          type: 'success',
          message: `Pesanan ${createdOrder.orderNumber} untuk ${createdOrder.customerName} berhasil dibuat.`,
        })
      } else if (editingOrder.id) {
        const res = await adminUpdateOrderAction({
          orderId: editingOrder.id,
          customerName: editingOrder.customerName,
          whatsappNumber: editingOrder.whatsappNumber,
          materialId: editingOrder.materialId,
          widthCm: w,
          heightCm: h,
          quantity: q,
          status: editingOrder.status,
          notes: editingOrder.notes,
        })
        if (!res.success || !res.order) {
          setOrderModalError(res.error || 'Gagal menyimpan perubahan pesanan.')
          return
        }
        const updatedDto = res.order
        setOrders((prev) =>
          prev.map((o) =>
            o.id === updatedDto.id
              ? {
                  ...o,
                  customerName: updatedDto.customerName,
                  customerPhone: updatedDto.customerPhone,
                  materialId: updatedDto.materialId,
                  material: updatedDto.material,
                  width: updatedDto.width,
                  height: updatedDto.height,
                  quantity: updatedDto.quantity,
                  areaSqm: updatedDto.areaSqm,
                  total: updatedDto.total,
                  status: updatedDto.status,
                  notes: updatedDto.notes,
                }
              : o
          )
        )
        setSelectedProofOrder((prev) =>
          prev && prev.id === updatedDto.id
            ? {
                ...prev,
                customerName: updatedDto.customerName,
                customerPhone: updatedDto.customerPhone,
                materialId: updatedDto.materialId,
                material: updatedDto.material,
                width: updatedDto.width,
                height: updatedDto.height,
                quantity: updatedDto.quantity,
                areaSqm: updatedDto.areaSqm,
                total: updatedDto.total,
                status: updatedDto.status,
                notes: updatedDto.notes,
              }
            : prev
        )
        setOrderFeedback({
          type: 'success',
          message: `Pesanan ${updatedDto.orderNumber} berhasil diperbarui (harga dihitung ulang server).`,
        })
      }

      setIsOrderModalOpen(false)
    } catch (err: unknown) {
      setOrderModalError(
        err instanceof Error ? err.message : 'Terjadi kesalahan saat menyimpan pesanan.'
      )
    } finally {
      setIsSavingOrderModal(false)
    }
  }

  const handleOpenDeleteOrderModal = (ord: DashboardOrder) => {
    setDeleteOrderError(null)
    setDeletingOrder(ord)
  }

  const handleConfirmDeleteOrder = async () => {
    if (!deletingOrder) return
    setIsDeletingOrder(true)
    setDeleteOrderError(null)

    try {
      if (isDemo || deletingOrder.id.startsWith('ord-')) {
        setOrders((prev) => prev.filter((o) => o.id !== deletingOrder.id))
        if (selectedProofOrder?.id === deletingOrder.id) {
          setSelectedProofOrder(null)
        }
        setOrderFeedback({
          type: 'success',
          message: `Pesanan ${deletingOrder.orderNumber} berhasil dihapus.`,
        })
        setDeletingOrder(null)
        return
      }

      const res = await deleteOrderAction(deletingOrder.id)
      if (!res.success) {
        setDeleteOrderError(res.error || 'Gagal menghapus pesanan.')
        return
      }

      const deletedNumber = deletingOrder.orderNumber
      setOrders((prev) => prev.filter((o) => o.id !== deletingOrder.id))
      if (selectedProofOrder?.id === deletingOrder.id) {
        setSelectedProofOrder(null)
      }
      setDeletingOrder(null)
      setOrderFeedback({
        type: 'success',
        message: `Pesanan ${deletedNumber} telah dihapus permanen dari sistem.`,
      })
    } catch (err: unknown) {
      setDeleteOrderError(
        err instanceof Error ? err.message : 'Terjadi kesalahan saat menghapus pesanan.'
      )
    } finally {
      setIsDeletingOrder(false)
    }
  }

  const handleToggleMaterial = async (matId: string) => {
    const target = materials.find((m) => m.id === matId)
    const newActive = !target?.active
    setMaterials((prev) =>
      prev.map((m) => (m.id === matId ? { ...m, active: newActive } : m)),
    )
    if (!matId.startsWith('mat-')) {
      await toggleMaterialStatusAction(matId, newActive)
    }
  }

  const handleSaveQuickPrice = async (matId: string) => {
    if (quickEditPrice === '' || isNaN(quickEditPrice) || quickEditPrice < 0) {
      alert('Harga per m² wajib diisi dan tidak boleh negatif.')
      return
    }
    const numericPrice = quickEditPrice
    setMaterials((prev) =>
      prev.map((m) => (m.id === matId ? { ...m, price: numericPrice } : m)),
    )
    setQuickEditId(null)
    if (!matId.startsWith('mat-')) {
      await updateMaterialPriceAction(matId, numericPrice)
    }
  }

  const handleDownloadDesign = async (order: DashboardOrder) => {
    try {
      const targetUrl = order.originalFilePath || order.preview
      if (!targetUrl) {
        alert('File desain belum tersedia untuk pesanan ini.')
        return
      }
      const res = await fetch(targetUrl)
      const blob = await res.blob()
      const blobUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = blobUrl
      const extension = order.fileSize?.includes('PDF')
        ? 'pdf'
        : order.fileSize?.includes('PNG')
        ? 'png'
        : 'jpg'
      a.download = `Desain-${order.orderNumber.replace(/[^a-zA-Z0-9_-]/g, '')}.${extension}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(blobUrl)
    } catch {
      const targetUrl = order.originalFilePath || order.preview
      if (targetUrl) {
        window.open(targetUrl, '_blank')
      }
    }
  }

  const handleOpenAddModal = () => {
    setEditingMaterial({
      id: '',
      code: `BHN-00${materials.length + 1}`,
      name: '',
      category: 'Banner outdoor',
      weight: '340g',
      description: '',
      price: 25000,
      active: true,
      lastUpdated: `Baru saja oleh ${adminName}`,
    })
    setIsNewMaterial(true)
    setModalError(null)
    setIsModalOpen(true)
  }

  const handleOpenEditModal = (m: DashboardMaterial) => {
    setEditingMaterial({ ...m })
    setIsNewMaterial(false)
    setModalError(null)
    setIsModalOpen(true)
  }

  const handleSaveModal = async () => {
    if (!editingMaterial) return
    if (!editingMaterial.name.trim()) {
      setModalError('Nama bahan wajib diisi.')
      return
    }
    if (
      editingMaterial.price === '' ||
      isNaN(editingMaterial.price) ||
      editingMaterial.price < 0
    ) {
      setModalError('Harga per m² wajib diisi dan tidak boleh negatif.')
      return
    }
    const numericPrice = editingMaterial.price

    setIsSavingModal(true)
    setModalError(null)

    try {
      if (isNewMaterial) {
        const res = await createMaterialAction({
          name: editingMaterial.name,
          description: editingMaterial.description,
          price_per_sqm: numericPrice,
          is_active: editingMaterial.active,
        })
        if (!res.success) {
          setModalError(res.error || 'Gagal menambahkan bahan.')
          setIsSavingModal(false)
          return
        }
        if (res.material) {
          const newMat: DashboardMaterial = {
            id: res.material.id,
            code: `BHN-00${materials.length + 1}`,
            name: res.material.name,
            category: 'Banner outdoor',
            weight: res.material.name.includes('gram')
              ? res.material.name.split('gram')[0].trim().split(' ').pop() + 'g'
              : '340g',
            description: res.material.description || '',
            price: res.material.price_per_sqm,
            active: res.material.is_active,
            lastUpdated: `Baru saja oleh ${adminName}`,
          }
          setMaterials((prev) => [...prev, newMat])
        }
      } else {
        const res = await updateMaterialAction({
          id: editingMaterial.id,
          name: editingMaterial.name,
          description: editingMaterial.description,
          price_per_sqm: numericPrice,
          is_active: editingMaterial.active,
        })
        if (!res.success) {
          setModalError(res.error || 'Gagal memperbarui bahan.')
          setIsSavingModal(false)
          return
        }
        setMaterials((prev) =>
          prev.map((m) =>
            m.id === editingMaterial.id
              ? {
                  ...editingMaterial,
                  price: numericPrice,
                  lastUpdated: `Diperbarui baru saja oleh ${adminName}`,
                }
              : m
          )
        )
      }
      setIsModalOpen(false)
    } catch {
      setModalError('Terjadi kesalahan saat menyimpan bahan.')
    } finally {
      setIsSavingModal(false)
    }
  }

  const handleDeleteMaterial = async (matId: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus bahan ini dari katalog?')) return
    const res = await deleteMaterialAction(matId)
    if (!res.success) {
      alert(res.error || 'Gagal menghapus bahan.')
      return
    }
    if (res.error) {
      alert(res.error) // Notifikasi soft-delete jika ada transaksi
    }
    setMaterials((prev) => prev.filter((m) => m.id !== matId))
    if (isModalOpen) setIsModalOpen(false)
  }

  return (
    <div className="flex min-h-screen bg-slate-100 font-sans text-slate-900">
      {/* 1. Left Dark Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-50 flex w-64 flex-col justify-between bg-slate-950 p-5 text-white">
        <div>
          {/* Brand */}
          <Link href="/" className="inline-flex items-center gap-2.5">
            <span className="relative size-8 shrink-0 overflow-hidden rounded-lg shadow-sm">
              <Image
                src="/bannerku-logo.png"
                alt="Logo BannerKu"
                width={32}
                height={32}
                className="size-full object-cover"
                priority
              />
            </span>
            <div>
              <span className="text-lg font-black tracking-tight text-white">
                Banner<span className="text-blue-500">Ku</span>
              </span>
              <span className="block text-[9px] font-bold tracking-widest text-slate-400 uppercase">
                ADMIN PERCETAKAN
              </span>
            </div>
          </Link>

          {/* Navigation */}
          <div className="mt-8">
            <span className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
              OPERASIONAL
            </span>
            <nav className="mt-3 space-y-1 text-xs font-bold">
              <button
                type="button"
                suppressHydrationWarning
                onClick={() => {
                  setCurrentView('summary')
                  setOrderFilterTab('all')
                }}
                className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-left transition cursor-pointer ${
                  currentView === 'summary'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-slate-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
                Ringkasan Pesanan
              </button>

              <button
                type="button"
                suppressHydrationWarning
                onClick={() => {
                  setCurrentView('orders')
                  setOrderFilterTab('pending')
                }}
                className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-left transition cursor-pointer ${
                  currentView === 'orders'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-slate-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                  Kelola Pesanan Masuk
                </div>
                <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-300 font-mono">
                  {metrics.pendingOrders}
                </span>
              </button>

              <button
                type="button"
                suppressHydrationWarning
                onClick={() => setCurrentView('materials')}
                className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-left transition cursor-pointer ${
                  currentView === 'materials'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-slate-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                Katalog & Harga Bahan
              </button>

              <button
                type="button"
                suppressHydrationWarning
                className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-left text-slate-400 hover:bg-white/5 hover:text-white transition cursor-pointer"
              >
                <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                Pelanggan
              </button>

              <button
                type="button"
                suppressHydrationWarning
                className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-left text-slate-400 hover:bg-white/5 hover:text-white transition cursor-pointer"
              >
                <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Pengaturan
              </button>
            </nav>
          </div>

          {/* Green Status Card */}
          <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-emerald-400" />
              <strong className="text-xs font-bold text-white">Toko menerima pesanan</strong>
            </div>
            <p className="mt-1 text-[11px] leading-relaxed text-slate-400">
              Kelola pesanan dan harga cetak dalam satu ruang kerja.
            </p>
            <Link
              href="/"
              className="mt-3 inline-flex items-center gap-1 text-[11px] font-bold text-blue-400 hover:text-blue-300"
            >
              Lihat toko BannerKu ↗
            </Link>
          </div>
        </div>

        {/* User Card */}
        <div className="border-t border-slate-800 pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="grid size-8 place-items-center rounded-lg bg-purple-900/70 border border-purple-600/40 text-xs font-bold text-purple-200">
                {adminName.substring(0, 2).toUpperCase()}
              </span>
              <div>
                <strong className="block text-xs font-bold text-white">{adminName}</strong>
                <span className="text-[10px] text-slate-400">Administrator</span>
              </div>
            </div>
            <form action={logoutAction}>
              <button
                type="submit"
                suppressHydrationWarning
                title="Keluar (Logout)"
                className="grid size-8 place-items-center rounded-lg text-slate-400 hover:bg-white/10 hover:text-rose-400 transition cursor-pointer"
              >
                <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </form>
          </div>
          <span className="mt-3 block text-[10px] text-slate-500">BannerKu Admin · v1.0</span>
        </div>
      </aside>

      {/* 2. Main Area */}
      <div className="flex-1 pl-64">
        {/* Top Header */}
        <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-slate-200 bg-white px-8 text-xs">
          <div className="flex items-center gap-2 text-slate-500">
            <span>Admin</span>
            <span>›</span>
            <span className="font-bold text-slate-900">
              {currentView === 'summary'
                ? 'Ringkasan Pesanan'
                : currentView === 'orders'
                ? 'Kelola Pesanan Masuk'
                : 'Katalog & Harga Bahan'}
            </span>
          </div>

          <div className="flex items-center gap-4 text-slate-500">
            <div className="flex items-center gap-1.5 font-medium">
              <svg className="size-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span suppressHydrationWarning>
                {new Date().toLocaleDateString('id-ID', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </span>
            </div>
            <span className="grid size-7 place-items-center rounded-lg border border-slate-200 text-slate-600">
              🔔
            </span>
            <span className="font-bold text-slate-700 font-mono">WIB</span>
          </div>
        </header>

        {/* Content Body */}
        <main className="p-8">
          {/* VIEW 1: RINGKASAN PESANAN & KELOLA PESANAN MASUK */}
          {(currentView === 'summary' || currentView === 'orders') && (
            <div>
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-black tracking-tight text-slate-950">
                    {currentView === 'orders' ? 'Kelola Pesanan Masuk' : 'Ringkasan pesanan'}
                  </h1>
                  <p className="mt-1 text-xs text-slate-500">
                    {currentView === 'orders'
                      ? 'Kelola status pesanan, unduh file desain asli resolusi tinggi, dan teruskan ke percetakan.'
                      : 'Dari pesanan masuk hingga siap diambil. Semua dalam kendalimu.'}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    suppressHydrationWarning
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-2xs"
                  >
                    📅 {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </button>
                  <button
                    type="button"
                    suppressHydrationWarning
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50"
                  >
                    <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Ekspor laporan
                  </button>
                  <button
                    type="button"
                    suppressHydrationWarning
                    onClick={handleOpenNewOrderModal}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-purple-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-purple-700 transition cursor-pointer"
                  >
                    + Tambah pesanan
                  </button>
                </div>
              </div>

              {orderFeedback && (
                <div
                  className={`mt-4 flex items-center justify-between rounded-xl border px-4 py-2.5 text-xs font-medium ${
                    orderFeedback.type === 'success'
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                      : 'border-rose-200 bg-rose-50 text-rose-700'
                  }`}
                >
                  <span>{orderFeedback.message}</span>
                  <button
                    type="button"
                    suppressHydrationWarning
                    onClick={() => setOrderFeedback(null)}
                    className="ml-4 font-bold opacity-70 hover:opacity-100 cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* 4 Stat Cards */}
              <div className="mt-6 grid grid-cols-4 gap-4">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-500">Pesanan Hari Ini</span>
                    <span className="grid size-7 place-items-center rounded-lg bg-purple-50 text-purple-600">
                      📦
                    </span>
                  </div>
                  <div className="mt-2 text-3xl font-black text-slate-950 font-mono">
                    {metrics.todayOrders}
                  </div>
                  <span className="mt-1 block text-[11px] text-slate-400">Masuk pada 8 November</span>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-500">Perlu Konfirmasi</span>
                    <span className="grid size-7 place-items-center rounded-lg bg-amber-50 text-amber-600">
                      ⏰
                    </span>
                  </div>
                  <div className="mt-2 text-3xl font-black text-slate-950 font-mono">
                    {metrics.pendingOrders}
                  </div>
                  <span className="mt-1 block text-[11px] text-slate-400">Menunggu pemeriksaan desain</span>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-500">Sedang Produksi</span>
                    <span className="grid size-7 place-items-center rounded-lg bg-blue-50 text-blue-600">
                      🖨️
                    </span>
                  </div>
                  <div className="mt-2 text-3xl font-black text-slate-950 font-mono">
                    {metrics.processingOrders}
                  </div>
                  <span className="mt-1 block text-[11px] text-slate-400">Dalam antrean cetak aktif</span>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-500">Omset Bulan Ini</span>
                    <span className="grid size-7 place-items-center rounded-lg bg-emerald-50 text-emerald-600">
                      💳
                    </span>
                  </div>
                  <div className="mt-2 text-2xl font-black text-slate-950 font-mono">
                    {rupiah.format(metrics.revenue)}
                  </div>
                  <span className="mt-1 block text-[11px] text-slate-400">1–8 November 2026</span>
                </div>
              </div>

              {/* Table Card */}
              <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-bold text-slate-950">Antrean pesanan masuk</h2>
                      <span className="rounded-full bg-purple-50 px-2 py-0.5 text-[10px] font-bold text-purple-700">
                        {orders.length} pesanan
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-slate-500">
                      Prioritaskan konfirmasi, lalu teruskan ke tim produksi.
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="relative w-64">
                      <input
                        type="text"
                        suppressHydrationWarning
                        placeholder="Cari ID, nama, atau nomor HP"
                        value={orderSearch}
                        onChange={(e) => setOrderSearch(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-8 pr-3 py-1.5 text-xs focus:border-purple-600 focus:outline-none"
                      />
                      <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Filter Tabs */}
                <div className="mt-4 flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      suppressHydrationWarning
                      onClick={() => setOrderFilterTab('all')}
                      className={`rounded-full px-3 py-1 text-xs font-bold transition ${
                        orderFilterTab === 'all'
                          ? 'bg-purple-600 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      Semua {orders.length}
                    </button>
                    <button
                      type="button"
                      suppressHydrationWarning
                      onClick={() => setOrderFilterTab('pending')}
                      className={`rounded-full px-3 py-1 text-xs font-bold transition ${
                        orderFilterTab === 'pending'
                          ? 'bg-purple-600 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      Perlu konfirmasi {metrics.pendingOrders}
                    </button>
                    <button
                      type="button"
                      suppressHydrationWarning
                      onClick={() => setOrderFilterTab('processing')}
                      className={`rounded-full px-3 py-1 text-xs font-bold transition ${
                        orderFilterTab === 'processing'
                          ? 'bg-purple-600 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      Produksi {metrics.processingOrders}
                    </button>
                  </div>

                  <span className="text-xs text-slate-500 font-medium">Perlu konfirmasi dahulu ▾</span>
                </div>

                {/* Orders Table */}
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-slate-200 bg-slate-50/70 font-bold text-slate-600">
                      <tr>
                        <th className="py-3 px-3">ID Pesanan</th>
                        <th className="py-3 px-3">Pelanggan</th>
                        <th className="py-3 px-3">Bahan</th>
                        <th className="py-3 px-3">Dimensi</th>
                        <th className="py-3 px-3">Preview Desain</th>
                        <th className="py-3 px-3">Bukti Pembayaran</th>
                        <th className="py-3 px-3">Snapshot Total Harga</th>
                        <th className="py-3 px-3">Status</th>
                        <th className="py-3 px-3">Aksi operasional</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {filteredOrders.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="py-14 text-center">
                            <div className="flex flex-col items-center justify-center text-slate-400">
                              <span className="grid size-12 place-items-center rounded-2xl bg-slate-100 text-2xl mb-3">
                                📦
                              </span>
                              <p className="text-sm font-bold text-slate-800">Belum ada antrean pesanan</p>
                              <p className="text-xs text-slate-400 mt-1 max-w-sm">
                                Pesanan baru yang dibuat konsumen melalui Studio akan otomatis tercatat di sini secara real-time.
                              </p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        filteredOrders.map((ord) => (
                          <tr key={ord.id} className="hover:bg-slate-50/70 transition">
                            <td className="py-3 px-3 font-mono">
                              <strong className="block text-slate-900">{ord.orderNumber}</strong>
                              <span className="text-[10px] text-slate-400">{ord.createdAt}</span>
                            </td>
                            <td className="py-3 px-3">
                              <strong className="block text-slate-900">{ord.customerName}</strong>
                              <span className="text-[10px] text-slate-400 font-mono">{ord.customerPhone}</span>
                            </td>
                            <td className="py-3 px-3 font-medium text-slate-800">{ord.material}</td>
                            <td className="py-3 px-3 font-mono">
                              <strong className="block text-slate-900">{ord.width} × {ord.height} cm</strong>
                              <span className="text-[10px] text-slate-400">
                                {(ord.areaSqm ?? (ord.width * ord.height) / 10000).toFixed(2)} m² × {ord.quantity ?? 1} pcs
                              </span>
                            </td>
                            <td className="py-3 px-3">
                              <div className="flex items-center gap-2">
                                <div className="relative size-10 shrink-0 overflow-hidden rounded border border-slate-200 bg-slate-100 flex items-center justify-center">
                                  {ord.preview ? (
                                    /* eslint-disable-next-line @next/next/no-img-element */
                                    <img
                                      src={ord.preview}
                                      alt="Preview Desain"
                                      className="h-full w-full object-cover"
                                    />
                                  ) : (
                                    <span className="text-[10px] font-bold text-slate-400">—</span>
                                  )}
                                </div>
                                <span className="text-[10px] text-slate-500 font-mono">{ord.fileSize}</span>
                              </div>
                            </td>
                            <td className="py-3 px-3">
                              {ord.paymentProofUrl ? (
                                <button
                                  type="button"
                                  suppressHydrationWarning
                                  onClick={() => setSelectedProofOrder(ord)}
                                  className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50/70 px-2.5 py-1.5 text-[11px] font-bold text-emerald-800 hover:bg-emerald-100 transition cursor-pointer"
                                >
                                  <span className="size-7 shrink-0 overflow-hidden rounded border border-emerald-200 bg-white block">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                      src={ord.paymentProofUrl}
                                      alt="Thumbnail Bukti Bayar"
                                      className="h-full w-full object-cover"
                                    />
                                  </span>
                                  <span>Lihat Bukti</span>
                                </button>
                              ) : (
                                <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-400">
                                  Belum ada bukti
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-3">
                              <strong className="block text-slate-900 font-mono">{rupiah.format(ord.total)}</strong>
                              <span className="text-[10px] text-slate-400">🔒 Saat pemesanan</span>
                            </td>
                            <td className="py-3 px-3">
                              <select
                                suppressHydrationWarning
                                value={ord.status}
                                onChange={(e) => handleStatusChange(ord.id, e.target.value as OrderStatus)}
                                className={`rounded-full px-2.5 py-1 text-[11px] font-bold border outline-none cursor-pointer ${
                                  ord.status === 'pending'
                                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                                    : ord.status === 'confirmed'
                                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                                    : ord.status === 'processing'
                                    ? 'bg-purple-50 text-purple-700 border-purple-200'
                                    : ord.status === 'completed'
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : 'bg-rose-50 text-rose-700 border-rose-200'
                                }`}
                              >
                                <option value="pending">● Pending</option>
                                <option value="confirmed">● Confirmed</option>
                                <option value="processing">● Processing</option>
                                <option value="completed">● Completed</option>
                                <option value="cancelled">● Cancelled</option>
                              </select>
                            </td>
                            <td className="py-3 px-3">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <button
                                  type="button"
                                  suppressHydrationWarning
                                  onClick={() => handleOpenEditOrderModal(ord)}
                                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:border-purple-300 hover:text-purple-700 transition cursor-pointer"
                                  title="Edit detail & ukuran pesanan"
                                >
                                  Edit
                                </button>
                                {(ord.originalFilePath || ord.preview) && (
                                  <button
                                    type="button"
                                    suppressHydrationWarning
                                    onClick={() => handleDownloadDesign(ord)}
                                    className="inline-flex items-center gap-1 rounded-lg border border-purple-200 bg-purple-50 px-2.5 py-1 text-[11px] font-bold text-purple-700 hover:bg-purple-100 transition cursor-pointer"
                                    title="Download File Desain Asli (Resolusi Tinggi)"
                                  >
                                    <svg className="size-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                    </svg>
                                    Desain
                                  </button>
                                )}
                                <button
                                  type="button"
                                  suppressHydrationWarning
                                  onClick={() => handleOpenDeleteOrderModal(ord)}
                                  className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-[11px] font-bold text-rose-700 hover:bg-rose-100 transition cursor-pointer"
                                  title="Hapus pesanan ini"
                                >
                                  Hapus
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4 text-xs text-slate-400">
                  <span>
                    Menampilkan {filteredOrders.length > 0 ? `1–${filteredOrders.length}` : '0'} dari {orders.length} pesanan
                  </span>
                  <div className="flex items-center gap-1">
                    <span className="grid size-6 place-items-center rounded bg-purple-600 text-white font-bold">1</span>
                  </div>
                </div>
              </div>

              {/* Bottom Verification Banner */}
              <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <span className="grid size-8 place-items-center rounded-xl bg-purple-50 text-purple-600 shrink-0">
                      📄
                    </span>
                    <div>
                      <strong className="block text-xs font-bold text-slate-900">
                        Periksa file asli sebelum konfirmasi
                      </strong>
                      <p className="mt-0.5 text-xs text-slate-500">
                        Gunakan file desain asli beresolusi tinggi untuk produksi, bukan gambar preview. Pastikan ukuran, ketajaman, dan area aman sesuai spesifikasi pesanan.
                      </p>
                    </div>
                  </div>
                  <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-mono text-slate-600 font-bold">
                    #BK-202611-007
                  </span>
                </div>

                <div className="mt-4 flex flex-wrap gap-4 text-xs font-semibold text-slate-700">
                  <span className="inline-flex items-center gap-1 text-purple-600">✓ Unduh file asli</span>
                  <span className="inline-flex items-center gap-1 text-purple-600">✓ Periksa resolusi & dimensi</span>
                  <span className="inline-flex items-center gap-1 text-purple-600">✓ Konfirmasi untuk produksi</span>
                </div>

                <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs text-slate-600 flex items-center gap-2">
                  <span>🔒</span>
                  <span>
                    <strong>Snapshot total harga tetap tersimpan.</strong> Perubahan harga katalog tidak mengubah pesanan yang sudah dibuat.
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* VIEW 2: KATALOG & HARGA BAHAN */}
          {currentView === 'materials' && (
            <div>
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-black tracking-tight text-slate-950">Katalog & harga bahan</h1>
                  <p className="mt-1 text-xs text-slate-500">
                    Atur bahan, perbarui harga, dan tentukan pilihan yang tampil di toko.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    suppressHydrationWarning
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50"
                  >
                    Ekspor katalog
                  </button>
                  <button
                    type="button"
                    suppressHydrationWarning
                    onClick={handleOpenAddModal}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-purple-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-purple-700 cursor-pointer"
                  >
                    + Tambah bahan
                  </button>
                </div>
              </div>

              {/* 3 Stat Cards */}
              <div className="mt-6 grid grid-cols-3 gap-5">
                <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <span className="grid size-10 place-items-center rounded-xl bg-purple-50 text-purple-600 text-base">
                    📦
                  </span>
                  <div>
                    <span className="text-xs text-slate-500">Total bahan</span>
                    <div className="text-2xl font-black text-slate-950 font-mono">
                      {metrics.totalMaterials}
                    </div>
                    <span className="text-[10px] text-slate-400">Dalam katalog percetakan</span>
                  </div>
                </div>

                <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <span className="grid size-10 place-items-center rounded-xl bg-emerald-50 text-emerald-600 text-base">
                    ✓
                  </span>
                  <div>
                    <span className="text-xs text-slate-500">Bahan aktif</span>
                    <div className="text-2xl font-black text-slate-950 font-mono">
                      {metrics.activeMaterials}
                    </div>
                    <span className="text-[10px] text-slate-400">Tampil di pilihan pemesanan</span>
                  </div>
                </div>

                <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <span className="grid size-10 place-items-center rounded-xl bg-slate-100 text-slate-500 text-base">
                    👁️‍🗨️
                  </span>
                  <div>
                    <span className="text-xs text-slate-500">Bahan nonaktif</span>
                    <div className="text-2xl font-black text-slate-950 font-mono">
                      {metrics.inactiveMaterials}
                    </div>
                    <span className="text-[10px] text-slate-400">Disembunyikan dari toko</span>
                  </div>
                </div>
              </div>

              {/* Alert Info Banner */}
              <div className="mt-6 flex items-center justify-between rounded-xl border border-blue-200 bg-blue-50/70 p-3.5 text-xs text-blue-900">
                <div className="flex items-center gap-2">
                  <span className="text-blue-600">🛡️</span>
                  <span>
                    <strong>Harga baru hanya berlaku untuk pesanan baru.</strong> Snapshot total harga pesanan yang sudah dibuat tidak berubah saat harga katalog diperbarui.
                  </span>
                </div>
                <span className="font-mono font-bold text-blue-700">Rupiah / m²</span>
              </div>

              {/* Materials Table Card */}
              <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                  <div>
                    <h2 className="text-base font-bold text-slate-950">Daftar bahan percetakan</h2>
                    <p className="mt-0.5 text-xs text-slate-500">
                      Edit harga langsung di tabel, atau buka Edit untuk rincian bahan.
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="relative w-64">
                      <input
                        type="text"
                        suppressHydrationWarning
                        placeholder="Cari nama atau kode bahan"
                        value={materialSearch}
                        onChange={(e) => setMaterialSearch(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-8 pr-3 py-1.5 text-xs focus:border-purple-600 focus:outline-none"
                      />
                      <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <span className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700">
                      Semua kategori ▾
                    </span>
                  </div>
                </div>

                {/* Filter Tabs */}
                <div className="mt-4 flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      suppressHydrationWarning
                      onClick={() => setMaterialFilterTab('all')}
                      className={`rounded-full px-3 py-1 text-xs font-bold transition ${
                        materialFilterTab === 'all'
                          ? 'bg-purple-600 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      Semua bahan {materials.length}
                    </button>
                    <button
                      type="button"
                      suppressHydrationWarning
                      onClick={() => setMaterialFilterTab('active')}
                      className={`rounded-full px-3 py-1 text-xs font-bold transition ${
                        materialFilterTab === 'active'
                          ? 'bg-purple-600 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      Aktif {metrics.activeMaterials}
                    </button>
                    <button
                      type="button"
                      suppressHydrationWarning
                      onClick={() => setMaterialFilterTab('inactive')}
                      className={`rounded-full px-3 py-1 text-xs font-bold transition ${
                        materialFilterTab === 'inactive'
                          ? 'bg-purple-600 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      Nonaktif {metrics.inactiveMaterials}
                    </button>
                  </div>

                  <span className="text-xs text-purple-600 font-semibold">● 1 baris dalam mode edit cepat</span>
                </div>

                {/* Table */}
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-slate-200 bg-slate-50/70 font-bold text-slate-600">
                      <tr>
                        <th className="py-3 px-3">Nama bahan</th>
                        <th className="py-3 px-3">Deskripsi & kategori</th>
                        <th className="py-3 px-3">Harga per m²</th>
                        <th className="py-3 px-3">Ketersediaan</th>
                        <th className="py-3 px-3">Terakhir diperbarui</th>
                        <th className="py-3 px-3">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {filteredMaterials.map((mat) => {
                        const isQuickEditing = quickEditId === mat.id

                        return (
                          <tr key={mat.id} className="hover:bg-slate-50/70 transition">
                            <td className="py-3 px-3">
                              <div className="flex items-center gap-2.5">
                                <span className="grid size-8 place-items-center rounded-lg bg-purple-50 text-purple-600 text-xs">
                                  📦
                                </span>
                                <div>
                                  <strong className="block text-slate-900 font-bold">{mat.name}</strong>
                                  <span className="text-[10px] text-slate-400 font-mono">{mat.code}</span>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-3 max-w-xs">
                              <p className="truncate text-slate-900">{mat.description}</p>
                              <span className="text-[10px] text-slate-400">{mat.category}</span>
                            </td>
                            <td className="py-3 px-3">
                              {isQuickEditing ? (
                                <div>
                                  <div className="flex items-center rounded-lg border-2 border-purple-600 bg-white px-2 py-1 shadow-xs">
                                    <span className="text-[11px] font-bold text-slate-400 mr-1">Rp</span>
                                    <NumericInput
                                      placeholder="25000"
                                      value={quickEditPrice}
                                      onValueChange={setQuickEditPrice}
                                      className="w-20 font-bold font-mono text-xs outline-none"
                                    />
                                    <span className="text-[10px] text-slate-400">/m²</span>
                                  </div>
                                  <span className="text-[9px] text-purple-600 mt-0.5 block">Edit cepat · harga per m²</span>
                                </div>
                              ) : (
                                <strong className="font-mono text-slate-900 text-xs">{rupiah.format(mat.price)}</strong>
                              )}
                            </td>
                            <td className="py-3 px-3">
                              <label className="inline-flex items-center gap-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  suppressHydrationWarning
                                  checked={mat.active}
                                  onChange={() => handleToggleMaterial(mat.id)}
                                  className="sr-only peer"
                                />
                                <div className="w-8 h-4 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[1px] after:left-[1px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-purple-600 relative"></div>
                                <span className={`text-[11px] font-bold ${mat.active ? 'text-purple-600' : 'text-slate-400'}`}>
                                  {mat.active ? 'Aktif' : 'Nonaktif'}
                                </span>
                              </label>
                            </td>
                            <td className="py-3 px-3 text-slate-500 text-[11px]">{mat.lastUpdated}</td>
                            <td className="py-3 px-3">
                              {isQuickEditing ? (
                                <div className="flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    suppressHydrationWarning
                                    onClick={() => handleSaveQuickPrice(mat.id)}
                                    className="rounded-lg bg-purple-600 px-2.5 py-1 text-xs font-bold text-white hover:bg-purple-700"
                                  >
                                    ✓ Simpan
                                  </button>
                                  <button
                                    type="button"
                                    suppressHydrationWarning
                                    onClick={() => setQuickEditId(null)}
                                    className="rounded-lg border border-slate-200 p-1 text-slate-400 hover:text-slate-600"
                                  >
                                    ✕
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    suppressHydrationWarning
                                    onClick={() => handleOpenEditModal(mat)}
                                    className="rounded-lg border border-slate-200 px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-50"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    type="button"
                                    suppressHydrationWarning
                                    onClick={() => {
                                      setQuickEditId(mat.id)
                                      setQuickEditPrice(mat.price)
                                    }}
                                    className="text-slate-400 hover:text-slate-600 p-1"
                                  >
                                    •••
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4 text-xs text-slate-400">
                  <span>Menampilkan seluruh {materials.length} bahan</span>
                  <span>(i) Semua harga dalam rupiah per meter persegi (m²).</span>
                </div>
              </div>

              {/* Bottom Guidance Cards */}
              <div className="mt-6 grid grid-cols-2 gap-4 text-xs text-slate-600">
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm flex items-start gap-3">
                  <span className="text-slate-400 text-sm">👁️‍🗨️</span>
                  <div>
                    <strong className="block text-slate-900 font-bold">Nonaktif bukan berarti dihapus</strong>
                    Bahan nonaktif tidak muncul di toko. Riwayat pesanan dan harga tersimpan tetap aman.
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm flex items-start gap-3">
                  <span className="text-purple-600 text-sm">✏️</span>
                  <div>
                    <strong className="block text-slate-900 font-bold">Perubahan tetap dalam kendali</strong>
                    Tekan Simpan pada baris untuk menerapkan harga. Gunakan Edit untuk mengubah nama dan deskripsi.
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* 3. Full Modal Tambah / Edit Bahan */}
      {isModalOpen && editingMaterial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <span className="grid size-9 place-items-center rounded-xl bg-purple-50 text-purple-600">
                  📦
                </span>
                <div>
                  <h3 className="text-base font-extrabold text-slate-950">
                    {isNewMaterial ? 'Tambah bahan baru' : 'Edit bahan'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {isNewMaterial
                      ? 'Daftarkan jenis bahan banner baru ke katalog toko percetakan.'
                      : 'Perbarui informasi, harga, dan ketersediaan bahan di toko.'}
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-mono font-bold text-slate-400">{editingMaterial.code}</span>
            </div>

            {modalError && (
              <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
                {modalError}
              </div>
            )}

            <div className="mt-5 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700">Nama bahan *</label>
                <input
                  type="text"
                  suppressHydrationWarning
                  placeholder="Contoh: Flexi Jerman 510 gram"
                  value={editingMaterial.name}
                  onChange={(e) => setEditingMaterial({ ...editingMaterial, name: e.target.value })}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 font-medium text-slate-900 focus:border-purple-600 focus:outline-none"
                />
              </div>

              <div>
                <div className="flex justify-between">
                  <label className="block font-bold text-slate-700">Deskripsi</label>
                  <span className="text-slate-400 font-mono text-[10px]">
                    {editingMaterial.description ? editingMaterial.description.length : 0} / 200
                  </span>
                </div>
                <textarea
                  rows={3}
                  suppressHydrationWarning
                  placeholder="Deskripsi keunggulan dan peruntukan bahan..."
                  value={editingMaterial.description || ''}
                  onChange={(e) => setEditingMaterial({ ...editingMaterial, description: e.target.value })}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 font-medium text-slate-900 focus:border-purple-600 focus:outline-none"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">Ditampilkan kepada pelanggan saat memilih bahan.</span>
              </div>

              <div>
                <label className="block font-bold text-slate-700">Harga per m² *</label>
                <div className="relative mt-1.5 flex items-center rounded-xl border border-slate-200 px-3.5 py-2.5 focus-within:border-purple-600">
                  <span className="font-bold text-slate-400 mr-2">Rp</span>
                  <NumericInput
                    placeholder="25000"
                    value={editingMaterial.price}
                    onValueChange={(val) => setEditingMaterial({ ...editingMaterial, price: val })}
                    className="w-full font-bold font-mono text-slate-900 outline-none text-xs"
                  />
                  <span className="text-slate-400 font-medium">/ m²</span>
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">Masukkan nominal per m² (tidak boleh negatif).</span>
              </div>

              <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                <div>
                  <strong className="block text-slate-900 font-bold">Status bahan</strong>
                  <span className="text-[11px] text-slate-400">Bahan aktif ditampilkan di pilihan pemesanan.</span>
                </div>
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <span className={`text-xs font-bold ${editingMaterial.active ? 'text-purple-600' : 'text-slate-400'}`}>
                    {editingMaterial.active ? 'Aktif' : 'Nonaktif'}
                  </span>
                  <input
                    type="checkbox"
                    suppressHydrationWarning
                    checked={editingMaterial.active}
                    onChange={(e) => setEditingMaterial({ ...editingMaterial, active: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600 relative"></div>
                </label>
              </div>

              <div className="rounded-xl border border-blue-100 bg-blue-50/70 p-3 text-[11px] text-blue-900 flex items-start gap-2">
                <span>🛡️</span>
                <span>
                  Perubahan harga tersimpan aman di database dan hanya berlaku untuk pesanan baru.
                </span>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
              <div>
                {!isNewMaterial && (
                  <button
                    type="button"
                    suppressHydrationWarning
                    onClick={() => handleDeleteMaterial(editingMaterial.id)}
                    className="rounded-xl border border-rose-200 px-3.5 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                  >
                    Hapus bahan
                  </button>
                )}
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  suppressHydrationWarning
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSavingModal}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="button"
                  suppressHydrationWarning
                  onClick={handleSaveModal}
                  disabled={isSavingModal}
                  className="rounded-xl bg-purple-600 px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-purple-700 cursor-pointer disabled:opacity-50"
                >
                  {isSavingModal
                    ? 'Menyimpan...'
                    : isNewMaterial
                    ? '+ Tambahkan bahan'
                    : '✓ Simpan perubahan'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. Modal Verifikasi Bukti Pembayaran Pelanggan */}
      {selectedProofOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-blue-700">
                    Verifikasi Pembayaran
                  </span>
                  <span className="font-mono text-xs font-extrabold text-slate-900">
                    {selectedProofOrder.orderNumber}
                  </span>
                </div>
                <h3 className="mt-1.5 text-base font-extrabold text-slate-950">
                  Bukti Pembayaran — {selectedProofOrder.customerName}
                </h3>
                <p className="text-xs text-slate-500">
                  Cocokkan nominal transfer dengan total tagihan terkunci sebelum mengubah status ke Confirmed.
                </p>
              </div>

              <button
                type="button"
                suppressHydrationWarning
                onClick={() => setSelectedProofOrder(null)}
                aria-label="Tutup modal bukti pembayaran"
                className="grid size-8 place-items-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-900 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-12">
              {/* Gambar Bukti Transfer */}
              <div className="md:col-span-7 flex flex-col">
                <div className="flex items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-950/95 p-3 min-h-[260px] max-h-[60vh]">
                  {selectedProofOrder.paymentProofUrl ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={selectedProofOrder.paymentProofUrl}
                      alt={`Bukti Pembayaran ${selectedProofOrder.orderNumber}`}
                      className="max-h-[55vh] w-auto rounded-lg object-contain"
                    />
                  ) : (
                    <span className="text-xs text-slate-400">
                      Gambar bukti pembayaran tidak tersedia.
                    </span>
                  )}
                </div>

                {selectedProofOrder.paymentProofUrl && (
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                    <a
                      href={selectedProofOrder.paymentProofUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-bold text-slate-700 hover:bg-slate-50 transition"
                    >
                      Buka Resolusi Penuh ↗
                    </a>
                    <a
                      href={selectedProofOrder.paymentProofUrl}
                      download={`Bukti-Bayar-${selectedProofOrder.orderNumber.replace(/[^a-zA-Z0-9_-]/g, '')}`}
                      className="inline-flex items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 font-bold text-blue-700 hover:bg-blue-100 transition"
                    >
                      Unduh Bukti ⬇
                    </a>
                  </div>
                )}
              </div>

              {/* Ringkasan Tagihan & Detail Pelanggan */}
              <div className="md:col-span-5 flex flex-col justify-between space-y-4">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3 text-xs">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      TOTAL TAGIHAN SERVER
                    </span>
                    <strong className="mt-0.5 block text-2xl font-black font-mono text-slate-950">
                      {rupiah.format(selectedProofOrder.total)}
                    </strong>
                  </div>

                  <div className="space-y-2 border-t border-slate-200/80 pt-3">
                    <div className="flex justify-between gap-2">
                      <span className="text-slate-500">Pemesan</span>
                      <strong className="text-slate-900 text-right">{selectedProofOrder.customerName}</strong>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className="text-slate-500">WhatsApp</span>
                      <strong className="font-mono text-slate-900">{selectedProofOrder.customerPhone}</strong>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className="text-slate-500">Bahan</span>
                      <strong className="text-slate-900 text-right">{selectedProofOrder.material}</strong>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className="text-slate-500">Ukuran</span>
                      <strong className="font-mono text-slate-900">
                        {selectedProofOrder.width} × {selectedProofOrder.height} cm · {selectedProofOrder.quantity ?? 1} pcs
                      </strong>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className="text-slate-500">Status Saat Ini</span>
                      <strong className="uppercase font-mono text-purple-700">{selectedProofOrder.status}</strong>
                    </div>
                    {selectedProofOrder.notes && (
                      <div className="border-t border-slate-200/80 pt-2">
                        <span className="block text-[10px] font-bold text-slate-500 mb-0.5">
                          Catatan Finishing:
                        </span>
                        <p className="text-slate-800">{selectedProofOrder.notes}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  {selectedProofOrder.status === 'pending' && (
                    <button
                      type="button"
                      suppressHydrationWarning
                      disabled={isUpdatingProofStatus}
                      onClick={() => handleConfirmPaymentFromModal(selectedProofOrder)}
                      className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition cursor-pointer disabled:opacity-50"
                    >
                      {isUpdatingProofStatus
                        ? 'Menyimpan Status...'
                        : '✓ Konfirmasi Pembayaran (Confirmed)'}
                    </button>
                  )}

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      suppressHydrationWarning
                      onClick={() => {
                        const target = selectedProofOrder
                        setSelectedProofOrder(null)
                        handleOpenEditOrderModal(target)
                      }}
                      className="flex items-center justify-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                    >
                      Edit Pesanan
                    </button>
                    <button
                      type="button"
                      suppressHydrationWarning
                      onClick={() => handleOpenDeleteOrderModal(selectedProofOrder)}
                      className="flex items-center justify-center rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100 transition cursor-pointer"
                    >
                      Hapus Pesanan
                    </button>
                  </div>

                  <button
                    type="button"
                    suppressHydrationWarning
                    onClick={() => setSelectedProofOrder(null)}
                    className="flex w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                  >
                    Tutup
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. Modal Tambah / Edit Pesanan (CRUD Create & Update) */}
      {isOrderModalOpen && editingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl max-h-[92vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <span className="grid size-9 place-items-center rounded-xl bg-purple-50 text-purple-600">
                  🧾
                </span>
                <div>
                  <h3 className="text-base font-extrabold text-slate-950">
                    {isNewOrder ? 'Tambah Pesanan Manual' : 'Edit Detail Pesanan'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {isNewOrder
                      ? 'Catat pesanan offline/WhatsApp langsung dengan kalkulasi harga baku percetakan.'
                      : 'Perbarui data pemesan, bahan, ukuran, atau status. Harga otomatis dihitung ulang oleh server.'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                suppressHydrationWarning
                onClick={() => setIsOrderModalOpen(false)}
                className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-bold text-slate-500 hover:bg-slate-50 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {orderModalError && (
              <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-medium text-rose-700">
                {orderModalError}
              </div>
            )}

            <div className="mt-5 space-y-4 text-xs">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block font-bold text-slate-700">Nama Pemesan *</label>
                  <input
                    type="text"
                    suppressHydrationWarning
                    placeholder="Contoh: Budi Santoso"
                    value={editingOrder.customerName}
                    onChange={(e) =>
                      setEditingOrder({ ...editingOrder, customerName: e.target.value })
                    }
                    className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 font-medium text-slate-900 focus:border-purple-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700">Nomor WhatsApp *</label>
                  <input
                    type="tel"
                    suppressHydrationWarning
                    placeholder="081234567890"
                    value={editingOrder.whatsappNumber}
                    onChange={(e) =>
                      setEditingOrder({ ...editingOrder, whatsappNumber: e.target.value })
                    }
                    className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 font-mono font-medium text-slate-900 focus:border-purple-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block font-bold text-slate-700">Bahan Cetak *</label>
                  <select
                    suppressHydrationWarning
                    value={editingOrder.materialId}
                    onChange={(e) =>
                      setEditingOrder({ ...editingOrder, materialId: e.target.value })
                    }
                    className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 font-medium text-slate-900 focus:border-purple-600 focus:outline-none"
                  >
                    {orderModalMaterials.map((mat) => (
                      <option key={mat.id} value={mat.id}>
                        {mat.name} ({rupiah.format(mat.price)}/m²)
                        {!mat.active ? ' [Nonaktif]' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700">Status Pesanan</label>
                  <select
                    suppressHydrationWarning
                    value={editingOrder.status}
                    onChange={(e) =>
                      setEditingOrder({
                        ...editingOrder,
                        status: e.target.value as OrderStatus,
                      })
                    }
                    className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 font-bold text-slate-900 focus:border-purple-600 focus:outline-none"
                  >
                    <option value="pending">● Pending</option>
                    <option value="confirmed">● Confirmed</option>
                    <option value="processing">● Processing</option>
                    <option value="completed">● Completed</option>
                    <option value="cancelled">● Cancelled</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700">Lebar (cm) *</label>
                  <NumericInput
                    placeholder="200"
                    value={editingOrder.width}
                    onValueChange={(val) =>
                      setEditingOrder({ ...editingOrder, width: val })
                    }
                    className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 font-mono font-bold text-slate-900 focus:border-purple-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700">Tinggi (cm) *</label>
                  <NumericInput
                    placeholder="100"
                    value={editingOrder.height}
                    onValueChange={(val) =>
                      setEditingOrder({ ...editingOrder, height: val })
                    }
                    className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 font-mono font-bold text-slate-900 focus:border-purple-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700">Jumlah (pcs) *</label>
                  <NumericInput
                    placeholder="1"
                    value={editingOrder.quantity}
                    onValueChange={(val) =>
                      setEditingOrder({ ...editingOrder, quantity: val })
                    }
                    className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 font-mono font-bold text-slate-900 focus:border-purple-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between">
                  <label className="block font-bold text-slate-700">Catatan / Finishing</label>
                  <span className="text-[10px] font-mono text-slate-400">
                    {editingOrder.notes.length} / 500
                  </span>
                </div>
                <textarea
                  rows={2}
                  suppressHydrationWarning
                  placeholder="Contoh: Mata ayam 4 sudut, lipat tepi rapi..."
                  value={editingOrder.notes}
                  onChange={(e) =>
                    setEditingOrder({ ...editingOrder, notes: e.target.value })
                  }
                  className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2 font-medium text-slate-900 focus:border-purple-600 focus:outline-none"
                />
              </div>

              {orderModalPreview && (
                <div className="rounded-xl border border-purple-100 bg-purple-50/70 p-4 flex items-center justify-between">
                  <div>
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-purple-700">
                      Estimasi Kalkulasi Server
                    </span>
                    <span className="mt-0.5 block text-[11px] text-slate-600 font-mono">
                      {orderModalPreview.areaSqm.toFixed(2)} m² ×{' '}
                      {orderModalPreview.quantity} pcs ×{' '}
                      {rupiah.format(orderModalPreview.material.price)}/m²
                    </span>
                  </div>
                  <strong className="text-lg font-black font-mono text-slate-950">
                    {rupiah.format(orderModalPreview.totalPrice)}
                  </strong>
                </div>
              )}
            </div>

            <div className="mt-6 flex items-center justify-end gap-2.5 border-t border-slate-100 pt-4">
              <button
                type="button"
                suppressHydrationWarning
                onClick={() => setIsOrderModalOpen(false)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                suppressHydrationWarning
                disabled={isSavingOrderModal}
                onClick={handleSaveOrderModal}
                className="rounded-xl bg-purple-600 px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-purple-700 disabled:opacity-50 cursor-pointer"
              >
                {isSavingOrderModal
                  ? 'Menyimpan...'
                  : isNewOrder
                  ? 'Buat Pesanan'
                  : 'Simpan Perubahan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Modal Konfirmasi Hapus Pesanan (CRUD Delete) */}
      {deletingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-start gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-rose-50 text-rose-600 text-lg">
                🗑️
              </span>
              <div>
                <h3 className="text-base font-extrabold text-slate-950">
                  Hapus Pesanan Secara Permanen?
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-slate-500">
                  Pesanan <strong className="font-mono text-slate-900">{deletingOrder.orderNumber}</strong>{' '}
                  atas nama <strong className="text-slate-900">{deletingOrder.customerName}</strong>{' '}
                  senilai <strong className="font-mono text-slate-900">{rupiah.format(deletingOrder.total)}</strong>{' '}
                  akan dihapus permanen dari database.
                </p>
                {deletingOrder.paymentProofPath && (
                  <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-[11px] font-medium text-amber-800">
                    ⚠️ Lampiran bukti pembayaran pada storage privat juga akan ikut dihapus.
                  </p>
                )}
              </div>
            </div>

            {deleteOrderError && (
              <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-medium text-rose-700">
                {deleteOrderError}
              </div>
            )}

            <div className="mt-6 flex items-center justify-end gap-2.5">
              <button
                type="button"
                suppressHydrationWarning
                disabled={isDeletingOrder}
                onClick={() => {
                  setDeleteOrderError(null)
                  setDeletingOrder(null)
                }}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                suppressHydrationWarning
                disabled={isDeletingOrder}
                onClick={handleConfirmDeleteOrder}
                className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-rose-700 cursor-pointer disabled:opacity-50"
              >
                {isDeletingOrder ? 'Menghapus...' : 'Ya, Hapus Permanen'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
