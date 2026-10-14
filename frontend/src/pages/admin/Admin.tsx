import { Route, Routes } from 'react-router-dom'
import Inicio from './Inicio'
import MenuDia from './MenuDia'
import Platillos from './Platillos'
import Usuarios from './Usuarios'

export default function Admin() {
  return (
    <Routes>
      <Route index element={<Inicio />} />
      <Route path="platillos" element={<Platillos />} />
      <Route path="menu" element={<MenuDia />} />
      <Route path="usuarios" element={<Usuarios />} />
    </Routes>
  )
}
