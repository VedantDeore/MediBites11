"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"

const healthTranslations = [
  { language: "English", text: "Health", color: "#22c55e" }, // green-600
  { language: "Hindi", text: "स्वास्थ्य", color: "#ef4444" }, // red-500
  { language: "German", text: "Gesundheit", color: "#3b82f6" }, // blue-500
  { language: "French", text: "Santé", color: "#f59e0b" }, // amber-500
  { language: "Chinese", text: "健康", color: "#8b5cf6" }, // violet-500
  { language: "Spanish", text: "Salud", color: "#ec4899" }, // pink-500
  { language: "Japanese", text: "健康", color: "#06b6d4" }, // cyan-500
  { language: "Arabic", text: "صحة", color: "#14b8a6" }, // teal-500
]

const useLanguageCycle = (interval = 2000) => {
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % healthTranslations.length)
    }, interval)

    return () => clearInterval(timer)
  }, [interval])

  return healthTranslations[currentIndex]
}

export function AnimatedHealth() {
  const { text, color } = useLanguageCycle()

  return (
    <span className="inline-block" style={{ minWidth: "150px", height: "1.2em" }}>
      <AnimatePresence mode="wait">
        <motion.span
          key={text}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          style={{ color }}
          className="inline-flex items-center justify-center w-full h-full font-bold"
        >
          {text}
        </motion.span>
      </AnimatePresence>
    </span>
  )
}

