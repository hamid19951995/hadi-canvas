import { useStore } from './store/useStore'
import { ProjectsPage } from './pages/ProjectsPage'
import { StudioPage } from './pages/StudioPage'
import { OAuthCallbackPage } from './pages/OAuthCallbackPage'

export default function App() {
  if (typeof window !== 'undefined' && window.location.pathname.startsWith('/oauth/callback')) {
    return <OAuthCallbackPage />
  }
  const screen = useStore((s) => s.screen)
  const project = useStore((s) => s.project)
  // فقط وقتی پروژه واقعاً باز است استودیو را نشان بده
  if (screen === 'studio' && project) return <StudioPage />
  return <ProjectsPage />
}
