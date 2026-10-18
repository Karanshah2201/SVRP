import { motion, AnimatePresence } from 'framer-motion'
import { X, CreditCard, Smartphone, Building } from 'lucide-react'
import { useState } from 'react'

export default function PaymentModal({ isOpen, onClose, product }) {
    const [selectedMethod, setSelectedMethod] = useState('upi')
    const [processing, setProcessing] = useState(false)
    const [success, setSuccess] = useState(false)

    const handlePayment = () => {
        setProcessing(true)
        // Simulate payment processing
        setTimeout(() => {
            setProcessing(false)
            setSuccess(true)
            // Reset after showing success
            setTimeout(() => {
                setSuccess(false)
                onClose()
            }, 2000)
        }, 1500)
    }

    const paymentMethods = [
        { id: 'upi', name: 'UPI', icon: Smartphone, desc: 'Google Pay, PhonePe, Paytm' },
        { id: 'card', name: 'Debit / Credit Card', icon: CreditCard, desc: 'Visa, Mastercard, RuPay' },
        { id: 'netbanking', name: 'Net Banking', icon: Building, desc: 'All Indian Banks' },
    ]

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-3xl shadow-2xl z-50 overflow-hidden"
                    >
                        {success ? (
                            <div className="p-8 text-center space-y-4">
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto"
                                >
                                    <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                    </svg>
                                </motion.div>
                                <h3 className="text-2xl font-bold text-gray-900">Payment Successful!</h3>
                                <p className="text-gray-500">Your download will start shortly.</p>
                            </div>
                        ) : (
                            <>
                                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900">Select Payment Method</h3>
                                        <p className="text-sm text-gray-500">Total to pay: <span className="font-bold text-black">{(product?.price && /^\D/.test(product.price)) ? product.price : `₹${product?.price || 0}`}</span></p>
                                    </div>
                                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500">
                                        <X size={20} />
                                    </button>
                                </div>

                                <div className="p-6 space-y-4">
                                    {paymentMethods.map((method) => (
                                        <button
                                            key={method.id}
                                            onClick={() => setSelectedMethod(method.id)}
                                            className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left ${selectedMethod === method.id ? 'border-black bg-gray-50' : 'border-gray-100 hover:border-gray-200'}`}
                                        >
                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${selectedMethod === method.id ? 'bg-black text-white' : 'bg-gray-100 text-gray-600'}`}>
                                                <method.icon size={24} />
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-900">{method.name}</p>
                                                <p className="text-xs text-gray-500">{method.desc}</p>
                                            </div>
                                            <div className={`ml-auto w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedMethod === method.id ? 'border-black' : 'border-gray-300'}`}>
                                                {selectedMethod === method.id && <div className="w-2.5 h-2.5 rounded-full bg-black" />}
                                            </div>
                                        </button>
                                    ))}
                                </div>

                                <div className="p-6 border-t border-gray-100 bg-gray-50/50">
                                    <button
                                        onClick={handlePayment}
                                        disabled={processing}
                                        className="w-full py-4 bg-black text-white font-bold rounded-2xl shadow-lg hover:bg-gray-900 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        {processing ? (
                                            <>
                                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                Processing...
                                            </>
                                        ) : (
                                            'Pay ' + ((product?.price && /^\D/.test(product.price)) ? product.price : ('₹' + (product?.price || 0)))
                                        )}
                                    </button>
                                </div>
                            </>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}
