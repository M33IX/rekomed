import type { Variants } from 'motion/react'

export const motionEase = [0.22, 1, 0.36, 1] as const

export const motionViewport = {
  once: true,
  margin: '0px 0px -72px 0px'
} as const

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 22 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.42, ease: motionEase }
  }
}

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { duration: 0.35, ease: motionEase }
  }
}

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.98, y: 12 },
  show: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.42, ease: motionEase }
  }
}

export const staggerContainer: Variants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.07,
      delayChildren: 0.04
    }
  }
}

export const cardHover = {
  y: -4,
  transition: { duration: 0.22, ease: motionEase }
}

export const buttonArrow = {
  x: 4,
  transition: { duration: 0.18, ease: motionEase }
}

export const accordionTransition = {
  duration: 0.28,
  ease: motionEase
}
