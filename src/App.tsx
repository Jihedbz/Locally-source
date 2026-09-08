import React from 'react'
import './App.css'
import 'devicon/devicon.min.css'
import { ThemeProvider } from './components/ui/themeprovider'
import { AppSidebar } from './components/Structure/app-sidebar'
import { Route, Routes, useLocation, Link } from 'react-router-dom'
import Home from './pages/Home/main'
import Projects from './pages/Projects/main'
import Settings from './pages/Settings/main'
import Tools from './pages/Tools/main'
import CreateNext from './pages/Projects/addNextProjectDialog'
import CreateAngular from './pages/Projects/addAngularProjectDialog'
import CreateReact from './pages/Projects/addReactProjectDialog'
import CreateVue from './pages/Projects/addVueProjectDialog'
import Support from './pages/Misc/support'
import Feedback from './pages/Misc/feedback'
import NpmManagement from './pages/Projects/npmManagement'
import { Changelogs } from './pages/Misc/changeLogs'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Separator } from '@/components/ui/separator'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import GlobalAlert from './components/Structure/globalAlert'
import ErrorBoundary from './components/ErrorBoundary'

function App() {
  const location = useLocation()
  const pathnames = location.pathname.split('/').filter(Boolean)

  const routeMap: Record<string, string> = {
    '': 'Home',
    projects: 'Projects',
    tools: 'Tools',
    settings: 'Settings',
    nextjs: 'Add Next.js Project',
    angular: 'Add Angular Project',
    react: 'Add React Project',
    vue: 'Add Vue Project',
    changelogs: 'Changelogs',
    support: 'Support',
    feedback: 'Feedback',
    packages: 'NPM Packages',
  }

  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
        {/* no <Router> here anymore */}
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset className="h-svh min-h-0 overflow-y-auto">
            <div className="flex min-h-full flex-1 flex-col bg-gradient-to-br from-background via-background to-muted/20">
              <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center border-b bg-background/90 px-4 backdrop-blur-md md:px-6">
                <div className="flex min-w-0 items-center gap-2">
                  <SidebarTrigger className="-ml-1 hover-lift" />
                  <Separator orientation="vertical" className="mr-2 h-4" />

                  <Breadcrumb className="min-w-0">
                    <BreadcrumbList>
                      {pathnames.length === 0 ? (
                        <BreadcrumbItem>
                          <BreadcrumbPage>Home</BreadcrumbPage>
                        </BreadcrumbItem>
                      ) : (
                        <>
                          <BreadcrumbItem>
                            <BreadcrumbLink asChild>
                              <Link to="/">Home</Link>
                            </BreadcrumbLink>
                          </BreadcrumbItem>
                          {pathnames.map((segment, index) => {
                            const to = `/${pathnames.slice(0, index + 1).join('/')}`
                            const isLast = index === pathnames.length - 1
                            const label = routeMap[segment] || segment

                            return (
                              <React.Fragment key={to}>
                                <BreadcrumbSeparator />
                                <BreadcrumbItem>
                                  {isLast ? (
                                    <BreadcrumbPage>{label}</BreadcrumbPage>
                                  ) : (
                                    <BreadcrumbLink asChild>
                                      <Link to={to}>{label}</Link>
                                    </BreadcrumbLink>
                                  )}
                                </BreadcrumbItem>
                              </React.Fragment>
                            )
                          })}
                        </>
                      )}
                    </BreadcrumbList>
                  </Breadcrumb>
                </div>
              </header>
              <main className="flex-1">
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/projects" element={<Projects />} />
                  <Route path="/tools" element={<Tools />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/nextjs" element={<CreateNext />} />
                  <Route path="/angular" element={<CreateAngular />} />
                  <Route path="/react" element={<CreateReact />} />
                  <Route path="/vue" element={<CreateVue />} />
                  <Route path="/changelogs" element={<Changelogs />} />
                  <Route path="/support" element={<Support />} />
                  <Route path="/feedback" element={<Feedback />} />
                  <Route path="/packages" element={<NpmManagement />} />
                </Routes>
              </main>
            </div>
          </SidebarInset>
        </SidebarProvider>
        <GlobalAlert />
      </ThemeProvider>
    </ErrorBoundary>
  )
}

export default App
