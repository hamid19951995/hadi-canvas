/** Catalog of models via GapGPT API — grouped like gapgpt.app pricing */

export type ModelCategoryId =
  | 'openai'
  | 'anthropic'
  | 'google'
  | 'gapgpt'
  | 'image'

export interface ModelOption {
  id: string
  label: string
  provider: string
  category: ModelCategoryId
  kind: 'text' | 'image'
  description?: string
}

export interface ModelCategory {
  id: ModelCategoryId
  label: string
  emoji: string
}

export const MODEL_CATEGORIES: ModelCategory[] = [
  { id: 'openai', label: 'OpenAI', emoji: '🟢' },
  { id: 'anthropic', label: 'Anthropic · Claude', emoji: '🟠' },
  { id: 'google', label: 'Google · Gemini', emoji: '🔵' },
  { id: 'gapgpt', label: 'میزبانی GapGPT', emoji: '🟣' },
  { id: 'image', label: 'تولید تصویر', emoji: '🖼️' },
]

export const ALL_MODELS: ModelOption[] = [
  { id: 'gpt-4o', label: 'GPT-4o', provider: 'OpenAI', category: 'openai', kind: 'text', description: 'قدرتمند و چندمنظوره' },
  { id: 'gpt-4o-mini', label: 'GPT-4o Mini', provider: 'OpenAI', category: 'openai', kind: 'text', description: 'سریع و اقتصادی' },
  { id: 'gpt-4-turbo', label: 'GPT-4 Turbo', provider: 'OpenAI', category: 'openai', kind: 'text' },
  { id: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo', provider: 'OpenAI', category: 'openai', kind: 'text', description: 'ارزان برای تست' },
  { id: 'o1-preview', label: 'o1 Preview', provider: 'OpenAI', category: 'openai', kind: 'text', description: 'استدلال پیشرفته' },
  { id: 'o1-mini', label: 'o1 Mini', provider: 'OpenAI', category: 'openai', kind: 'text' },
  { id: 'gpt-6-luna', label: 'GPT-6 Luna', provider: 'OpenAI', category: 'openai', kind: 'text', description: 'سریع و اقتصادی' },
  { id: 'gpt-6.1-sol', label: 'GPT-6.1 Sol', provider: 'OpenAI', category: 'openai', kind: 'text', description: 'استدلال و کدنویسی' },
  { id: 'gpt-5.6-sol', label: 'GPT-5.6 Sol', provider: 'OpenAI', category: 'openai', kind: 'text' },

  { id: 'claude-3.5-sonnet', label: 'Claude 3.5 Sonnet', provider: 'Anthropic', category: 'anthropic', kind: 'text', description: 'کدنویسی و عامل‌ها' },
  { id: 'claude-3-opus', label: 'Claude 3 Opus', provider: 'Anthropic', category: 'anthropic', kind: 'text', description: 'استدلال عمیق' },
  { id: 'claude-3-haiku', label: 'Claude 3 Haiku', provider: 'Anthropic', category: 'anthropic', kind: 'text', description: 'سریع' },
  { id: 'claude-sonnet-5.5', label: 'Claude Sonnet 5.5', provider: 'Anthropic', category: 'anthropic', kind: 'text' },
  { id: 'claude-opus-5.5', label: 'Claude Opus 5.5', provider: 'Anthropic', category: 'anthropic', kind: 'text' },

  { id: 'gemini-pro', label: 'Gemini Pro', provider: 'Google', category: 'google', kind: 'text' },
  { id: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro', provider: 'Google', category: 'google', kind: 'text' },
  { id: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash', provider: 'Google', category: 'google', kind: 'text', description: 'سریع' },
  { id: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash', provider: 'Google', category: 'google', kind: 'text' },
  { id: 'gemini-3.1-pro-preview', label: 'Gemini 3.1 Pro Preview', provider: 'Google', category: 'google', kind: 'text' },

  { id: 'gapgpt-gemma-26b-a4b', label: 'Gemma 26B A4B', provider: 'GapGPT', category: 'gapgpt', kind: 'text', description: 'میزبانی ایران' },
  { id: 'gapgpt-qwen-3.5', label: 'Qwen 3.5', provider: 'GapGPT', category: 'gapgpt', kind: 'text' },
  { id: 'gapgpt-qwen-3.5-thinking', label: 'Qwen 3.5 Thinking', provider: 'GapGPT', category: 'gapgpt', kind: 'text' },

  { id: 'dall-e-3', label: 'DALL·E 3', provider: 'OpenAI', category: 'image', kind: 'image' },
  { id: 'gpt-image-2', label: 'GPT Image 2', provider: 'OpenAI', category: 'image', kind: 'image' },
  { id: 'gapgpt/qwen-image-2.1', label: 'Qwen Image 2.1', provider: 'GapGPT', category: 'image', kind: 'image' },
]

export function getModelLabel(id: string): string {
  return ALL_MODELS.find((m) => m.id === id)?.label || id
}

export function getTextModels() {
  return ALL_MODELS.filter((m) => m.kind === 'text')
}
