'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { ArrowLeft, Eye, EyeOff, Mail, Lock, Chrome, Apple, Github, Shield, Zap, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [name, setName] = useState('')
  const router = useRouter()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Form submitted:', { email, password, name })

    if (email && password) {
      router.push('/add-article')
    } else {
      alert('Please enter valid credentials')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-amber-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: '60px 60px'
        }} />
      </div>

      <div className="w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 relative z-10">

        {/* Left Side - Branding & Features */}
        <div className="hidden lg:flex flex-col justify-center space-y-8 p-8">
          <Link href="/" className="flex items-center space-x-3 mb-8">
            <ArrowLeft className="h-5 w-5 text-brand-primary hover:text-brand-secondary transition-colors" />
            <span className="text-sm text-gray-600 dark:text-gray-400">Back to Home</span>
          </Link>

          <div className="space-y-6">
            <div>
              <Image
                src="/vand.png"
                alt="Vand News"
                width={160}
                height={50}
                className="h-12 w-auto object-contain"
              />
              <p className="text-gray-600 dark:text-gray-400 mt-2">Your Gateway to Global News</p>
            </div>

            <div className="space-y-6 mt-12">
              <h2 className="text-4xl font-bold text-gray-900 dark:text-white leading-tight">
                Join the Future of
                <span className="bg-gradient-to-r from-brand-accent to-brand-secondary bg-clip-text text-transparent block">
                  News & Analysis
                </span>
              </h2>

              <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
                Access premium content, personalized news feeds, and exclusive insights from our expert journalists around the world.
              </p>

              {/* Features */}
              <div className="space-y-4 mt-8">
                {[
                  { icon: Shield, title: 'Verified Sources', desc: 'Only trusted, fact-checked news' },
                  { icon: Zap, title: 'Real-time Updates', desc: 'Breaking news as it happens' },
                  { icon: Users, title: 'Expert Analysis', desc: 'In-depth reporting from professionals' }
                ].map((feature, index) => (
                  <div key={index} className="flex items-center space-x-4 p-4 bg-white/50 dark:bg-gray-800/50 rounded-xl backdrop-blur-sm">
                    <div className="bg-brand-primary/10 dark:bg-brand-primary/20 p-3 rounded-lg">
                      <feature.icon className="h-6 w-6 text-brand-primary dark:text-brand-accent" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">{feature.title}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{feature.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Login/Signup Form */}
        <div className="flex items-center justify-center">
          <Card className="w-full max-w-md bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-0 shadow-2xl">
            <CardContent className="p-8">
              {/* Mobile Logo */}
              <div className="lg:hidden flex items-center justify-between mb-8">
                <Link href="/" className="flex items-center">
                  <Image
                    src="/vand.png"
                    alt="Vand News"
                    width={100}
                    height={34}
                    className="h-8 w-auto object-contain"
                  />
                </Link>
                <Link href="/" className="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200">
                  <ArrowLeft className="h-5 w-5" />
                </Link>
              </div>

              {/* Form Header */}
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  {isLogin ? 'Welcome Back' : 'Join Vand News'}
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  {isLogin ? 'Sign in to your account' : 'Create your account to get started'}
                </p>
              </div>

              {/* Social Login */}
              <div className="space-y-3 mb-6">
                <Button
                  variant="outline"
                  onClick={() => router.push('/add-article')}
                  className="w-full h-12 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <Chrome className="h-5 w-5 mr-3" />
                  Continue with Google
                </Button>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    onClick={() => router.push('/add-article')}
                    className="h-12 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <Apple className="h-5 w-5 mr-2" />
                    Apple
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => router.push('/add-article')}
                    className="h-12 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <Github className="h-5 w-5 mr-2" />
                    GitHub
                  </Button>
                </div>
              </div>

              {/* Divider */}
              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300 dark:border-gray-600" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800">
                    or continue with email
                  </span>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {!isLogin && (
                  <div className="space-y-2">
                    <label htmlFor="name" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Full Name
                    </label>
                    <Input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="h-12"
                      placeholder="Enter your full name"
                      required
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 z-10" />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-12 pl-10"
                      placeholder="Enter your email"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 z-10" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-12 pl-10 pr-10"
                      placeholder="Enter your password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 z-10"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {!isLogin && (
                  <div className="space-y-2">
                    <label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 z-10" />
                      <Input
                        id="confirmPassword"
                        type={showPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="h-12 pl-10"
                        placeholder="Confirm your password"
                        required
                      />
                    </div>
                  </div>
                )}

                {isLogin && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <input
                        id="remember"
                        type="checkbox"
                        className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-brand-primary focus:ring-brand-secondary"
                      />
                      <label htmlFor="remember" className="text-sm text-gray-600 dark:text-gray-400">
                        Remember me
                      </label>
                    </div>
                    <Link href="/forgot-password" className="text-sm text-brand-primary hover:text-brand-secondary dark:text-brand-accent">
                      Forgot password?
                    </Link>
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full h-12 bg-gradient-to-r from-brand-primary to-brand-secondary hover:from-brand-secondary hover:to-brand-primary text-white font-semibold rounded-lg transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  {isLogin ? 'Sign In' : 'Create Account'}
                </Button>
              </form>

              {/* Switch Form */}
              <div className="mt-6 text-center">
                <span className="text-gray-600 dark:text-gray-400">
                  {isLogin ? "Don't have an account?" : "Already have an account?"}
                </span>
                <button
                  onClick={() => setIsLogin(!isLogin)}
                  className="ml-2 text-brand-primary hover:text-brand-secondary dark:text-brand-accent font-semibold"
                >
                  {isLogin ? 'Sign up' : 'Sign in'}
                </button>
              </div>

              {/* Terms */}
              {!isLogin && (
                <p className="mt-6 text-xs text-center text-gray-500 dark:text-gray-400">
                  By creating an account, you agree to our{' '}
                  <Link href="/terms" className="text-brand-primary hover:text-brand-secondary dark:text-brand-accent">
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link href="/privacy" className="text-brand-primary hover:text-brand-secondary dark:text-brand-accent">
                    Privacy Policy
                  </Link>
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
