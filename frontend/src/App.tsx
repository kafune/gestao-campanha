import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import Login from './pages/Login'
import RecuperarSenha from './pages/RecuperarSenha'
import Dashboard from './pages/Dashboard'
import Usuarios from './pages/Usuarios'
import Zonas from './pages/Zonas'
import Segmentos from './pages/Segmentos'
import Cadastro from './pages/Cadastro'
import Confirmacao from './pages/Confirmacao'
import Perfil from './pages/Perfil'
import Acoes from './pages/Acoes'
import Dobradinhas from './pages/Dobradinhas'
import DobradinhaDetalhe from './pages/DobradinhaDetalhe'
import LocaisVotacao from './pages/LocaisVotacao'

function ProtectedRoute({
  children,
  perfis
}: {
  children: React.ReactNode
  perfis?: string[]
}) {
  const { user, profile, loading } = useAuth()
  if (loading) return <div className="flex items-center justify-center h-screen">Carregando...</div>
  if (!user) return <Navigate to="/login" replace />
  if (perfis && profile && !perfis.includes(profile.perfil)) return <Navigate to="/dashboard" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/cadastro" element={<Cadastro />} />
        <Route path="/confirmacao" element={<Confirmacao />} />
        <Route path="/login" element={<Login />} />
        <Route path="/recuperar-senha" element={<RecuperarSenha />} />

        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />

        <Route path="/perfil" element={
          <ProtectedRoute>
            <Perfil />
          </ProtectedRoute>
        } />

        <Route path="/acoes" element={
          <ProtectedRoute>
            <Acoes />
          </ProtectedRoute>
        } />

        <Route path="/usuarios" element={
          <ProtectedRoute perfis={['gestor_geral']}>
            <Usuarios />
          </ProtectedRoute>
        } />

        <Route path="/zonas" element={
          <ProtectedRoute perfis={['gestor_geral']}>
            <Zonas />
          </ProtectedRoute>
        } />

        <Route path="/segmentos" element={
          <ProtectedRoute perfis={['gestor_geral']}>
            <Segmentos />
          </ProtectedRoute>
        } />

        <Route path="/dobradinhas" element={
          <ProtectedRoute>
            <Dobradinhas />
          </ProtectedRoute>
        } />

        <Route path="/dobradinhas/:id" element={
          <ProtectedRoute>
            <DobradinhaDetalhe />
          </ProtectedRoute>
        } />

        <Route path="/locais-votacao" element={
          <ProtectedRoute perfis={['gestor_geral']}>
            <LocaisVotacao />
          </ProtectedRoute>
        } />

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
