"use client";

import * as React from "react";
import { motion } from 'framer-motion';

// Define the variants for animation
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      // 'staggerChildren' is the key property here.
      // Defines a 0.08s delay between the animation of each child.
      staggerChildren: 0.08,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 }, // Starts invisible and 20px below
  visible: {
    opacity: 1,
    y: 0, // Ends visible and at its original position
    transition: {
      ease: [0.22, 1, 0.36, 1] as const, // Using a proper easing function array
      duration: 0.4,
    },
  },
};

interface AnimatedListProps {
  children: React.ReactNode;
  className?: string;
}

export const AnimatedList = ({ children, className }: AnimatedListProps) => {
  return (
    <motion.div
      className={className}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {React.Children.map(children, (child) => (
        <motion.div variants={itemVariants}>{child}</motion.div>
      ))}
    </motion.div>
  );
};