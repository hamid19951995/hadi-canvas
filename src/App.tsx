import { useStore } from './store/useStore'
import { ProjectsPage } from './pages/ProjectsPage'
import { StudioPage } from './pages/StudioPage'
import { OAuthCallbackPage } from './pages/OAuthCallbackPage'

export default function App() {
  if (typeof window !== 'undefined' && window.location.pathname.startsWith('/oauth/callback')) {
    return <OAuthCallbackPage />
  }
  const screen = useStore((s) => s.screen)
  if (screen === 'projects') return <ProjectsPage />
  return <StudioPage />
}
