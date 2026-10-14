import { Navigate, Route, Routes } from 'react-router-dom'
import { CapturaProvider } from './CapturaContext'
import Entregas from './Entregas'
import InicioCaja from './InicioCaja'
import NuevoPedido from './NuevoPedido'
import ResumenCobro from './ResumenCobro'

export default function Caja() {
  return (
    <CapturaProvider>
      <Routes>
        <Route index element={<InicioCaja />} />
        <Route path="nuevo" element={<NuevoPedido />} />
        <Route path="cobro" element={<ResumenCobro />} />
        <Route path="entregas" element={<Entregas />} />
        <Route path="*" element={<Navigate to="/caja" replace />} />
      </Routes>
    </CapturaProvider>
  )
}
