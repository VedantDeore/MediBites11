"use client"

import { Dumbbell, HeartPulse, ArrowRight, Sparkles, Check, Activity, ClipboardList, Shield, BarChart2 } from "lucide-react"
import { motion, useMotionValue, useTransform, animate } from "framer-motion"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

export function PartnershipBanner() {
  const router = useRouter()
  const [currentFeature, setCurrentFeature] = useState(0)
  
  const features = [
    {
      icon: <Activity className="h-5 w-5" />,
      text: "Real-time health monitoring"
    },
    {
      icon: <ClipboardList className="h-5 w-5" />,
      text: "Personalized workout plans"
    },
    {
      icon: <Shield className="h-5 w-5" />,
      text: "Medical-grade safety checks"
    },
    {
      icon: <BarChart2 className="h-5 w-5" />,
      text: "Progress analytics dashboard"
    }
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFeature((prev) => (prev + 1) % features.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  return (
    <motion.section 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      className="w-full h-[110vh] min-h-[500px] relative bg-gradient-to-br from-green-600 via-green-700 to-green-800 overflow-hidden"
    >
      {/* Animated background elements */}
      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1.2, opacity: 0.15 }}
        transition={{ duration: 2, delay: 0.5 }}
        className="absolute -left-20 -top-20 w-64 h-64 rounded-full bg-green-400 blur-3xl"
      />
      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1.2, opacity: 0.15 }}
        transition={{ duration: 2, delay: 0.8 }}
        className="absolute -right-20 -bottom-20 w-64 h-64 rounded-full bg-green-500 blur-3xl"
      />
      
      {/* Floating particles */}
      {[...Array(16)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.6, 0] }}
          transition={{
            duration: 4 + Math.random() * 4,
            repeat: Infinity,
            delay: Math.random() * 2,
            repeatDelay: Math.random() * 5
          }}
          className="absolute text-white"
          style={{
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            fontSize: `${8 + Math.random() * 8}px`
          }}
        >
          <Sparkles className="text-green-300" />
        </motion.div>
      ))}

      <div className="container h-screen py-4 px-4 md:px-2 flex items-center justify-center">
        <div className="relative z-10 w-full max-w-6xl">
          <div className="flex flex-col gap-5">
            {/* Left side - Features List */}
          

            {/* Center - Main Content */}
            <motion.div 
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="flex-1 text-center"
            >
              <motion.div 
                animate={{ 
                  scale: [1, 1.02, 1],
                  y: [0, -5, 0]
                }}
                transition={{
                  duration: 6,
                  repeat: Infinity,
                  repeatType: "reverse"
                }}
                className="inline-block mb-6"
              >
                <div className="relative">
                  <div className="absolute -inset-2 bg-green-500/30 rounded-full blur-md"></div>
                  <div className="relative bg-white/10 backdrop-blur-sm rounded-full p-4 border border-white/20">
                    <HeartPulse className="h-10 w-10 text-white" />
                    <Dumbbell className="h-8 w-8 text-white absolute -bottom-2 -right-2" />
                  </div>
                </div>
              </motion.div>
              
              <motion.h2 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="text-4xl md:text-5xl font-bold text-white mb-4"
              >
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-green-200">
                  MediBites <span className="text-green-300">+</span> FlexiCare
                </span>
              </motion.h2>
              
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                className="text-xl text-green-100 mb-6"
              >
                <span className="font-medium">Synergized</span>{" "}
                <motion.span 
                  className="inline-block font-bold"
                  animate={{ 
                    color: ["#ffffff", "#86efac", "#ffffff"],
                    textShadow: ["0 0 0px #fff", "0 0 10px #86efac", "0 0 0px #fff"]
                  }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  Health & Performance
                </motion.span>
              </motion.p>
              
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2 }}
                className="max-w-2xl mx-auto"
              >
                <p className="text-green-50 text-lg mb-8">
                  Our exclusive partnership delivers <span className="font-semibold text-white">integrated healthcare solutions</span> combining medical expertise with cutting-edge fitness technology.
                </p>
              </motion.div>
            </motion.div>
            <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ 
              type: "spring",
              stiffness: 100,
              damping: 10,
              delay: 1.4
            }}
            className="flex justify-center"
          >
            <a href="http://localhost:5000" target="_blank">
            <Button 
              size="lg"
              className="group relative overflow-hidden bg-white/10 hover:bg-white/20 border border-white/30 hover:border-green-300/50 text-white px-8 py-6 rounded-xl transition-all duration-300"
            >
              <span className="relative z-10 flex items-center">
                Discover Integrated Solutions
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </span>
              <motion.span 
                className="absolute inset-0 bg-gradient-to-r from-green-500/30 to-transparent"
                initial={{ x: "-100%" }}
                whileHover={{ x: "100%" }}
                transition={{ duration: 0.6 }}
              />
            </Button>
            </a>
          </motion.div>

