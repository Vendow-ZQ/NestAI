export type Level = 'free' | 'low' | 'advanced'

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface SessionData {
  sessionId: string
  spaceId: string
  userId: string
  status: string
  shortTermMemory: string
  spaceAnalysis: {
    summary?: string
    display_summary?: string
    questions?: Question[]
    images?: string[]
    [key: string]: unknown
  }
  interventionPlan?: InterventionPlan
  feedback?: {
    selected_level?: Level
    completion_status?: string
    user_feeling?: string
    after_images?: string[]
    unfinished_steps?: string[]
    [key: string]: unknown
  }
  questions: Question[]
  letter?: string | null
  createdAt: string
  updatedAt: string
}

export interface Question {
  q: string
  options: string[]
}

export interface InterventionItem {
  id?: string
  level: Level
  title: string
  afterImage?: string
  changes: string[]
  diagnosis: string
  firstSteps: string[]
  recommendations: Array<string | { name: string; price: string }>
  estimatedTime: string
  costRange: string
  imagePrompts?: {
    axonometric?: string
    render1?: string
    render2?: string
    negative?: string
    [key: string]: string | undefined
  }
  generatedImages?: Record<string, string>
}

export type InterventionPlan = Record<Level, InterventionItem>

export interface NextActionData {
  id: string
  title: string
  spaceName: string
  lifestyleGoal: string
  firstStep: string
  estimatedTime: string
  costRange: string
  previewImage: string
  completed: boolean
  interventionId: string
  level: Level | string
  sceneId: string
  sessionId?: string
}

export interface FeedItemData {
  id: string
  sessionId?: string
  userId?: string
  userName?: string
  userAvatar?: string
  title: string
  description: string
  image: string
  location: string
  lifestyleKeywords: string[]
  createdAt?: string
}

export interface SessionListData {
  sessions: SessionData[]
  feed: FeedItemData[]
  nextActions: NextActionData[]
}

export interface LongTermMemoryData {
  userId: string
  markdown: string
  compact: string
  path: string
}

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '')

export function apiUrl(path: string): string {
  if (!API_BASE_URL) return path
  return `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`
}

export function mediaUrl(url: string): string {
  if (!url || url.startsWith('blob:') || url.startsWith('data:') || /^https?:\/\//i.test(url)) {
    return url
  }
  if (url.startsWith('/uploads/')) {
    return apiUrl(url)
  }
  return url
}

function normalizeMediaUrls<T>(value: T): T {
  if (typeof value === 'string') {
    return mediaUrl(value) as T
  }
  if (Array.isArray(value)) {
    return value.map((item) => normalizeMediaUrls(item)) as T
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, normalizeMediaUrls(item)]),
    ) as T
  }
  return value
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response
  try {
    res = await fetch(apiUrl(path), {
      ...init,
      headers: {
        ...(init?.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
        ...init?.headers,
      },
    })
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error)
    throw new Error(`无法连接后端服务，请确认 http://localhost:8000 已启动。原始错误：${detail}`)
  }

  const payload = (await res.json()) as ApiResponse<T>

  if (!res.ok || !payload.success) {
    throw new Error(payload.error || payload.message || `Request failed: ${res.status}`)
  }

  if (payload.data === undefined) {
    throw new Error('Empty response from API')
  }

  return normalizeMediaUrls(payload.data)
}

export const api = {
  listSessions(userId = 'dev_user') {
    return request<SessionListData>(`/api/sessions/?userId=${encodeURIComponent(userId)}`)
  },

  getSession(sessionId: string) {
    return request<SessionData>(`/api/sessions/${sessionId}`)
  },

  generateIntervention(
    sessionId: string,
    payload: {
      aspiration: string[]
      current_state: string[]
      constraints: Record<string, string>
    },
  ) {
    return request<{ interventionPlan: InterventionPlan }>(`/api/sessions/${sessionId}/intervention`, {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  generateLetter(
    sessionId: string,
    payload: {
      selected_level: Level
      completion_status: string
      user_feeling: string
      after_images?: string[]
      unfinished_steps?: string[]
    },
  ) {
    return request<{ letter: string }>(`/api/sessions/${sessionId}/letter`, {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  generateImages(sessionId: string, level: Level = 'low', tabs: string[] = ['render1']) {
    return request<{
      status: string
      level: Level | string
      imagePrompts: NonNullable<InterventionItem['imagePrompts']>
      generatedImages: Record<string, string>
      interventionPlan?: InterventionPlan
      message: string
    }>(`/api/sessions/${sessionId}/generate-images`, {
      method: 'POST',
      body: JSON.stringify({ level, tabs }),
    })
  },

  publishToGrow(
    sessionId: string,
    payload: {
      level?: Level | string
      title?: string
      description?: string
      image?: string
      lifestyle_keywords?: string[]
    } = {},
  ) {
    return request<FeedItemData>(`/api/sessions/${sessionId}/publish-feed`, {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  getLongTermMemory(userId = 'dev_user') {
    return request<LongTermMemoryData>(`/api/memory/long-term?userId=${encodeURIComponent(userId)}`)
  },
}
