'use client';

import { motion, Transition } from 'framer-motion';
import { ReactNode } from 'react';

interface PageAnimatorProps {
  children: ReactNode;
  className?: string;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: "easeOut" as const
    }
  }
};

export function PageAnimator({ children, className = '' }: PageAnimatorProps) {
  // Convert children to array to handle both single and multiple children
  const childrenArray = Array.isArray(children) ? children : [children];
  
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className={className}
    >
      {childrenArray.map((child, index) => (
        <motion.div key={index} variants={itemVariants}>
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
}