<div className="flex gap-20 justify-center">
            <motion.div 
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="w-full lg:w-1/3 bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10"
            >
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <Check className="h-5 w-5 text-green-300" />
                <span>Key Features</span>
              </h3>
              
              <ul className="space-y-3">
                {features.map((feature, index) => (
                  <motion.li
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ 
                      opacity: currentFeature === index ? 1 : 0.7,
                      x: currentFeature === index ? 0 : -10,
                      scale: currentFeature === index ? 1.05 : 1
                    }}
                    transition={{ duration: 0.5 }}
                    className={`flex items-center gap-3 p-3 rounded-lg ${
                      currentFeature === index ? 'bg-white/10' : ''
                    }`}
                  >
                    <motion.div
                      animate={{
                        rotate: currentFeature === index ? [0, 10, -10, 0] : 0,
                        scale: currentFeature === index ? [1, 1.2, 1] : 1
                      }}
                      transition={{ duration: 0.5 }}
                      className={`p-1 rounded-full ${
                        currentFeature === index ? 'bg-green-500/20 text-green-300' : 'bg-white/5 text-white/60'
                      }`}
                    >
                      {feature.icon}
                    </motion.div>
                    <span className={`${
                      currentFeature === index ? 'text-white font-medium' : 'text-white/80'
                    }`}>
                      {feature.text}
                    </span>
                    {currentFeature === index && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="ml-auto"
                      >
                        <Check className="h-5 w-5 text-green-400" />
                      </motion.div>
                    )}
                  </motion.li>
                ))}
              </ul>
            </motion.div>
            {/* Right side - Stats */}
            <motion.div
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="w-full lg:w-1/4 bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10"
            >
              <h3 className="text-xl font-semibold text-white mb-4">Partnership Benefits</h3>
              
              <div className="space-y-4">
                <motion.div
                  whileHover={{ scale: 1.03 }}
                  className="bg-green-500/10 p-4 rounded-lg border border-green-500/20"
                >
                  <div className="text-3xl font-bold text-green-300 mb-1">100%</div>
                  <div className="text-sm text-green-100">Medical Compatibility</div>
                </motion.div>
                
                <motion.div
                  whileHover={{ scale: 1.03 }}
                  className="bg-white/5 p-4 rounded-lg border border-white/10"
                >
                  <div className="text-3xl font-bold text-white mb-1">AI</div>
                  <div className="text-sm text-green-100">Powered Workouts</div>
                </motion.div>
                
                <motion.div
                  whileHover={{ scale: 1.03 }}
                  className="bg-white/5 p-4 rounded-lg border border-white/10"
                >
                  <div className="text-3xl font-bold text-white mb-1">24/7</div>
                  <div className="text-sm text-green-100">Health Monitoring</div>
                </motion.div>
              </div>
            </motion.div>
            </div>
          </div>

          {/* CTA Button */}
         
        </div>
      </div>

      {/* Animated progress indicator */}
      <motion.div className="absolute bottom-0 left-0 right-0 h-1.5 bg-green-900/30">
        <motion.div 
          className="h-full bg-gradient-to-r from-green-400 to-green-600"
          initial={{ width: 0 }}
          animate={{ width: "100%" }}
          transition={{ duration: 5, ease: "easeInOut" }}
        />
      </motion.div>
    </motion.section>
  )
}