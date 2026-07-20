// 보호 라우트 — accessToken 없으면 로그인 화면으로. (AppShell 하위 중첩 레이아웃)
import { Navigate, Outlet } from 'react-router-dom'
import { getAccessToken } from '../api/tokens'

export default function RequireAuth() {
  if (!getAccessToken()) {
    return <Navigate to="/login" replace />
  }
  return <Outlet />
}
