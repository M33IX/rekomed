'use client'

import type { ReactNode } from 'react'
import { motion, useReducedMotion, type HTMLMotionProps } from 'motion/react'
import { fadeIn, fadeUp, motionViewport, scaleIn, staggerContainer } from '@/lib/motion'

type RevealVariant = 'fadeUp' | 'fadeIn' | 'scaleIn'

type RevealSectionProps = HTMLMotionProps<'section'> & {
  children: ReactNode
  stagger?: boolean
  variant?: RevealVariant
}

type RevealDivProps = HTMLMotionProps<'div'> & {
  children: ReactNode
  stagger?: boolean
  variant?: RevealVariant
}

const getVariant = (variant: RevealVariant, reduced: boolean | null) => {
  if (reduced) return fadeIn
  if (variant === 'scaleIn') return scaleIn
  if (variant === 'fadeIn') return fadeIn
  return fadeUp
}

export function RevealSection({ children, stagger = false, variant = 'fadeUp', ...props }: RevealSectionProps) {
  const reduced = useReducedMotion()

  return (
    <motion.section
      initial="hidden"
      whileInView="show"
      viewport={motionViewport}
      variants={stagger && !reduced ? staggerContainer : getVariant(variant, reduced)}
      {...props}
    >
      {children}
    </motion.section>
  )
}

export function RevealDiv({ children, stagger = false, variant = 'fadeUp', ...props }: RevealDivProps) {
  const reduced = useReducedMotion()

  return (
    <motion.div
      initial="hidden"
      whileInView="show"
      viewport={motionViewport}
      variants={stagger && !reduced ? staggerContainer : getVariant(variant, reduced)}
      {...props}
    >
      {children}
    </motion.div>
  )
}
