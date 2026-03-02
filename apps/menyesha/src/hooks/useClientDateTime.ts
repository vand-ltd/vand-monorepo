'use client'

import { useState, useEffect } from 'react'

export function useClientDateTime() {
  const [currentDate, setCurrentDate] = useState('')
  const [currentTime, setCurrentTime] = useState('')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    
    const updateDateTime = () => {
      const now = new Date()
      setCurrentDate(now.toLocaleDateString())
      setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
    }
    
    updateDateTime()
    
    // Update time every minute
    const interval = setInterval(updateDateTime, 60000)
    
    return () => clearInterval(interval)
  }, [])

  return {
    currentDate,
    currentTime,
    mounted,
    isClient: mounted
  }
}

export function useClientOnly() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return mounted
}
