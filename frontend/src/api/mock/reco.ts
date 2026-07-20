// M3 RECO 프리뷰용 mock — 계약(m3.md) shape 그대로. VITE_USE_MOCK=true 일 때만 사용.
// 실제 백엔드 연동 시 이 파일은 무시된다(api/reco.ts의 MOCK 스위치 off).
import type {
  AnalysisRequest,
  AnalysisCreated,
  AnalysisStatus,
  JobStatus,
  Recommendation,
  RecoItem,
  StyleType,
  Visuals,
} from '../../types/reco'
import { STYLE_LABELS } from '../../types/reco'

const delay = <T>(v: T, ms = 300): Promise<T> => new Promise((r) => setTimeout(() => r(v), ms))

let seq = 100
interface Job {
  analysisId: number
  startAt: number
  styles: StyleType[]
  spaceId: number
  keepFurnitureIds: number[]
  recIds: number[]
}
const jobs: Record<number, Job> = {}
const recIndex: Record<number, { style: StyleType; job: Job }> = {}

// 경과 시간 → 상태/진행률 (계약 진행률 매핑, 총 15초 내외 시뮬레이션)
function progressFor(elapsedMs: number): { status: JobStatus; progress: number; label: string } {
  const s = elapsedMs / 1000
  if (s < 2) return { status: 'ANALYZING_STRUCTURE', progress: 20, label: '구조·치수 분석 중...' }
  if (s < 5) return { status: 'ANALYZING_LIGHT', progress: 40, label: '채광 분석 중...' }
  if (s < 8) return { status: 'ANALYZING_FLOW', progress: 60, label: '동선 분석 중...' }
  if (s < 11) return { status: 'GENERATING_RECO', progress: 80, label: '맞춤 추천 생성 중...' }
  if (s < 14) return { status: 'GENERATING_VISUAL', progress: 90, label: '전후 비교 시각화 생성 중...' }
  return { status: 'COMPLETED', progress: 100, label: '완료' }
}

export const createAnalysis = (body: AnalysisRequest): Promise<AnalysisCreated> => {
  const analysisId = ++seq
  const job: Job = {
    analysisId,
    startAt: Date.now(),
    styles: body.styles,
    spaceId: body.spaceId,
    keepFurnitureIds: body.keepFurnitureIds ?? [],
    recIds: [],
  }
  body.styles.forEach((style) => {
    const recId = ++seq
    job.recIds.push(recId)
    recIndex[recId] = { style, job }
  })
  jobs[analysisId] = job
  return delay({ analysisId, status: 'QUEUED', estimatedSeconds: 15 })
}

export const getAnalysis = (analysisId: number): Promise<AnalysisStatus> => {
  const job = jobs[analysisId]
  if (!job) return Promise.reject(new Error('분석을 찾을 수 없습니다'))
  const { status, progress, label } = progressFor(Date.now() - job.startAt)
  return delay({
    analysisId,
    status,
    progress,
    currentStepLabel: label,
    recommendationIds: status === 'COMPLETED' ? job.recIds : [],
    styles: job.styles,
  })
}

function itemsFor(style: StyleType, hasPets: boolean, keepIds: number[]): RecoItem[] {
  const base: RecoItem[] = [
    {
      itemId: 0, brand: 'A사', name: `${STYLE_LABELS[style]} 3인용 패브릭 소파`, category: 'SOFA',
      widthMm: 2180, depthMm: 920, heightMm: 810, price: 1290000,
      purchaseUrl: 'https://example.com/p/sofa', position: '거실 남측 벽',
      reason: hasPets ? '반려동물 가정 — 긁힘에 강한 고밀도 패브릭' : '넓은 좌면으로 편안한 휴식 제공',
      expertRequired: false,
    },
    {
      itemId: 0, brand: 'B사', name: '오크 원목 5단 책장', category: 'BOOKSHELF',
      widthMm: 900, depthMm: 320, heightMm: 1800, price: 430000,
      purchaseUrl: 'https://example.com/p/shelf', position: '거실 동측 벽',
      reason: '수납과 개방감을 함께 확보하는 오픈형 구조', expertRequired: false,
    },
    {
      itemId: 0, brand: 'C사', name: '벽부 간접 조명 세트', category: 'LIGHTING',
      widthMm: 1200, depthMm: 80, heightMm: 60, price: 210000,
      purchaseUrl: 'https://example.com/p/light', position: '거실 천장 몰딩',
      reason: '전기 배선 변경이 필요해 전문가 시공을 권장합니다', expertRequired: true,
    },
  ]
  return base.map((it, i) => ({ ...it, itemId: keepIds[0] ? keepIds[0] + i + 1 : 300 + i }))
}

