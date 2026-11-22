'use client'

import { useEffect, useRef, type ElementType } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export interface WordItem {
  text: string
  className?: string
  isBreak?: boolean
}

export interface WordRevealHeadingProps {
  as?: ElementType
  className?: string
  text?: string
  wordsList?: WordItem[]
  stagger?: number
  delay?: number
  threshold?: string
  immediate?: boolean
}

/**
 * Komponen Judul GSAP + ScrollTrigger yang memunculkan kata per kata (word-by-word reveal)
 * saat elemen di-scroll masuk ke dalam viewport layar.
 */
export default function WordRevealHeading({
  as: Component = 'h2',
  className = '',
  text,
  wordsList,
  stagger = 0.07,
  delay = 0,
  threshold = 'top 85%',
  immediate = false,
}: WordRevealHeadingProps) {
  const containerRef = useRef<HTMLElement>(null)

  // Ekstraksi kata dari text string atau wordsList
  const items: WordItem[] = wordsList
    ? wordsList
    : text
    ? text.split(/\s+/).filter(Boolean).map((w) => ({ text: w }))
    : []

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const words = el.querySelectorAll<HTMLElement>('.gsap-word-token')
    if (words.length === 0) return

    const ctx = gsap.context(() => {
      const animProps: gsap.TweenVars = {
        opacity: 1,
        y: 0,
        rotateX: 0,
        filter: 'blur(0px)',
        duration: 0.65,
        stagger,
        delay,
        ease: 'power3.out',
      }

      if (!immediate) {
        animProps.scrollTrigger = {
          trigger: el,
          start: threshold,
          toggleActions: 'play none none none',
          once: true,
        }
      }

      gsap.fromTo(
        words,
        {
          opacity: 0,
          y: 35,
          rotateX: -35,
          filter: 'blur(5px)',
        },
        animProps,
      )
    }, el)

    return () => ctx.revert()
  }, [stagger, delay, threshold, immediate])

  return (
    <Component
      ref={containerRef}
      className={`inline-block leading-[1.15] [perspective:1000px] ${className}`}
    >
      {items.map((item, idx) => {
        if (item.isBreak) {
          return <br key={`br-${idx}`} className="hidden sm:inline" />
        }
        return (
          <span
            key={`word-${idx}`}
            className="inline-block overflow-hidden py-1 mr-[0.25em] last:mr-0 align-top"
          >
            <span
              className={`gsap-word-token inline-block transform-gpu will-change-transform ${
                item.className || ''
              }`}
            >
              {item.text}
            </span>
          </span>
        )
      })}
    </Component>
  )
}
