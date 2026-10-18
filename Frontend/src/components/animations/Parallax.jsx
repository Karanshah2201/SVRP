import { useRef } from 'react'
import { motion, useScroll, useTransform, useMotionValue, useAnimationFrame } from 'framer-motion'

function wrap(min, max, v) {
    const rangeSize = max - min
    return ((((v - min) % rangeSize) + rangeSize) % rangeSize) + min
}

export function ParallaxImage({ src, alt, className }) {
    const container = useRef(null)
    const { scrollYProgress } = useScroll({
        target: container,
        offset: ["start end", "end start"]
    })

    const y = useTransform(scrollYProgress, [0, 1], ["0%", "-20%"])

    return (
        <div ref={container} className={`overflow-hidden relative h-full w-full ${className}`}>
            <motion.div style={{ y }} className="relative w-full h-[120%]">
                <img src={src} alt={alt} className="object-cover w-full h-full" />
            </motion.div>
        </div>
    )
}

export function ParallaxText({ children, baseVelocity = 100 }) {
    const baseX = useMotionValue(0)
    const x = useTransform(baseX, (v) => `${wrap(-20, -45, v)}%`)

    const directionFactor = useRef(1)
    useAnimationFrame((t, delta) => {
        directionFactor.current = baseVelocity > 0 ? 1 : -1
        const moveBy = directionFactor.current * Math.abs(baseVelocity) * (delta / 1000)
        baseX.set(baseX.get() + moveBy)
    })

    return (
        <motion.div className="parallax">
            <motion.div style={{ x }}>
                {children}
            </motion.div>
        </motion.div>
    )
}

// Simpler Parallax for elements
export function ParallaxElement({ children, speed = 0.5 }) {
    const ref = useRef(null)
    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ["start end", "end start"]
    })

    const y = useTransform(scrollYProgress, [0, 1], ["0%", `${speed * 100}%`])

    return (
        <motion.div ref={ref} style={{ y }}>
            {children}
        </motion.div>
    )
}
