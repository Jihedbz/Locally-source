import { Code } from 'lucide-react'

/**
 * Returns the appropriate icon component for a given project type.
 */
export const getProjectIcon = (type: string, sizeClass = 'text-2xl') => {
  switch (type.toLowerCase()) {
    case 'angular':
      return <i aria-hidden="true" className={`devicon-angularjs-plain colored ${sizeClass}`} />
    case 'react':
      return <i aria-hidden="true" className={`devicon-react-original colored ${sizeClass}`} />
    case 'next':
    case 'nextjs':
      return <i aria-hidden="true" className={`devicon-nextjs-plain ${sizeClass}`} />
    case 'vue':
      return <i aria-hidden="true" className={`devicon-vuejs-plain colored ${sizeClass}`} />
    case 'rust':
      return <i aria-hidden="true" className={`devicon-rust-plain ${sizeClass}`} />
    case 'python':
      return <i aria-hidden="true" className={`devicon-python-plain colored ${sizeClass}`} />
    case 'go':
      return (
        <i aria-hidden="true" className={`devicon-go-original-wordmark colored ${sizeClass}`} />
      )
    case 'svelte':
      return <i aria-hidden="true" className={`devicon-svelte-plain colored ${sizeClass}`} />
    case 'astro':
      return <i aria-hidden="true" className={`devicon-astro-plain colored ${sizeClass}`} />
    default:
      return <Code className={`text-muted-foreground ${sizeClass}`} />
  }
}

/**
 * Returns the CSS gradient and border classes for a given project type or custom accent.
 */
export const getProjectColor = (type: string, customColor?: string) => {
  if (customColor) {
    switch (customColor.toLowerCase()) {
      case 'blue':
        return 'from-blue-500/10 via-blue-500/5 to-transparent border-blue-500/30'
      case 'purple':
        return 'from-purple-500/10 via-purple-500/5 to-transparent border-purple-500/30'
      case 'emerald':
        return 'from-emerald-500/10 via-emerald-500/5 to-transparent border-emerald-500/30'
      case 'amber':
        return 'from-amber-500/10 via-amber-500/5 to-transparent border-amber-500/30'
      case 'rose':
        return 'from-rose-500/10 via-rose-500/5 to-transparent border-rose-500/30'
      case 'cyan':
        return 'from-cyan-500/10 via-cyan-500/5 to-transparent border-cyan-500/30'
      case 'indigo':
        return 'from-indigo-500/10 via-indigo-500/5 to-transparent border-indigo-500/30'
      case 'slate':
        return 'from-slate-500/10 via-slate-500/5 to-transparent border-slate-500/30'
    }
  }

  switch (type.toLowerCase()) {
    case 'angular':
      return 'from-red-500/10 via-red-500/5 to-transparent border-red-500/20'
    case 'react':
      return 'from-blue-500/10 via-blue-500/5 to-transparent border-blue-500/20'
    case 'next':
      return 'from-slate-500/10 via-slate-500/5 to-transparent border-slate-500/20'
    case 'vue':
      return 'from-emerald-500/10 via-emerald-500/5 to-transparent border-emerald-500/20'
    case 'rust':
      return 'from-amber-600/10 via-amber-600/5 to-transparent border-amber-600/20'
    case 'python':
      return 'from-amber-500/10 via-amber-500/5 to-transparent border-amber-500/20'
    case 'go':
      return 'from-cyan-500/10 via-cyan-500/5 to-transparent border-cyan-500/20'
    default:
      return 'from-primary/10 via-primary/5 to-transparent border-primary/20'
  }
}
