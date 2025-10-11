import "./App.css";
import { ThemeProvider } from "./components/ui/themeprovider";
import { AppSidebar } from "./components/Structure/app-sidebar";
import {Route, Routes, useLocation} from "react-router-dom";
import Home from "./pages/Home/main";
import Projects from "./pages/Projects/main";
import Settings from "./pages/Settings/main";
import Tools from "./pages/Tools/main";
import CreateNext from "./pages/Projects/addNextProjectDialog";
import CreateAngular from "./pages/Projects/addAngularProjectDialog"
import { Changelogs } from "./pages/Misc/changeLogs";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import GlobalAlert from "./components/Structure/globalAlert";
import React from "react";

function App() {

  const location = useLocation();
  const pathnames = location.pathname.split("/").filter(Boolean);

  const routeMap: Record<string, string> = {
    "": "Home",
    projects: "Projects",
    tools: "Tools",
    settings: "Settings",
    nextjs: "Add Next.js Project",
    angular: "Add Angular Project",
    changelogs: "Changelogs",
  }


  return (
      <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
        <link
            rel="stylesheet"
            type="text/css"
            href="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/devicon.min.css"
        />
        {/* no <Router> here anymore */}
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset>
            <div className="min-h-screen flex flex-col bg-gradient-to-br from-white/10 to-black/20 backdrop-blur-md">
              <header className="h-16 flex items-center px-4">
                <div className="flex items-center gap-2 px-4">
                  <SidebarTrigger className="-ml-1" />
                  <Separator orientation="vertical" className="mr-2 h-4 bg-white !important" />

                  <Breadcrumb>
                    <BreadcrumbList>
                      <BreadcrumbItem>
                        <BreadcrumbLink href="/">Home</BreadcrumbLink>
                      </BreadcrumbItem>
                      {pathnames.map((segment, index) => {
                        const to = `/${pathnames.slice(0, index + 1).join("/")}`;
                        const isLast = index === pathnames.length - 1;
                        const label = routeMap[segment] || segment;

                        return (
                            <React.Fragment key={to}>
                              <BreadcrumbSeparator />
                              <BreadcrumbItem>
                                {isLast ? (
                                    <BreadcrumbPage>{label}</BreadcrumbPage>
                                ) : (
                                    <BreadcrumbLink href={to}>{label}</BreadcrumbLink>
                                )}
                              </BreadcrumbItem>
                            </React.Fragment>
                        );
                      })}
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
                  <Route path="/angular" element={<CreateAngular />} />
                  <Route path="/changelogs" element={<Changelogs />} />
                </Routes>
              </main>
            </div>

          </SidebarInset>
        </SidebarProvider>
        <GlobalAlert />

      </ThemeProvider>
  );
}

export default App;
