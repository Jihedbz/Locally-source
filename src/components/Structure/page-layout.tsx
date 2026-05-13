type PageLayoutProps = {
  children: React.ReactNode
}

export const PageLayout = ({ children }: PageLayoutProps) => (
  <div className="px-6 py-4 max-w-7xl mx-auto w-full">{children}</div>
)
