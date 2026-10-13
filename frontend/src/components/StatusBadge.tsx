const CLASES: Record<string, string> = {
  Pendiente: 'bg-status-pending',
  Pagado: 'bg-status-paid',
  'En preparación': 'bg-status-preparing',
  Listo: 'bg-status-ready',
  Entregado: 'bg-status-delivered',
  Cancelado: 'bg-status-cancelled',
}

export default function StatusBadge({ estado }: { estado: string }) {
  const clase = CLASES[estado] ?? 'bg-outline'
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-bold text-white ${clase}`}>
      {estado}
    </span>
  )
}
