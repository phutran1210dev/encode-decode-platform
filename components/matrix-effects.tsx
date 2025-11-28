"use client"

import { useEffect, useRef } from 'react'
// Matrix effects without anime.js dependency

interface MatrixRainProps {
  className?: string
}

export default function MatrixRain({ className = "" }: MatrixRainProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    
    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    // Matrix rain characters
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%^&*()_+-=[]{}|;:,.<>?'
    const charArray = chars.split('')

    const fontSize = 14
    const columns = canvas.width / fontSize

    // Initialize drops
    const drops: number[] = []
    for (let i = 0; i < columns; i++) {
      drops[i] = Math.floor(Math.random() * canvas.height / fontSize)
    }

    // Animation function
    const draw = () => {
      // Black background with transparency for trail effect
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      ctx.fillStyle = '#00ff00'
      ctx.font = `${fontSize}px monospace`

      for (let i = 0; i < drops.length; i++) {
        const text = charArray[Math.floor(Math.random() * charArray.length)]
        const x = i * fontSize
        const y = drops[i] * fontSize

        ctx.fillStyle = `rgba(0, 255, 0, ${Math.random() * 0.5 + 0.5})`
        ctx.fillText(text, x, y)

        // Reset drop randomly or when it reaches bottom
        if (y > canvas.height && Math.random() > 0.975) {
          drops[i] = 0
        }
        drops[i]++
      }
    }

    // Start animation
    const interval = setInterval(draw, 50)

    return () => {
      clearInterval(interval)
      window.removeEventListener('resize', resizeCanvas)
    }
  }, [])

  return (
    <canvas 
      ref={canvasRef}
      className={`fixed top-0 left-0 w-full h-full pointer-events-none z-0 opacity-20 ${className}`}
    />
  )
}

// Typing animation component
interface TypingTextProps {
  text: string
  className?: string
  delay?: number
  speed?: number
}

export function TypingText({ text, className = "", delay = 0, speed = 50 }: TypingTextProps) {
  const textRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (!textRef.current) return

    const element = textRef.current
    element.textContent = ''

    // Simple typing animation without anime.js
    let i = 0
    const typeInterval = setInterval(() => {
      element.textContent = text.substring(0, i)
      i++
      if (i > text.length) {
        clearInterval(typeInterval)
        // Remove cursor after typing is complete
        setTimeout(() => {
          element.classList.remove('border-r-2')
        }, 500)
      }
    }, speed)

    const timeoutId = setTimeout(() => {
      clearInterval(typeInterval)
    }, delay + (text.length * speed) + 1000)

    return () => {
      clearInterval(typeInterval)
      clearTimeout(timeoutId)
    }
  }, [text, delay, speed])

  return (
    <span 
      ref={textRef}
      className={`border-r-2 border-green-500 ${className}`}
    />
  )
}

// Glitch effect component
interface GlitchTextProps {
  text: string
  className?: string
}

export function GlitchText({ text, className = "" }: GlitchTextProps) {
  const textRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (!textRef.current) return

    const element = textRef.current
    const originalText = text

    const glitch = () => {
      const chars = '!<>-_\\/[]{}—=+*^?#________'
      let iterations = 0
      
      const interval = setInterval(() => {
        element.textContent = originalText
          .split('')
          .map((char, index) => {
            if (index < iterations) {
              return originalText[index]
            }
            return chars[Math.floor(Math.random() * chars.length)]
          })
          .join('')
        
        if (iterations >= originalText.length) {
          clearInterval(interval)
          element.textContent = originalText
        }
        
        iterations += 1 / 3
      }, 30)
    }

    // Trigger glitch effect randomly
    const randomGlitch = setInterval(() => {
      if (Math.random() > 0.8) {
        glitch()
      }
    }, 3000)

    return () => {
      clearInterval(randomGlitch)
    }
  }, [text])

  return (
    <span 
      ref={textRef}
      className={`glow-text ${className}`}
    >
      {text}
    </span>
  )
}