import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'

export function MaskText({ children, className }) {
    const body = useRef(null)
    const isInView = useInView(body, { once: true, margin: "-10%" })

    const animation = {
        initial: { y: "100%" },
        enter: (i) => ({ y: "0", transition: { duration: 0.75, ease: [0.33, 1, 0.68, 1], delay: 0.075 * i } })
    }

    return (
        <div ref={body} className={`overflow-hidden ${className}`}>
            <motion.div variants={animation} initial="initial" animate={isInView ? "enter" : ""} custom={0} className="m-0">
                {children}
            </motion.div>
        </div>
    )
}

export function SplitText({ phrase, className }) {
    const body = useRef(null)
    const isInView = useInView(body, { once: true, margin: "-10%" })

    const animation = {
        initial: { y: "100%" },
        enter: (i) => ({ y: "0", transition: { duration: 0.75, ease: [0.33, 1, 0.68, 1], delay: 0.075 * i } })
    }

    return (
        <div ref={body} className={`flex flex-wrap overflow-hidden leading-tight ${className}`}>
            {phrase.split(" ").map((word, index) => (
                <div key={index} className="overflow-hidden mr-[0.25em] inline-flex">
                    <motion.span variants={animation} initial="initial" animate={isInView ? "enter" : ""} custom={index}>
                        {word}
                    </motion.span>
                </div>
            ))}
        </div>
    )
}
