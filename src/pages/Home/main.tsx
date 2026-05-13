import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  FolderOpen,
  Code,
  Terminal,
  Zap,
  Sparkles,
  ArrowRight,
  Play,
  Settings,
  Wrench,
} from 'lucide-react'
import { Link } from 'react-router-dom'

const Home = () => {
  const features = [
    {
      icon: FolderOpen,
      title: 'Project Management',
      description:
        'Create and manage your development projects with ease. Support for Next.js, Angular, React, and more.',
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      icon: Code,
      title: 'Code Editor Integration',
      description: 'Seamlessly open projects in your preferred code editor with one click.',
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
    {
      icon: Terminal,
      title: 'Terminal Access',
      description: 'Launch terminals directly in your project directories across all platforms.',
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
    {
      icon: Settings,
      title: 'Customizable Settings',
      description: 'Personalize your development environment with comprehensive settings.',
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
    },
  ]

  const quickActions = [
    {
      title: 'Create Project',
      description: 'Start a new project',
      icon: Sparkles,
      link: '/projects',
      color: 'bg-gradient-to-r from-purple-500 to-pink-500',
    },
    {
      title: 'View Projects',
      description: 'Manage existing projects',
      icon: FolderOpen,
      link: '/projects',
      color: 'bg-gradient-to-r from-blue-500 to-cyan-500',
    },
    {
      title: 'Developer Tools',
      description: 'Access utility tools',
      icon: Wrench,
      link: '/tools',
      color: 'bg-gradient-to-r from-green-500 to-emerald-500',
    },
    {
      title: 'Settings',
      description: 'Customize your experience',
      icon: Settings,
      link: '/settings',
      color: 'bg-gradient-to-r from-orange-500 to-red-500',
    },
  ]

  return (
    <div className="flex-1 space-y-8 p-6">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/5 via-accent/5 to-secondary/5 p-8 md:p-12">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Zap className="h-4 w-4" />
            </div>
            <Badge variant="secondary" className="animate-fade-in-up">
              Early Alpha
            </Badge>
          </div>

          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-4 animate-fade-in-up">
            Welcome to <span className="gradient-text">Locally</span>
          </h1>

          <p
            className="text-xl text-muted-foreground mb-8 max-w-2xl animate-fade-in-up"
            style={{ animationDelay: '0.2s' }}
          >
            Your modern desktop companion for project management. Create, organize, and manage your
            development projects with powerful tools and seamless integrations.
          </p>

          <div
            className="flex flex-col sm:flex-row gap-4 animate-fade-in-up"
            style={{ animationDelay: '0.4s' }}
          >
            <Link to="/projects">
              <Button size="lg" className="group hover-lift">
                Get Started
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
            <Button variant="outline" size="lg" className="hover-lift">
              <Play className="mr-2 h-4 w-4" />
              Watch Demo
            </Button>
          </div>
        </div>

        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-primary/10 to-accent/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-secondary/10 to-primary/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
      </div>

      {/* Quick Actions */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action, index) => (
            <Link key={action.title} to={action.link}>
              <Card
                className="hover-lift cursor-pointer transition-all duration-300 hover:shadow-lg group animate-fade-in-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <CardContent className="p-6">
                  <div
                    className={`w-12 h-12 rounded-lg ${action.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}
                  >
                    <action.icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="font-semibold mb-2">{action.title}</h3>
                  <p className="text-sm text-muted-foreground">{action.description}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Features Section */}
      <div className="space-y-4">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold">Powerful Features</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Everything you need to manage your development projects efficiently
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {features.map((feature, index) => (
            <Card
              key={feature.title}
              className="hover-lift animate-fade-in-up"
              style={{ animationDelay: `${index * 0.1 + 0.5}s` }}
            >
              <CardHeader>
                <div
                  className={`w-12 h-12 rounded-lg ${feature.bgColor} flex items-center justify-center mb-4`}
                >
                  <feature.icon className={`h-6 w-6 ${feature.color}`} />
                </div>
                <CardTitle>{feature.title}</CardTitle>
                <CardDescription>{feature.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>

      {/* Stats Section */}
      <Card
        className="bg-gradient-to-r from-primary/5 to-accent/5 border-0 animate-fade-in-up"
        style={{ animationDelay: '1s' }}
      >
        <CardContent className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold gradient-text mb-2">∞</div>
              <p className="text-muted-foreground">Projects Supported</p>
            </div>
            <div>
              <div className="text-3xl font-bold gradient-text mb-2">4+</div>
              <p className="text-muted-foreground">Framework Types</p>
            </div>
            <div>
              <div className="text-3xl font-bold gradient-text mb-2">3</div>
              <p className="text-muted-foreground">Platforms</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default Home
