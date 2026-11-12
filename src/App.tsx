import { Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { AppLayout } from '@/components/layout/AppLayout'
import { LoginPage } from '@/pages/LoginPage'
import { DemandeComptePage } from '@/pages/DemandeComptePage'
import { DashboardPage } from '@/pages/DashboardPage'
import { MonEspacePage } from '@/pages/MonEspacePage'
import { UtilisateursListPage } from '@/pages/utilisateurs/UtilisateursListPage'
import { DemandesComptesPage } from '@/pages/utilisateurs/DemandesComptesPage'
import { DepartementsPage } from '@/pages/departements/DepartementsPage'
import { AuditListPage } from '@/pages/audit/AuditListPage'
import { ForbiddenPage } from '@/pages/ForbiddenPage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { EcheancesPage } from '@/pages/anticipation/EcheancesPage'
import { AnomaliesPage } from '@/pages/anticipation/AnomaliesPage'
import { AlertesPage } from '@/pages/anticipation/alertes/AlertesPage'
import { ConfigurationPage } from '@/pages/anticipation/ConfigurationPage'
import { GardeBaseAgents } from '@/pages/anticipation/GardeBaseAgents'
import { CalendrierPage } from '@/pages/calendrier/CalendrierPage'
import { DossiersPage } from '@/pages/dossiers/DossiersPage'
import { ImportsPage } from '@/pages/imports/ImportsPage'
import { ECHEANCE_SLUGS, TYPES_ECHEANCE } from '@/utils/anticipation'
import { isAdmin, isAgent, peutVoirAnticipation, peutVoirUtilisateurs } from '@/utils/roles'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/demande-compte" element={<DemandeComptePage />} />
      <Route path="/interdit" element={<ForbiddenPage />} />

      <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route index element={<DashboardPage />} />

        <Route path="mon-espace" element={<ProtectedRoute autorise={isAgent}><MonEspacePage /></ProtectedRoute>} />

        <Route path="utilisateurs" element={<ProtectedRoute autorise={peutVoirUtilisateurs}><UtilisateursListPage /></ProtectedRoute>} />
        <Route path="demandes-comptes" element={<ProtectedRoute autorise={peutVoirUtilisateurs}><DemandesComptesPage /></ProtectedRoute>} />
        <Route path="departements" element={<ProtectedRoute autorise={isAdmin}><DepartementsPage /></ProtectedRoute>} />
        <Route path="audit" element={<ProtectedRoute autorise={isAdmin}><AuditListPage /></ProtectedRoute>} />
        <Route path="imports" element={<ProtectedRoute autorise={isAdmin}><ImportsPage /></ProtectedRoute>} />

        <Route path="anticipation" element={<ProtectedRoute autorise={peutVoirAnticipation}><Outlet /></ProtectedRoute>}>
          <Route index element={<Navigate to="alertes" replace />} />
          <Route path="configuration" element={<ProtectedRoute autorise={isAdmin}><ConfigurationPage /></ProtectedRoute>} />
          <Route path="dossiers" element={<DossiersPage />} />
          <Route element={<GardeBaseAgents />}>
            <Route path="alertes" element={<AlertesPage />} />
            <Route path="calendrier" element={<CalendrierPage />} />
            {TYPES_ECHEANCE.map((type) => <Route key={type} path={ECHEANCE_SLUGS[type]} element={<EcheancesPage key={type} type={type} />} />)}
            <Route path="anomalies" element={<AnomaliesPage />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

export default App