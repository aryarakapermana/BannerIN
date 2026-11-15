'use client'

import { Order } from '@/domain'
import type { OrderStatus } from '@/types/database'

const BADGE_CLASSES: Record<
  'amber' | 'indigo' | 'blue' | 'emerald' | 'rose',
  string
> = {
  amber: 'border-amber-200 bg-amber-50 text-amber-700',
  indigo: 'border-indigo-200 bg-indigo-50 text-indigo-700',
  blue: 'border-blue-200 bg-blue-50 text-blue-700',
  emerald: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  rose: 'border-rose-200 bg-rose-50 text-rose-700',
}

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const meta = Order.getCustomerStatusMeta(status)
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-0.5 text-[11px] font-bold ${
        BADGE_CLASSES[meta.tone]
      }`}
    >
      <span>●</span>
      <span>{meta.label}</span>
    </span>
  )
}

export function OrderStatusTimeline({ status }: { status: OrderStatus }) {
  const meta = Order.getCustomerStatusMeta(status)

  if (status === 'cancelled') {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50/80 px-4 py-3 text-xs text-rose-700">
        <strong className="font-bold">Pesanan Dibatalkan:</strong> {meta.description}
      </div>
    )
  }

  const steps = [
    { step: 1, title: 'Menunggu' },
    { step: 2, title: 'Dikonfirmasi' },
    { step: 3, title: 'Sedang Dicetak' },
    { step: 4, title: 'Siap Diambil / Selesai' },
  ]

  return (
    <div className="grid grid-cols-4 gap-2 text-center text-xs">
      {steps.map((item) => {
        const isDone = meta.step > item.step || (item.step === 4 && meta.step === 4)
        const isCurrent = meta.step === item.step && item.step !== 4

        return (
          <div key={item.step} className="flex flex-col items-center">
            <span
              className={`grid size-6 place-items-center rounded-full text-[11px] font-bold ${
                isDone
                  ? 'bg-emerald-500 text-white'
                  : isCurrent
                  ? 'bg-blue-600 text-white ring-4 ring-blue-100'
                  : 'border border-slate-300 bg-white text-slate-400'
              }`}
            >
              {isDone ? '✓' : item.step}
            </span>
            <span
              className={`mt-2 font-bold leading-tight ${
                isDone
                  ? item.step === 4
                    ? 'text-emerald-700'
                    : 'text-slate-800'
                  : isCurrent
                  ? 'text-blue-600'
                  : 'text-slate-400'
              }`}
            >
              {item.title}
            </span>
          </div>
        )
      })}
    </div>
  )
}

