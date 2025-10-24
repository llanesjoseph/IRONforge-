import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom';
import Dashboard from './pages/dashboard';
import Login from './pages/login';
import PlayEditor from './pages/play/[id]';
import NewPlay from './pages/new-play';
import Schedule from './pages/schedule';
import AITest from './pages/ai-test';
import Team from './pages/Team';
import InviteAccept from './pages/InviteAccept';
import NewDraft from './pages/ai/new-draft';
import DraftEditor from './pages/ai/draft/[id]';
import BulkImport from './pages/ai/bulk-import';
import ProtectedRoute from './components/ProtectedRoute';
import BugReport from './components/BugReport';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/invite/:inviteId" element={<InviteAccept />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/team"
          element={
            <ProtectedRoute>
              <Team />
            </ProtectedRoute>
          }
        />
        <Route
          path="/schedule"
          element={
            <ProtectedRoute>
              <Schedule />
            </ProtectedRoute>
          }
        />
        <Route
          path="/play/:id"
          element={
            <ProtectedRoute>
              <PlayEditor />
            </ProtectedRoute>
          }
        />
        <Route
          path="/new"
          element={
            <ProtectedRoute>
              <NewPlay />
            </ProtectedRoute>
          }
        />
        <Route
          path="/ai-test"
          element={
            <ProtectedRoute>
              <AITest />
            </ProtectedRoute>
          }
        />
        <Route
          path="/ai/new"
          element={
            <ProtectedRoute>
              <NewDraft />
            </ProtectedRoute>
          }
        />
        <Route
          path="/ai/draft/:id"
          element={
            <ProtectedRoute>
              <DraftEditor />
            </ProtectedRoute>
          }
        />
        <Route
          path="/ai/bulk"
          element={
            <ProtectedRoute>
              <BulkImport />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <BugReport />
    </BrowserRouter>
  );
}