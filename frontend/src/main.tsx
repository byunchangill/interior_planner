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
import OAuthCallbackPage from './pages/auth/OAuthCallbackPage.tsx'
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
// RECO (RECO-001~008) — M3
import RecoSetupPage from './pages/reco/RecoSetupPage.tsx'
import AnalysisProgressPage from './pages/reco/AnalysisProgressPage.tsx'
import RecoSummaryPage from './pages/reco/RecoSummaryPage.tsx'
import RecommendationDetailPage from './pages/reco/RecommendationDetailPage.tsx'
import BeforeAfterPage from './pages/reco/BeforeAfterPage.tsx'
import FurnitureDetailPage from './pages/reco/FurnitureDetailPage.tsx'
import ExpertNoticePage from './pages/reco/ExpertNoticePage.tsx'
// SAVE (SAVE-001~003 + 공개뷰/구매목록) — M4
import SavedPage from './pages/SavedPage.tsx'
import ComparePage from './pages/save/ComparePage.tsx'
import SharePage from './pages/save/SharePage.tsx'
import ShoppingListPage from './pages/save/ShoppingListPage.tsx'
import PublicSharePage from './pages/save/PublicSharePage.tsx'
// MY/DATA (MY-001~005) — M5
import MyPage from './pages/my/MyPage.tsx'
import AccountSettingsPage from './pages/my/AccountSettingsPage.tsx'
import DataPrivacyPage from './pages/my/DataPrivacyPage.tsx'
import WithdrawPage from './pages/my/WithdrawPage.tsx'
import SupportPage from './pages/my/SupportPage.tsx'

const router = createBrowserRouter([
  // 앱 진입점: 스플래시(세션 확인 후 홈/온보딩/로그인 분기)
  { path: '/', element: <SplashPage /> }, // COM-001
  { path: '/onboarding', element: <OnboardingPage /> }, // COM-002
  { path: '/login', element: <LoginPage /> }, // COM-003
  { path: '/signup', element: <SignupPage /> }, // COM-004
  { path: '/permissions', element: <PermissionsPage /> }, // COM-005
  { path: '/oauth/callback/:provider', element: <OAuthCallbackPage /> }, // 카카오/구글 콜백

  // 공개 공유 뷰 — 비로그인 열람(RequireAuth 밖), 하단 탭 없는 독립 레이아웃
  { path: '/share/:token', element: <PublicSharePage /> }, // SAVE-003 공개뷰

  // SPACE 서브플로우 — 포커스 화면(하단 탭 없음), 보호 라우트
  {
    element: <RequireAuth />,
    children: [
      { path: '/spaces/new', element: <SpaceCreatePage /> }, // SPACE-002
      { path: '/spaces/:id', element: <SpaceDetailPage /> }, // SPACE-007
      { path: '/spaces/:id/photos', element: <SpacePhotoPage /> }, // SPACE-003
      { path: '/spaces/:id/floorplan', element: <FloorPlanUploadPage /> }, // SPACE-004
      { path: '/spaces/:id/edit', element: <SpaceDimensionsPage /> }, // SPACE-005 · SPACE-006
      // RECO 결과 플로우 — 포커스 화면(하단 탭 없음)
      { path: '/reco/jobs/:analysisId', element: <AnalysisProgressPage /> }, // RECO-003
      { path: '/reco/summary/:analysisId', element: <RecoSummaryPage /> }, // RECO-004
      { path: '/reco/:recommendationId', element: <RecommendationDetailPage /> }, // RECO-005
      { path: '/reco/:recommendationId/compare', element: <BeforeAfterPage /> }, // RECO-006
      { path: '/reco/:recommendationId/items/:itemId', element: <FurnitureDetailPage /> }, // RECO-007
      { path: '/reco/:recommendationId/expert', element: <ExpertNoticePage /> }, // RECO-008
      // SAVE 서브플로우 — 포커스 화면(하단 탭 없음)
      { path: '/saved/compare', element: <ComparePage /> }, // SAVE-002
      { path: '/reco/:recommendationId/share', element: <SharePage /> }, // SAVE-003
      { path: '/reco/:recommendationId/shopping-list', element: <ShoppingListPage /> }, // 구매목록 내보내기
      // MY 서브플로우 — 포커스 화면(하단 탭 없음)
      { path: '/my/account', element: <AccountSettingsPage /> }, // MY-003
      { path: '/my/data', element: <DataPrivacyPage /> }, // MY-002
      { path: '/my/withdraw', element: <WithdrawPage /> }, // MY-004
      { path: '/my/support', element: <SupportPage /> }, // MY-005
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
          { path: 'reco', element: <RecoSetupPage /> }, // RECO-001 · RECO-002
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
