'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, Save, Eye, Upload, ImageIcon, Bold, Italic, List, Link2, Quote, Code, Heading1, Heading2, Heading3, AlignLeft, AlignCenter, AlignRight, Undo, Redo, Type, FileText, Tag, Calendar, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

// Temporary inline components to avoid import issues
interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  htmlFor?: string
  className?: string
  children: React.ReactNode
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  className?: string
}

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary"
  className?: string
  children: React.ReactNode
}

interface SelectProps {
  value?: string
  onValueChange?: (value: string) => void
  children?: React.ReactNode
}

const Label = ({ htmlFor, className, children, ...props }: LabelProps) => (
  <label
    htmlFor={htmlFor}
    className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${className || ''}`}
    {...props}
  >
    {children}
  </label>
)

const Textarea = ({ className, ...props }: TextareaProps) => (
  <textarea
    className={`flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className || ''}`}
    {...props}
  />
)

const Badge = ({ variant = "default", className, children, ...props }: BadgeProps) => {
  const baseClasses = "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
  const variantClasses = variant === "secondary" 
    ? "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80"
    : "border-transparent bg-primary text-primary-foreground hover:bg-primary/80"
  
  return (
    <div className={`${baseClasses} ${variantClasses} ${className || ''}`} {...props}>
      {children}
    </div>
  )
}

// Simple Select implementation
const Select = ({ value, onValueChange }: SelectProps) => {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onValueChange?.(e.target.value)}
        className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <option value="">Select a category</option>
        <option value="technology">Technology</option>
        <option value="business">Business</option>
        <option value="politics">Politics</option>
        <option value="sports">Sports</option>
        <option value="health">Health</option>
        <option value="science">Science</option>
        <option value="environment">Environment</option>
        <option value="culture">Culture</option>
      </select>
    </div>
  )
}

const SelectTrigger = ({ children, className }: { children: React.ReactNode, className?: string }) => <div className={className}>{children}</div>
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const SelectValue = ({ placeholder }: { placeholder?: string }) => null
const SelectContent = ({ children }: { children: React.ReactNode }) => <>{children}</>
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const SelectItem = ({ children, value }: { children: React.ReactNode, value?: string }) => <>{children}</>

export default function AddArticlePage() {
  const [title, setTitle] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [content, setContent] = useState('')
  const [category, setCategory] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [featuredImage, setFeaturedImage] = useState('')
  const [isDraft, setIsDraft] = useState(false)

  // WYSIWYG Editor Functions
  const formatText = (command: string, value?: string) => {
    document.execCommand(command, false, value)
  }

  const insertLink = () => {
    const url = prompt('Enter URL:')
    if (url) {
      formatText('createLink', url)
    }
  }

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()])
      setTagInput('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove))
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addTag()
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const articleData = {
      title,
      excerpt,
      content,
      category,
      tags,
      featuredImage,
      isDraft,
      publishedAt: new Date().toISOString()
    }
    console.log('Article submitted:', articleData)
    // Handle article submission here
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setFeaturedImage(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link href="/" className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200">
                <ArrowLeft className="h-5 w-5" />
                <span>Back to Home</span>
              </Link>
              <div className="h-6 w-px bg-gray-300 dark:bg-gray-600"></div>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
                <FileText className="h-5 w-5 text-brand-primary" />
                <span>Add New Article</span>
              </h1>
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="outline" onClick={() => setIsDraft(true)} className="flex items-center space-x-2">
                <Save className="h-4 w-4" />
                <span>Save Draft</span>
              </Button>
              <Button onClick={handleSubmit} className="bg-brand-primary hover:bg-brand-secondary flex items-center space-x-2">
                <Eye className="h-4 w-4" />
                <span>Publish</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Article Title */}
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title" className="text-base font-medium flex items-center space-x-2">
                      <Type className="h-4 w-4" />
                      <span>Article Title</span>
                    </Label>
                    <Input
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Enter an engaging title for your article..."
                      className="mt-2 text-lg h-12"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="excerpt" className="text-base font-medium">Article Excerpt</Label>
                    <Textarea
                      id="excerpt"
                      value={excerpt}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setExcerpt(e.target.value)}
                      placeholder="Write a brief summary of your article..."
                      className="mt-2 h-24"
                      maxLength={200}
                    />
                    <p className="text-sm text-gray-500 mt-1">{excerpt.length}/200 characters</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* WYSIWYG Editor */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="h-5 w-5" />
                  <span>Article Content</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                
                {/* Editor Toolbar */}
                <div className="border-b border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800">
                  <div className="flex flex-wrap items-center gap-2">
                    
                    {/* Text Formatting */}
                    <div className="flex items-center space-x-1 border-r border-gray-300 dark:border-gray-600 pr-3">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => formatText('bold')}
                        className="h-8 w-8 p-0"
                      >
                        <Bold className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => formatText('italic')}
                        className="h-8 w-8 p-0"
                      >
                        <Italic className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => formatText('underline')}
                        className="h-8 w-8 p-0"
                      >
                        <span className="text-sm font-bold underline">U</span>
                      </Button>
                    </div>

                    {/* Headings */}
                    <div className="flex items-center space-x-1 border-r border-gray-300 dark:border-gray-600 pr-3">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => formatText('formatBlock', 'h1')}
                        className="h-8 w-8 p-0"
                      >
                        <Heading1 className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => formatText('formatBlock', 'h2')}
                        className="h-8 w-8 p-0"
                      >
                        <Heading2 className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => formatText('formatBlock', 'h3')}
                        className="h-8 w-8 p-0"
                      >
                        <Heading3 className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Lists */}
                    <div className="flex items-center space-x-1 border-r border-gray-300 dark:border-gray-600 pr-3">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => formatText('insertUnorderedList')}
                        className="h-8 w-8 p-0"
                      >
                        <List className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => formatText('insertOrderedList')}
                        className="h-8 w-8 p-0"
                      >
                        <span className="text-sm font-bold">1.</span>
                      </Button>
                    </div>

                    {/* Alignment */}
                    <div className="flex items-center space-x-1 border-r border-gray-300 dark:border-gray-600 pr-3">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => formatText('justifyLeft')}
                        className="h-8 w-8 p-0"
                      >
                        <AlignLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => formatText('justifyCenter')}
                        className="h-8 w-8 p-0"
                      >
                        <AlignCenter className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => formatText('justifyRight')}
                        className="h-8 w-8 p-0"
                      >
                        <AlignRight className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Insert Elements */}
                    <div className="flex items-center space-x-1 border-r border-gray-300 dark:border-gray-600 pr-3">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={insertLink}
                        className="h-8 w-8 p-0"
                      >
                        <Link2 className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => formatText('formatBlock', 'blockquote')}
                        className="h-8 w-8 p-0"
                      >
                        <Quote className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => formatText('formatBlock', 'pre')}
                        className="h-8 w-8 p-0"
                      >
                        <Code className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Undo/Redo */}
                    <div className="flex items-center space-x-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => formatText('undo')}
                        className="h-8 w-8 p-0"
                      >
                        <Undo className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => formatText('redo')}
                        className="h-8 w-8 p-0"
                      >
                        <Redo className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Editor Content Area */}
                <div className="p-6">
                  <div
                    contentEditable
                    className="min-h-[400px] w-full p-4 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary bg-white dark:bg-gray-800 text-gray-900 dark:text-white prose prose-lg max-w-none"
                    style={{ lineHeight: '1.6' }}
                    onInput={(e) => setContent((e.target as HTMLElement).innerHTML)}
                    suppressContentEditableWarning={true}
                  >
                    <p>Start writing your article here...</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            
            {/* Publish Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5" />
                  <span>Publish Settings</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="technology">Technology</SelectItem>
                      <SelectItem value="business">Business</SelectItem>
                      <SelectItem value="politics">Politics</SelectItem>
                      <SelectItem value="sports">Sports</SelectItem>
                      <SelectItem value="health">Health</SelectItem>
                      <SelectItem value="science">Science</SelectItem>
                      <SelectItem value="environment">Environment</SelectItem>
                      <SelectItem value="culture">Culture</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="tags" className="flex items-center space-x-2">
                    <Tag className="h-4 w-4" />
                    <span>Tags</span>
                  </Label>
                  <div className="mt-2 space-y-2">
                    <div className="flex space-x-2">
                      <Input
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Add a tag..."
                        className="flex-1"
                      />
                      <Button type="button" onClick={addTag} size="sm">
                        Add
                      </Button>
                    </div>
                    {tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {tags.map((tag, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {tag}
                            <button
                              type="button"
                              onClick={() => removeTag(tag)}
                              className="ml-2 text-gray-500 hover:text-gray-700"
                            >
                              ×
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Featured Image */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <ImageIcon className="h-5 w-5" />
                  <span>Featured Image</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {featuredImage ? (
                    <div className="relative">
                      <Image
                        src={featuredImage}
                        alt="Featured image preview"
                        width={400}
                        height={160}
                        className="w-full h-40 object-cover rounded-lg"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => setFeaturedImage('')}
                        className="absolute top-2 right-2"
                      >
                        Remove
                      </Button>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
                      <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        Upload a featured image
                      </p>
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        id="featured-image"
                      />
                      <Label htmlFor="featured-image" className="cursor-pointer">
                        <Button type="button" variant="outline" size="sm" asChild>
                          <span>Choose File</span>
                        </Button>
                      </Label>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Author Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="h-5 w-5" />
                  <span>Author</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-brand-primary to-brand-secondary rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm">VN</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Vand News Editor</p>
                    <p className="text-sm text-gray-500">Senior Writer</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </form>
      </div>
    </div>
  )
}
