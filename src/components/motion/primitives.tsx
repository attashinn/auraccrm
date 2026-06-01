"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import { blurIn, fadeUp } from "@/lib/motion";

type MotionDivProps = HTMLMotionProps<"div"> & {
  delay?: number;
};

export function FadeUp({ children, delay = 0, className, ...props }: MotionDivProps) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-40px" }}
      custom={delay}
      variants={fadeUp}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function BlurIn({ children, delay = 0, className, ...props }: MotionDivProps) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-40px" }}
      custom={delay}
      variants={blurIn}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function ScaleCard({ children, className, ...props }: MotionDivProps) {
  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}
