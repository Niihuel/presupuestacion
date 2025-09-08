'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
}

export function PageTransition({ children, className = '' }: PageTransitionProps) {
  const pathname = usePathname();
  
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial={{ opacity: 0, x: -200 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 200 }}
        transition={{ 
          type: "spring", 
          stiffness: 300, 
          damping: 30,
          // Add slight delay for better perceived performance
          delay: 0.1
        }}
        className={className}
        // Add performance optimizations
        style={{
          position: 'relative',
          willChange: 'transform, opacity',
          transformStyle: 'preserve-3d',
          backfaceVisibility: 'hidden'
        }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

export function SectionTransition({ 
  children, 
  className = '', 
  delay = 0
}: PageTransitionProps & { delay?: number }) {
  return (
    <motion.section
      className={className}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      transition={{ 
        duration: 0.25,
        delay,
        ease: [0.22, 1, 0.36, 1]
      }}
      style={{
        position: 'relative',
        willChange: 'transform, opacity',
        transformStyle: 'preserve-3d',
        backfaceVisibility: 'hidden'
      }}
    >
      {children}
    </motion.section>
  );
}

export function CardTransition({ 
  children, 
  className = '', 
  delay = 0,
  index = 0 
}: PageTransitionProps & { delay?: number; index?: number }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      transition={{ 
        duration: 0.2,
        delay: delay + index * 0.05, // Staggered delay based on item index
        ease: [0.22, 1, 0.36, 1]
      }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      style={{
        position: 'relative',
        willChange: 'transform, opacity',
        transformStyle: 'preserve-3d',
        backfaceVisibility: 'hidden'
      }}
    >
      {children}
    </motion.div>
  );
}

export function FadeInTransition({ 
  children, 
  className = '', 
  delay = 0 
}: PageTransitionProps & { delay?: number }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ 
        duration: 0.3,
        delay,
        ease: "easeInOut"
      }}
    >
      {children}
    </motion.div>
  );
}

export function ListItemTransition({ 
  children, 
  className = '', 
  index = 0 
}: PageTransitionProps & { index: number }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -10 }}
      transition={{ 
        duration: 0.15,
        delay: index * 0.05,
        ease: "easeOut"
      }}
    >
      {children}
    </motion.div>
  );
}