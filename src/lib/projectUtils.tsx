import { Code } from 'lucide-react'

/**
 * Returns the appropriate icon component for a given project type.
 */
export const getProjectIcon = (type: string) => {
  switch (type.toLowerCase()) {
    case 'angular':
      return <i className="devicon-angularjs-plain colored text-2xl" />
    case 'react':
      return <i className="devicon-react-original colored text-2xl" />
    case 'next':
      return <i className="devicon-nextjs-plain text-2xl" />
    default:
      return <Code className="text-2xl text-muted-foreground" />
  }
}

/**
 * Returns the CSS gradient and border classes for a given project type.
 */
export const getProjectColor = (type: string) => {
  switch (type.toLowerCase()) {
    case 'angular':
      return 'from-red-500/10 via-red-500/5 to-transparent border-red-500/20'
    case 'react':
      return 'from-blue-500/10 via-blue-500/5 to-transparent border-blue-500/20'
    case 'next':
      return 'from-slate-500/10 via-slate-500/5 to-transparent border-slate-500/20'
    default:
      return 'from-primary/10 via-primary/5 to-transparent border-primary/20'
  }
}
