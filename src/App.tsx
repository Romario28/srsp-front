import { Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { AppLayout } from '@/components/layout/AppLayout'
import { LoginPage } from '@/pages/LoginPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { EmployesListPage } from '@/pages/employes/EmployesListPage'
import { DepartementsPage } from '@/pages/departements/DepartementsPage'
import { DelegationsPage } from '@/pages/delegations/DelegationsPage'
import { UtilisateursListPage } from '@/pages/utilisateurs/UtilisateursListPage'
import { AuditListPage } from '@/pages/audit/AuditListPage'
import { ForbiddenPage } from '@/pages/ForbiddenPage'
import { NotFoundPage } from '@/pages/NotFoundPage'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/interdit" element={<ForbiddenPage />} />

      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />

        {/* GET /api/employes : ouvert à tout utilisateur authentifié, déjà filtré par portée côté backend */}
        <Route path="employes" element={<EmployesListPage />} />

        {/* GET /api/departements : ouvert à tout utilisateur authentifié (lecture de l'organigramme) */}
        <Route path="departements" element={<DepartementsPage />} />

        {/* /api/portees-deleguees/** : ouvert (accorder dépend de la portée d'écriture, vérifié côté service) */}
        <Route path="delegations" element={<DelegationsPage />} />

        {/* /api/utilisateurs/** et /api/audit/** : ADMIN uniquement côté backend */}
        <Route
          path="utilisateurs"
          element={
            <ProtectedRoute adminOnly>
              <UtilisateursListPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="audit"
          element={
            <ProtectedRoute adminOnly>
              <AuditListPage />
            </ProtectedRoute>
          }
        />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

export default App
