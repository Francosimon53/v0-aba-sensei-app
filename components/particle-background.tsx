"use client"

import { useEffect, useRef } from "react"

interface Particle {
  x: number
  y: number
  size: number
  speedX: number
  speedY: number
  opacity: number
  twinkleSpeed: number
  twinklePhase: number
  hasGlow: boolean
}

export function ParticleBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let animationId: number
    let particles: Particle[] = []

    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    const createParticles = () => {
      particles = []
      const particleCount = Math.min(120, Math.floor((canvas.width * canvas.height) / 15000))

      for (let i = 0; i < particleCount; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: Math.random() * 2 + 0.5,
          speedX: (Math.random() - 0.5) * 0.15,
          speedY: (Math.random() - 0.5) * 0.15,
          opacity: Math.random() * 0.5 + 0.2,
          twinkleSpeed: Math.random() * 0.02 + 0.005,
          twinklePhase: Math.random() * Math.PI * 2,
          hasGlow: Math.random() > 0.7,
        })
      }
    }

    const drawParticle = (particle: Particle, time: number) => {
      const twinkle = Math.sin(time * particle.twinkleSpeed + particle.twinklePhase)
      const currentOpacity = particle.opacity * (0.7 + twinkle * 0.3)

      if (particle.hasGlow) {
        // Draw glow effect
        const gradient = ctx.createRadialGradient(
          particle.x,
          particle.y,
          0,
          particle.x,
          particle.y,
          particle.size * 4
        )
        gradient.addColorStop(0, `rgba(168, 85, 247, ${currentOpacity * 0.4})`)
        gradient.addColorStop(0.5, `rgba(168, 85, 247, ${currentOpacity * 0.1})`)
        gradient.addColorStop(1, "transparent")
        ctx.fillStyle = gradient
        ctx.beginPath()
        ctx.arc(particle.x, particle.y, particle.size * 4, 0, Math.PI * 2)
        ctx.fill()
      }

      // Draw particle core
      ctx.fillStyle = `rgba(255, 255, 255, ${currentOpacity})`
      ctx.beginPath()
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
      ctx.fill()
    }

    const updateParticle = (particle: Particle) => {
      particle.x += particle.speedX
      particle.y += particle.speedY

      // Wrap around edges
      if (particle.x < 0) particle.x = canvas.width
      if (particle.x > canvas.width) particle.x = 0
      if (particle.y < 0) particle.y = canvas.height
      if (particle.y > canvas.height) particle.y = 0
    }

    const animate = (time: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      for (const particle of particles) {
        updateParticle(particle)
        drawParticle(particle, time)
      }

      animationId = requestAnimationFrame(animate)
    }

    resizeCanvas()
    createParticles()
    animationId = requestAnimationFrame(animate)

    window.addEventListener("resize", () => {
      resizeCanvas()
      createParticles()
    })

    return () => {
      cancelAnimationFrame(animationId)
      window.removeEventListener("resize", resizeCanvas)
    }
  }, [])

  return (
    <>
      {/* Gradient background */}
      <div
        className="fixed inset-0 z-0"
        style={{
          background: "linear-gradient(180deg, #0a0015 0%, #1a0030 50%, #0a0015 100%)",
        }}
      />
      {/* Canvas for particles */}
      <canvas ref={canvasRef} className="fixed inset-0 z-0 pointer-events-none" />
      {/* Gradient overlay for text contrast */}
      <div className="fixed inset-0 z-0 bg-gradient-to-b from-transparent via-transparent to-black/50 pointer-events-none" />
    </>
  )
}
