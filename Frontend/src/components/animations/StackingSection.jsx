import React from 'react'

/**
 * Standardized Section Container
 * Replaces fragile sticky stacking that caused overlapping footers and content clipping.
 * Provides clean, responsive vertical rhythm and full-width layout stability.
 */
export default function StackingSection({ children, className = "", id = "" }) {
    return (
        <section
            id={id}
            className={`relative min-h-[70vh] flex flex-col justify-center py-20 sm:py-28 ${className}`}
        >
            <div className="w-full h-full flex flex-col justify-center">
                {children}
            </div>
        </section>
    )
}
