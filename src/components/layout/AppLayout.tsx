import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
// SUPPRIMÉ : import { AlertesNouvellesProvider } from '@/context/AlertesNouvellesContext'
import { DemandesComptesProvider } from '@/context/DemandesComptesContext'
import { DossierApercuProvider } from '@/context/DossierApercuContext'

export function AppLayout() {
  return (
    <DemandesComptesProvider>
    {/* SUPPRIMÉ : <AlertesNouvellesProvider> */}
    <DossierApercuProvider>
    <div className="flex h-screen overflow-hidden bg-canvas">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="flex-1 overflow-y-auto px-8 py-7">
          <Outlet />
        </main>
      </div>
    </div>
    </DossierApercuProvider>
    {/* SUPPRIMÉ : </AlertesNouvellesProvider> */}
    </DemandesComptesProvider>
  )
}
