import { motion, useScroll, useTransform } from 'framer-motion'
import { useRef } from 'react'

export default function StackingSection({ children, className = "", id = "" }) {
    const ref = useRef(null)
    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ["start end", "end start"]
    })

    // Optional: Add a subtle parallax or scale effect to the content inside
    // As the section goes out of view (covered by next one), it scales down slightly
    const _scale = useTransform(scrollYProgress, [0, 1], [1, 0.9])
    const _opacity = useTransform(scrollYProgress, [0, 1], [1, 0.5])

    return (
        <div
            ref={ref}
            className={`sticky top-0 min-h-screen flex flex-col justify-center overflow-hidden ${className}`}
            id={id}
        >
            <motion.div
                className="w-full h-full flex flex-col justify-center"
            // Uncomment these lines to enable the "exiting" animation effect
            // style={{ scale, opacity }} 
            >
                {children}
            </motion.div>
        </div>
    )
}