export const getRecommendation = (recommendationId: number): Promise<Recommendation> => {
  const found = recIndex[recommendationId]
  if (!found) return Promise.reject(new Error('추천안을 찾을 수 없습니다'))
  const { style, job } = found
  const items = itemsFor(style, false, job.keepFurnitureIds)
  const label = STYLE_LABELS[style]
  return delay({
    recommendationId,
    analysisId: job.analysisId,
    spaceId: job.spaceId,
    style,
    concept: {
      title: `따뜻한 ${label} 거실`,
      description: `자연광을 살리면서 ${label} 특유의 절제된 소재와 색을 조합해, 일상에 안정감을 주는 공간을 제안합니다.`,
      keywords: ['화이트', '우드', '미니멀'],
    },
    layout: {
      imageUrl: 'https://placehold.co/800x600/e2dfff/3525cd?text=Layout',
      flowDescription: '현관에서 거실로 이어지는 동선을 벽면 가구로 정리했습니다.',
      reason: '창문 앞을 비워 채광을 유지합니다.',
    },
    materials: {
      wallpaper: { color: '#F5F0E8', material: '실크 벽지', reason: '빛 반사가 부드러워 공간이 넓어 보입니다.' },
      flooring: { color: '#C9A227', material: '오크 원목마루', reason: '따뜻한 우드톤으로 가구와 조화됩니다.' },
      lighting: { color: '#FFF3E0', material: '따뜻한 간접조명', reason: '배선 변경이 필요합니다.', expertRequired: true },
      curtain: { color: '#FFFFFF', material: '리넨', reason: '자연광을 은은하게 확산시킵니다.' },
    },
    spaceTips: ['낮은 가구로 개방감 확보', '러그로 공간 영역 구분'],
    storage: ['벽면 수납장 활용', '소파 하단 수납 박스 배치'],
    keepFurnitureLayout: job.keepFurnitureIds.length
      ? { description: '기존 소파를 남측 벽에 유지합니다.', furnitureIds: job.keepFurnitureIds }
      : null,
    budgetPlans: [
      { range: 'R100_300', title: '최소 변경안', totalPrice: 1800000, itemIds: [items[0].itemId] },
      { range: 'R300_500', title: '균형형', totalPrice: 3450000, itemIds: [items[0].itemId, items[1].itemId] },
      { range: 'R500_1000', title: '전체 변경안', totalPrice: 8200000, itemIds: items.map((i) => i.itemId) },
    ],
    items,
    fitScore: {
      total: 88,
      checks: [
        { label: '통로 폭', verdict: 'GOOD', detail: '소파 배치 후 통로 83cm' },
        { label: '소파 폭 vs 벽 길이', verdict: 'CHECK', detail: '여유 12cm — 구매 전 실측 권장' },
      ],
      measureBeforeBuy: ['남측 벽 길이', '현관 폭'],
    },
    disclaimers: ['본 추천은 AI 분석 결과로 실제 치수·시공 가능 여부와 다를 수 있습니다.'],
  })
}

export const getVisuals = (recommendationId: number): Promise<Visuals> => {
  const found = recIndex[recommendationId]
  if (!found) return Promise.reject(new Error('추천안을 찾을 수 없습니다'))
  return delay({
    pairs: [
      {
        beforeUrl: 'https://placehold.co/800x1000/d9dadb/464555?text=Before',
        afterUrl: 'https://placehold.co/800x1000/e2dfff/3525cd?text=After+AI',
        viewLabel: '거실 전면',
      },
    ],
  })
}

export const regenerateVisuals = (_recommendationId: number): Promise<{ status: string }> =>
  delay({ status: 'QUEUED' })
