"use client";
import React, { useState } from "react";
import {
  motion,
  AnimatePresence,
  useScroll,
  useMotionValueEvent,
} from "framer-motion"; // Changed to framer-motion
import { cn } from "@/app/lib/utils";
import Link from "next/link";

export const FloatingNav = ({
  navItems,
  className,
}: {
  navItems: {
    name: string;
    link: string;
    icon?: React.ReactNode; // Added icon type
  }[];
  className?: string;
}) => {
  const { scrollYProgress } = useScroll();
  const [visible, setVisible] = useState(true); // Default to true so it's visible on load

  useMotionValueEvent(scrollYProgress, "change", (current) => {
    if (typeof current === "number") {
      let direction = current! - scrollYProgress.getPrevious()!;

      if (scrollYProgress.get() < 0.05) {
        setVisible(true); // Keep visible at top
      } else {
        if (direction < 0) {
          setVisible(true); // Show on scroll up
        } else {
          setVisible(false); // Hide on scroll down
        }
      }
    }
  });

  return (
    <motion.div
      initial={{
        opacity: 1,
        y: -100,
      }}
      animate={{
        y: visible ? 0 : -100,
        opacity: visible ? 1 : 0,
      }}
      transition={{
        duration: 0.2,
      }}
      className={cn(
        "fixed top-10 inset-x-0 mx-auto border border-transparent dark:border-green-500/50 rounded-full dark:bg-black/50 bg-white shadow-lg z-[5000] pr-2 pl-8 py-2 flex items-center justify-center space-x-4 max-w-fit",
        className
      )}
    >
      {navItems.map((navItem, idx) => (
        <a
          key={`link=${idx}`}
          href={navItem.link}
          className={cn(
            "relative dark:text-neutral-50 items-center flex space-x-1 text-neutral-600 dark:hover:text-green-300 hover:text-green-500"
          )}
        >
          <span className="block sm:hidden">{navItem.icon}</span>
          <span className="hidden sm:block text-sm">{navItem.name}</span>
        </a>
      ))}
      <Link href="/auth">
      <button className="border text-sm cursor-pointer font-medium relative border-neutral-200 dark:border-green-500/50 text-black dark:text-white px-4 py-2 rounded-full">
        <span>Login</span>
        <span className="absolute inset-x-0 w-1/2 mx-auto -bottom-px bg-gradient-to-r from-transparent via-green-200 to-transparent h-px" />
      </button>
      </Link>
    </motion.div>
  );
};