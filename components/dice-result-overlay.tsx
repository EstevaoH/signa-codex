"use client"

import React, { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import confetti from "canvas-confetti"

interface DiceResultProps {
    result: number
    isCritical: boolean
    isFumble: boolean
    onClose: () => void
}

export function DiceResultOverlay({ result, isCritical, isFumble, onClose }: DiceResultProps) {
    useEffect(() => {
        if (isCritical) {
            // Explosão de confetes dourados para o 20 natural
            confetti({
                particleCount: 150,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#f59e0b', '#fbbf24', '#ffffff']
            })
        }

        // Auto-fechar após 3 segundos
        const timer = setTimeout(onClose, 3000)
        return () => clearTimeout(timer)
    }, [isCritical, onClose])

    return (
        <AnimatePresence>
            <div className="fixed inset-0 flex items-center justify-center z-[100] pointer-events-none">
                <motion.div
                    initial={{ scale: 0, rotate: -20, opacity: 0 }}
                    animate={{ scale: 1, rotate: 0, opacity: 1 }}
                    exit={{ scale: 1.5, opacity: 0, filter: "blur(10px)" }}
                    transition={{ type: "spring", damping: 12, stiffness: 200 }}
                    className="relative"
                >
                    {/* Brilho de fundo (Glow) */}
                    <div className={`absolute inset-0 blur-3xl opacity-50 rounded-full 
            ${isCritical ? 'bg-amber-500 animate-pulse' : isFumble ? 'bg-red-600' : 'bg-blue-500'}`}
                    />

                    <div className={`
            relative px-12 py-8 rounded-2xl border-4 shadow-2xl
            flex flex-col items-center justify-center backdrop-blur-md
            ${isCritical ? 'bg-slate-900/90 border-amber-500 shadow-amber-500/50' :
                            isFumble ? 'bg-slate-900/90 border-red-600 shadow-red-900/50' :
                                'bg-slate-900/90 border-slate-700 shadow-black/50'}
          `}>
                        <span className="text-xs uppercase tracking-[0.3em] font-bold text-slate-400 mb-2">
                            {isCritical ? "✨ Sucesso Crítico ✨" : isFumble ? "💀 Falha Crítica 💀" : "Resultado"}
                        </span>

                        <motion.span
                            initial={{ y: 20 }}
                            animate={{ y: 0 }}
                            className={`text-8xl font-black italic italic font-serif
                ${isCritical ? 'text-amber-500' : isFumble ? 'text-red-600' : 'text-white'}
              `}
                        >
                            {result}
                        </motion.span>

                        {isCritical && (
                            <motion.div
                                animate={{ opacity: [0, 1, 0] }}
                                transition={{ repeat: Infinity, duration: 1 }}
                                className="absolute -top-4 -right-4 bg-amber-500 text-slate-900 text-xs font-bold px-2 py-1 rounded-full shadow-lg"
                            >
                                NATURAL 20
                            </motion.div>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    )
}