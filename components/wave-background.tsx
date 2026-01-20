"use client"

import { useEffect, useRef } from "react"

interface WaveParticle {
  x: number
  baseY: number
  y: number
  size: number
  speed: number
  amplitude: number
  frequency: number
  phase: number
  opacity: number
  isAccent: boolean
}

export function WaveBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let animationId: number
    let particles: WaveParticle[] = []
    let time = 0

    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    const createParticles = () => {
      particles = []
      const particleCount = 60

      for (let i = 0; i < particleCount; i++) {
        const isAccent = Math.random() < 0.15 // 15% chance for amber accent
        
        particles.push({
          x: Math.random() * canvas.width,
          baseY: Math.random() * canvas.height,
          y: 0,
          size: Math.random() * 1.5 + 1, // 1-2.5px
          speed: 0.15 + Math.random() * 0.2, // Slow movement
          amplitude: 20 + Math.random() * 40,
          frequency: 0.001 + Math.random() * 0.001,
          phase: Math.random() * Math.PI * 2,
          opacity: 0.08 + Math.random() * 0.15, // 8-23% opacity
          isAccent,
        })
      }
    }

    const drawParticle = (particle: WaveParticle) => {
      // Soft purple for most, amber for accents
      const baseColor = particle.isAccent 
        ? `rgba(217, 119, 6, ${particle.opacity})` // Amber #d97706
        : `rgba(107, 33, 168, ${particle.opacity})` // Purple #6b21a8
      
      // Very subtle glow
      const glowSize = particle.size * 4
      const gradient = ctx.createRadialGradient(
        particle.x, particle.y, 0,
        particle.x, particle.y, glowSize
      )
      gradient.addColorStop(0, baseColor)
      gradient.addColorStop(0.5, particle.isAccent 
        ? `rgba(217, 119, 6, ${particle.opacity * 0.3})`
        : `rgba(107, 33, 168, ${particle.opacity * 0.3})`)
      gradient.addColorStop(1, "transparent")
      
      ctx.fillStyle = gradient
      ctx.beginPath()
      ctx.arc(particle.x, particle.y, glowSize, 0, Math.PI * 2)
      ctx.fill()

      // Small core dot
      ctx.fillStyle = baseColor
      ctx.beginPath()
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
      ctx.fill()
    }

    const updateParticle = (particle: WaveParticle) => {
      // Slow horizontal drift
      particle.x += particle.speed

      // Gentle wave motion
      const wave1 = Math.sin(particle.x * particle.frequency + particle.phase + time * 0.0005)
      const wave2 = Math.sin(particle.x * particle.frequency * 0.7 + particle.phase + time * 0.0003) * 0.5
      
      particle.y = particle.baseY + (wave1 + wave2) * particle.amplitude

      // Wrap around
      if (particle.x > canvas.width + 10) {
        particle.x = -10
        particle.baseY = Math.random() * canvas.height
      }
    }

    const animate = () => {
      time++
      
      // Slow fade for smooth trails
      ctx.fillStyle = "rgba(5, 5, 15, 0.08)"
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      for (const particle of particles) {
        updateParticle(particle)
        drawParticle(particle)
      }

      animationId = requestAnimationFrame(animate)
    }

    resizeCanvas()
    createParticles()
    
    // Initial fill
    ctx.fillStyle = "#050510"
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    
    animationId = requestAnimationFrame(animate)

    const handleResize = () => {
      resizeCanvas()
      createParticles()
      ctx.fillStyle = "#050510"
      ctx.fillRect(0, 0, canvas.width, canvas.height)
    }

    window.addEventListener("resize", handleResize)

    return () => {
      cancelAnimationFrame(animationId)
      window.removeEventListener("resize", handleResize)
    }
  }, [])

  return (
    <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }}>
      <div
        className="absolute inset-0"
        style={{
          background: "linear-gradient(180deg, #050510 0%, #0a0a18 50%, #050510 100%)",
        }}
      />
      <canvas 
        ref={canvasRef} 
        className="absolute inset-0"
      />
    </div>
  )
}
