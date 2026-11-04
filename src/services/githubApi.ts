import { getStoredKey, isUsable, loadConnectorStates, connectWithOAuthToken } from './connectors'

const API = 'https://api.github.com'

function token(): string {
  if (!isUsable('github')) throw new Error('GitHub متصل نیست')
  const t = getStoredKey('github')
  if (!t) throw new Error('توکن GitHub موجود نیست')
  return t
}

async function gh<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token()}`,
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  })
  if (res.status === 401) {
    throw new Error('توکن GitHub نامعتبر یا منقضی است. دوباره OAuth کنید.')
  }
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`GitHub API ${res.status}: ${text.slice(0, 160)}`)
  }
  return res.json() as Promise<T>
}

export interface GhUser {
  login: string
  name?: string
  avatar_url?: string
  html_url?: string
}

export async function fetchGithubUser(): Promise<GhUser> {
  return gh<GhUser>('/user')
}

/** Validate token and refresh connector lastCheckedAt */
export async function validateGithubConnection(): Promise<GhUser> {
  const user = await fetchGithubUser()
  const existing = loadConnectorStates().find((s) => s.id === 'github')
  connectWithOAuthToken('github', getStoredKey('github'), existing?.expiresAt)
  return user
}

export async function createGist(opts: {
  description: string
  filename: string
  content: string
  public?: boolean
}): Promise<{ html_url: string; id: string }> {
  const data = await gh<{ html_url: string; id: string }>('/gists', {
    method: 'POST',
    body: JSON.stringify({
      description: opts.description,
      public: opts.public ?? false,
      files: {
        [opts.filename]: { content: opts.content },
      },
    }),
  })
  return data
}

export async function createIssue(opts: {
  owner: string
  repo: string
  title: string
  body: string
}): Promise<{ html_url: string; number: number }> {
  return gh(`/repos/${opts.owner}/${opts.repo}/issues`, {
    method: 'POST',
    body: JSON.stringify({ title: opts.title, body: opts.body }),
  })
}
