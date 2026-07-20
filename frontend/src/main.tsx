import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import RequireAuth from './components/RequireAuth.tsx'
// AUTH (COM-001~005) — 하단 탭 없는 포커스 화면
import SplashPage from './pages/auth/SplashPage.tsx'
import OnboardingPage from './pages/auth/OnboardingPage.tsx'
import LoginPage from './pages/auth/LoginPage.tsx'
import SignupPage from './pages/auth/SignupPage.tsx'
import PermissionsPage from './pages/auth/PermissionsPage.tsx'
// HOME (HOME-001~003)
import HomePage from './pages/home/HomePage.tsx'
import StyleGalleryPage from './pages/home/StyleGalleryPage.tsx'
import StyleDetailPage from './pages/home/StyleDetailPage.tsx'
// SPACE (SPACE-001~007) — M2
import SpaceListPage from './pages/space/SpaceListPage.tsx'
import SpaceCreatePage from './pages/space/SpaceCreatePage.tsx'
import SpacePhotoPage from './pages/space/SpacePhotoPage.tsx'
import FloorPlanUploadPage from './pages/space/FloorPlanUploadPage.tsx'
import SpaceDimensionsPage from './pages/space/SpaceDimensionsPage.tsx'
import SpaceDetailPage from './pages/space/SpaceDetailPage.tsx'
// 기타 탭 (M1+ 예정)
import RecoPage from './pages/RecoPage.tsx'
import SavedPage from './pages/SavedPage.tsx'
import MyPage from './pages/MyPage.tsx'

const router = createBrowserRouter([
  // 앱 진입점: 스플래시(세션 확인 후 홈/온보딩/로그인 분기)
  { path: '/', element: <SplashPage /> }, // COM-001
  { path: '/onboarding', element: <OnboardingPage /> }, // COM-002
  { path: '/login', element: <LoginPage /> }, // COM-003
  { path: '/signup', element: <SignupPage /> }, // COM-004
  { path: '/permissions', element: <PermissionsPage /> }, // COM-005

  // SPACE 서브플로우 — 포커스 화면(하단 탭 없음), 보호 라우트
  {
    element: <RequireAuth />,
    children: [
      { path: '/spaces/new', element: <SpaceCreatePage /> }, // SPACE-002
      { path: '/spaces/:id', element: <SpaceDetailPage /> }, // SPACE-007
      { path: '/spaces/:id/photos', element: <SpacePhotoPage /> }, // SPACE-003
      { path: '/spaces/:id/floorplan', element: <FloorPlanUploadPage /> }, // SPACE-004
      { path: '/spaces/:id/edit', element: <SpaceDimensionsPage /> }, // SPACE-005 · SPACE-006
    ],
  },

  // 하단 탭 셸 (BottomNav 포함)
  {
    element: <App />,
    children: [
      // 공개 — 스타일 탐색 (인증 불필요)
      { path: 'styles', element: <StyleGalleryPage /> }, // HOME-002
      { path: 'styles/:styleType', element: <StyleDetailPage /> }, // HOME-003
      // 보호 라우트 (비로그인 시 /login)
      {
        element: <RequireAuth />,
        children: [
          { path: 'home', element: <HomePage /> }, // HOME-001
          { path: 'spaces', element: <SpaceListPage /> }, // SPACE-001
          { path: 'reco', element: <RecoPage /> }, // RECO-001
          { path: 'saved', element: <SavedPage /> }, // SAVE-001
          { path: 'my', element: <MyPage /> }, // MY-001
        ],
      },
    ],
  },
])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
