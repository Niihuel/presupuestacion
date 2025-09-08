'use client';

import React, { ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { 
  Card,
  Button,
  Input,
  Tabs
} from '../ui';

interface AnimatedPageTemplateProps {
  children: ReactNode;
  className?: string;
  title?: string;
  description?: string;
}

export default function AnimatedPageTemplate({ 
  children,
  className = '',
  title,
  description
}: AnimatedPageTemplateProps) {
  const pathname = usePathname();
  
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
        transition={{ 
          duration: 0.3,
          type: 'spring',
          stiffness: 100,
          damping: 20
        }}
        className={className}
      >
        {title && (
          <header className="mb-6">
            <h1 className="text-2xl font-bold">{title}</h1>
            {description && <p className="text-gray-500 mt-1">{description}</p>}
          </header>
        )}
        
        {children}
      </motion.div>
    </AnimatePresence>
  );
}