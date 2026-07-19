import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import HomePage from './pages/HomePage.tsx'
import SpaceListPage from './pages/SpaceListPage.tsx'
import RecoPage from './pages/RecoPage.tsx'
import SavedPage from './pages/SavedPage.tsx'
import MyPage from './pages/MyPage.tsx'

// 라우터 셸 — 하단 탭 5개 경로 (IA 화면 흐름)
const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <HomePage /> }, // HOME-001
      { path: 'spaces', element: <SpaceListPage /> }, // SPACE-001
      { path: 'reco', element: <RecoPage /> }, // RECO-001
      { path: 'saved', element: <SavedPage /> }, // SAVE-001
      { path: 'my', element: <MyPage /> }, // MY-001
    ],
  },
])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
