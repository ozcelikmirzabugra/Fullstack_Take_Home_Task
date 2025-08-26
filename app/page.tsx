import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle2, Shield, Zap, Database, Clock, BarChart3 } from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export default async function HomePage() {
  const supabase = await createClient()
  
  // Check if user is already authenticated
  const { data: { user } } = await supabase.auth.getUser()
  
  if (user) {
    redirect('/dashboard')
  }

  const features = [
    {
      icon: <CheckCircle2 className="h-6 w-6" />,
      title: 'Task Management',
      description: 'Create, edit, and track your tasks with ease. Organize your work efficiently.',
    },
    {
      icon: <Shield className="h-6 w-6" />,
      title: 'Secure & Private',
      description: 'Your data is protected with Row Level Security and advanced authentication.',
    },
    {
      icon: <Zap className="h-6 w-6" />,
      title: 'Fast Performance',
      description: 'Optimized with caching and rate limiting for lightning-fast response times.',
    },
    {
      icon: <Database className="h-6 w-6" />,
      title: 'Reliable Backend',
      description: 'Built with Supabase for robust, scalable, and reliable data management.',
    },
    {
      icon: <Clock className="h-6 w-6" />,
      title: 'Real-time Updates',
      description: 'Instant synchronization across all your devices and sessions.',
    },
    {
      icon: <BarChart3 className="h-6 w-6" />,
      title: 'Analytics Ready',
      description: 'Comprehensive logging and monitoring for optimal performance.',
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="border-b border-border">
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
            Professional Task Manager
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            A secure, fast, and reliable task management application built with modern technologies.
            Manage your tasks efficiently with advanced security and performance features.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link href="/login">
              <Button size="lg">
                Sign In
              </Button>
            </Link>
            <Link href="/signup">
              <Button variant="outline" size="lg">
                Create Account
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Built for Production
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              This application demonstrates enterprise-grade features including authentication,
              caching, rate limiting, security headers, and automated maintenance.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="h-full">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="text-primary">
                      {feature.icon}
                    </div>
                    <CardTitle className="text-lg">
                      {feature.title}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Technical Stack Section */}
      <section className="py-16 bg-muted/20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Modern Technology Stack
            </h2>
            <p className="text-lg text-muted-foreground">
              Built with cutting-edge technologies for optimal performance and security
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <h3 className="font-semibold text-foreground mb-2">Frontend</h3>
              <p className="text-sm text-muted-foreground">Next.js 15</p>
              <p className="text-sm text-muted-foreground">TypeScript</p>
              <p className="text-sm text-muted-foreground">shadcn/ui</p>
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-2">Backend</h3>
              <p className="text-sm text-muted-foreground">Supabase</p>
              <p className="text-sm text-muted-foreground">Row Level Security</p>
              <p className="text-sm text-muted-foreground">API Routes</p>
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-2">Performance</h3>
              <p className="text-sm text-muted-foreground">Redis Caching</p>
              <p className="text-sm text-muted-foreground">Rate Limiting</p>
              <p className="text-sm text-muted-foreground">Optimization</p>
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-2">Security</h3>
              <p className="text-sm text-muted-foreground">CSP Headers</p>
              <p className="text-sm text-muted-foreground">CORS Policy</p>
              <p className="text-sm text-muted-foreground">Validation</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16">
        <div className="container mx-auto px-4 text-center">
          <Card className="max-w-2xl mx-auto">
            <CardContent className="pt-6">
              <h2 className="text-2xl font-bold text-foreground mb-4">
                Ready to Get Started?
              </h2>
              <p className="text-muted-foreground mb-6">
                Create your account and start managing your tasks with our professional-grade application.
              </p>
              <div className="flex items-center justify-center gap-4">
                <Link href="/signup">
                  <Button size="lg">
                    Get Started Free
                  </Button>
                </Link>
                <Link href="/login">
                  <Button variant="outline" size="lg">
                    Sign In
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-muted-foreground">
            Professional Task Manager - Built with Next.js 15, Supabase, and modern web technologies
          </p>
        </div>
      </footer>
    </div>
  )
}