import "./App.css";
import { ThemeProvider } from "./components/ui/themeprovider";
import { AppSidebar } from "./components/Structure/app-sidebar";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Home from "./pages/Home/main";
import Projects from "./pages/Projects/main";
import Settings from "./pages/Settings/main";
import Tools from "./pages/Tools/main";
import CreateNext from "./pages/Projects/addNextProjectDialog"
import { Changelogs } from "./pages/Misc/changeLogs";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import GlobalAlert from "./components/Structure/globalAlert";
function App() {


  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <link rel="stylesheet" type='text/css' href="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/devicon.min.css" />
      <Router>
      <SidebarProvider>
      <AppSidebar />
      <SidebarInset >  
        <div className="min-h-screen flex flex-col bg-gradient-to-br from-white/10 to-black/20 backdrop-blur-md">
    <header className="h-16 flex items-center px-4">
    <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="#">
                    Work in progress
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>work in progress</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <main className="flex-1 p-6">
        <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/projects" element={<Projects />} />
              <Route path="/tools" element={<Tools />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/nextjs" element={<CreateNext />} />
              <Route path="/changelogs" element={<Changelogs />} />

            </Routes>
            </main>

          </div>
      </SidebarInset>
    </SidebarProvider>
    </Router>
    <GlobalAlert /> 
  </ThemeProvider>
  );
}

export default App;
