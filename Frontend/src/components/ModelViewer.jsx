import React, { useState, useRef, useEffect, useMemo } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, Center, ContactShadows } from '@react-three/drei'
import * as THREE from 'three'
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { 
    Eye, RotateCw, ZoomIn, ZoomOut, RefreshCw, 
    Maximize2, Minimize2, Layers, 
    ShieldAlert, Loader2, Info
} from 'lucide-react'

// Multi-source URL resolver that returns candidate URLs in order of preference:
// 1. Static CDN bundle (/filename.fbx)
// 2. Backend persistent uploads (${backendOrigin}/uploads/filename.fbx)
// 3. Fallback bundled models
export function getModelCandidateUrls(url) {
    if (!url) return []

    const backendOrigin = (
        import.meta.env.VITE_API_URL ||
        (import.meta.env.PROD ? 'https://svrp-1.onrender.com/api' : 'http://localhost:5000/api')
    ).replace(/\/api\/?$/, '')

    const candidates = []
    const cleanFilename = url.split('/').pop().split('?')[0]

    // Priority 1: Direct static asset in frontend public/dist folder (zero backend latency, CDN cached)
    if (cleanFilename) {
        candidates.push(`/${cleanFilename}`)
    }

    // Priority 2: Backend uploads path (restored from seed-models on startup)
    if (cleanFilename) {
        candidates.push(`${backendOrigin}/uploads/${cleanFilename}`)
    }

    // Priority 3: If original was a full URL
    if (url.startsWith('http://') || url.startsWith('https://')) {
        candidates.push(url)
    }

    // Priority 4: Built-in reliable static fallbacks already committed in public folder
    candidates.push('/1769959233_wap4.fbx')
    candidates.push('/1769954393_ICFMeasurement.fbx')
    candidates.push(`${backendOrigin}/uploads/1769954393_ICFMeasurement.fbx`)

    return [...new Set(candidates.filter(Boolean))]
}

// Procedural 3D Locomotive Mesh: 100% offline, zero network requests, always renders reliably
function ProceduralLocomotive({ wireframe }) {
    const groupRef = useRef()

    useFrame((_, delta) => {
        if (groupRef.current) {
            groupRef.current.position.y = Math.sin(Date.now() * 0.002) * 0.015
        }
    })

    const bodyMat = wireframe ? (
        <meshStandardMaterial wireframe color="#38bdf8" emissive="#0284c7" emissiveIntensity={0.3} />
    ) : (
        <meshStandardMaterial color="#1e293b" roughness={0.35} metalness={0.8} />
    )

    const accentMat = wireframe ? (
        <meshStandardMaterial wireframe color="#f59e0b" emissive="#d97706" emissiveIntensity={0.4} />
    ) : (
        <meshStandardMaterial color="#b45309" roughness={0.4} metalness={0.7} />
    )

    const wheelMat = wireframe ? (
        <meshStandardMaterial wireframe color="#94a3b8" />
    ) : (
        <meshStandardMaterial color="#0f172a" roughness={0.25} metalness={0.9} />
    )

    return (
        <group ref={groupRef} position={[0, 0, 0]}>
            {/* Main Locomotive Boiler Cylinder */}
            <mesh position={[0, 1.25, 0.4]} rotation={[Math.PI / 2, 0, 0]} castShadow receiveShadow>
                <cylinderGeometry args={[0.75, 0.75, 3.6, 32]} />
                {bodyMat}
            </mesh>

            {/* Locomotive Driver Cabin */}
            <mesh position={[0, 1.6, -1.8]} castShadow receiveShadow>
                <boxGeometry args={[1.9, 1.8, 1.6]} />
                {bodyMat}
            </mesh>

            {/* Cabin Roof Overhang */}
            <mesh position={[0, 2.55, -1.8]} castShadow receiveShadow>
                <boxGeometry args={[2.05, 0.12, 1.75]} />
                {accentMat}
            </mesh>

            {/* Smokestack Chimney */}
            <mesh position={[0, 2.3, 1.4]} castShadow receiveShadow>
                <cylinderGeometry args={[0.22, 0.28, 0.8, 20]} />
                {accentMat}
            </mesh>

            {/* Steam Dome */}
            <mesh position={[0, 2.1, 0.2]} castShadow receiveShadow>
                <sphereGeometry args={[0.35, 16, 16]} />
                {accentMat}
            </mesh>

            {/* Front Headlight Housing */}
            <mesh position={[0, 1.65, 2.25]} rotation={[Math.PI / 2, 0, 0]} castShadow>
                <cylinderGeometry args={[0.24, 0.28, 0.35, 16]} />
                {accentMat}
            </mesh>

            {/* Headlight Glowing Lens */}
            <mesh position={[0, 1.65, 2.43]}>
                <circleGeometry args={[0.21, 16]} />
                <meshBasicMaterial color="#fef08a" />
            </mesh>

            {/* Pointlight emitting from Headlight */}
            <pointLight position={[0, 1.65, 3.0]} intensity={2.5} distance={15} color="#fef08a" />

            {/* Heavy Chassis / Bed Frame */}
            <mesh position={[0, 0.52, 0]} castShadow receiveShadow>
                <boxGeometry args={[1.9, 0.3, 5.4]} />
                {bodyMat}
            </mesh>

            {/* Front Cowcatcher / Buffer Wedge */}
            <mesh position={[0, 0.42, 2.75]} rotation={[0.4, 0, 0]} castShadow receiveShadow>
                <boxGeometry args={[1.85, 0.45, 0.3]} />
                {accentMat}
            </mesh>

            {/* 6 Locomotive Drive Wheels (3 pairs) */}
            {[-1.2, 0.1, 1.4].map((z, idx) => (
                <group key={idx}>
                    <mesh position={[-0.98, 0.52, z]} rotation={[0, 0, Math.PI / 2]} castShadow>
                        <cylinderGeometry args={[0.52, 0.52, 0.15, 24]} />
                        {wheelMat}
                    </mesh>
                    <mesh position={[0.98, 0.52, z]} rotation={[0, 0, Math.PI / 2]} castShadow>
                        <cylinderGeometry args={[0.52, 0.52, 0.15, 24]} />
                        {wheelMat}
                    </mesh>
                    <mesh position={[0, 0.52, z]} rotation={[0, 0, Math.PI / 2]}>
                        <cylinderGeometry args={[0.08, 0.08, 2.0, 12]} />
                        {bodyMat}
                    </mesh>
                </group>
            ))}

            {/* Railway Tracks / Rails */}
            <mesh position={[-0.98, 0.02, 0]}>
                <boxGeometry args={[0.08, 0.08, 8]} />
                <meshStandardMaterial color="#64748b" metalness={0.9} roughness={0.2} />
            </mesh>
            <mesh position={[0.98, 0.02, 0]}>
                <boxGeometry args={[0.08, 0.08, 8]} />
                <meshStandardMaterial color="#64748b" metalness={0.9} roughness={0.2} />
            </mesh>
        </group>
    )
}

// Camera Rig that smoothly animates camera between views
function CameraRig({ viewMode, isTransitioning, setIsTransitioning, controlsRef }) {
    const { camera } = useThree()
    const targetPos = useRef(new THREE.Vector3(0, 1.2, 5.5))
    const targetLook = useRef(new THREE.Vector3(0, 1.0, 0))

    useEffect(() => {
        if (viewMode === 'first-person') {
            targetPos.current.set(0, 1.2, 5.2)
            targetLook.current.set(0, 1.0, 0)
        } else if (viewMode === 'side') {
            targetPos.current.set(8.5, 1.2, 0)
            targetLook.current.set(0, 1.0, 0)
        } else if (viewMode === 'driver') {
            targetPos.current.set(0, 1.6, 2.2)
            targetLook.current.set(0, 1.5, -3)
        } else if (viewMode === 'orbit') {
            targetPos.current.set(5.5, 3.2, 5.5)
            targetLook.current.set(0, 0.8, 0)
        }
        setIsTransitioning(true)
    }, [viewMode, setIsTransitioning])

    useFrame((_, delta) => {
        if (!isTransitioning || !controlsRef.current) return
        
        const step = Math.min(1, delta * 4.2)
        camera.position.lerp(targetPos.current, step)
        controlsRef.current.target.lerp(targetLook.current, step)
        controlsRef.current.update()

        if (camera.position.distanceTo(targetPos.current) < 0.05) {
            setIsTransitioning(false)
        }
    })

    return null
}

export default function ModelViewer({ modelUrl }) {
    const candidates = useMemo(() => getModelCandidateUrls(modelUrl), [modelUrl])
    const [model, setModel] = useState(null)
    const [isLoading, setIsLoading] = useState(true)
    const [loadError, setLoadError] = useState(null)
    const [viewMode, setViewMode] = useState('first-person')
    const [autoRotate, setAutoRotate] = useState(false)
    const [wireframe, setWireframe] = useState(false)
    const [isFullscreen, setIsFullscreen] = useState(false)
    const [isTransitioning, setIsTransitioning] = useState(false)
    const containerRef = useRef(null)
    const controlsRef = useRef(null)

    // Safe, multi-candidate model loader that tries local CDN, backend uploads, and bundled assets
    useEffect(() => {
        if (!candidates || candidates.length === 0) {
            setIsLoading(false)
            setLoadError('No model URL provided')
            return
        }

        let isMounted = true
        setIsLoading(true)
        setLoadError(null)
        setModel(null)

        const loadModelFromCandidates = async () => {
            for (const targetUrl of candidates) {
                if (!isMounted) return

                try {
                    const res = await fetch(targetUrl)
                    if (!res.ok) {
                        throw new Error(`HTTP ${res.status}`)
                    }

                    // Check that the server did not return an HTML SPA fallback document
                    const contentType = res.headers.get('content-type') || ''
                    if (contentType.includes('text/html')) {
                        throw new Error('Received HTML fallback instead of 3D binary')
                    }

                    const arrayBuffer = await res.arrayBuffer()
                    const isFbx = targetUrl.toLowerCase().includes('.fbx')

                    if (isFbx) {
                        const headerStr = String.fromCharCode(...new Uint8Array(arrayBuffer.slice(0, 20)))
                        const isBinaryFbx = headerStr.startsWith('Kaydara FBX Binary')
                        const isAsciiFbx = !isBinaryFbx && new TextDecoder().decode(arrayBuffer.slice(0, 1000)).includes('FBXVersion:')

                        if (!isBinaryFbx && !isAsciiFbx) {
                            throw new Error('File does not have valid FBX magic bytes')
                        }

                        const loader = new FBXLoader()
                        const parsedObj = loader.parse(arrayBuffer, '')
                        if (isMounted) {
                            setModel(parsedObj)
                            setIsLoading(false)
                            setLoadError(null)
                            return
                        }
                    } else {
                        // GLTF / GLB validation
                        const magic = new Uint32Array(arrayBuffer.slice(0, 4))[0]
                        const isGlb = magic === 0x46546C67 // 'glTF'
                        const isGltfJson = !isGlb && new TextDecoder().decode(arrayBuffer.slice(0, 200)).includes('"asset"')

                        if (!isGlb && !isGltfJson) {
                            throw new Error('File does not have valid GLTF/GLB magic bytes')
                        }

                        const loader = new GLTFLoader()
                        await new Promise((resolve, reject) => {
                            loader.parse(
                                arrayBuffer,
                                '',
                                (gltf) => {
                                    if (isMounted) {
                                        setModel(gltf.scene)
                                        setIsLoading(false)
                                        setLoadError(null)
                                        resolve()
                                    }
                                },
                                (err) => reject(err)
                            )
                        })
                        return
                    }
                } catch (err) {
                    console.warn(`[ModelViewer] Candidate ${targetUrl} unavailable (${err.message}). Trying next source...`)
                }
            }

            if (isMounted) {
                console.warn('[ModelViewer] All remote 3D models offline or unparseable. Displaying procedural locomotive blueprint.')
                setLoadError('Asset offline — Interactive locomotive blueprint active')
                setIsLoading(false)
            }
        }

        loadModelFromCandidates()

        return () => {
            isMounted = false
        }
    }, [candidates])

    // Apply wireframe toggle dynamically across loaded mesh materials
    useEffect(() => {
        if (!model) return
        model.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true
                child.receiveShadow = true
                if (child.material) {
                    if (Array.isArray(child.material)) {
                        child.material.forEach(m => {
                            m.wireframe = wireframe
                            m.side = THREE.DoubleSide
                            m.needsUpdate = true
                        })
                    } else {
                        child.material.wireframe = wireframe
                        child.material.side = THREE.DoubleSide
                        child.material.needsUpdate = true
                    }
                }
            }
        })
    }, [model, wireframe])

    const handleResetView = () => {
        setViewMode('first-person')
        setIsTransitioning(true)
    }

    const handleZoom = (direction) => {
        if (!controlsRef.current) return
        const factor = direction === 'in' ? 0.8 : 1.25
        controlsRef.current.object.position.multiplyScalar(factor)
        controlsRef.current.update()
    }

    const toggleFullscreen = () => {
        setIsFullscreen(prev => !prev)
    }

    return (
        <div 
            ref={containerRef}
            className={`w-full overflow-hidden relative select-none transition-all duration-300 ${
                isFullscreen 
                    ? 'fixed inset-0 z-[100] w-screen h-screen bg-slate-950' 
                    : 'h-full min-h-[460px] bg-gradient-to-b from-slate-900 via-slate-900/95 to-slate-950 rounded-2xl border border-slate-800 shadow-2xl'
            }`}
        >
            {/* Top View Selector Bar */}
            <div className="absolute top-3 left-3 right-3 z-20 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
                <div className="pointer-events-auto bg-slate-900/80 backdrop-blur-md border border-slate-700/60 p-1 rounded-xl shadow-lg flex items-center gap-1">
                    <button
                        onClick={() => setViewMode('first-person')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                            viewMode === 'first-person'
                                ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                                : 'text-slate-300 hover:text-white hover:bg-slate-800'
                        }`}
                        title="First-Person Front View"
                    >
                        <Eye size={14} className={viewMode === 'first-person' ? 'stroke-[2.5]' : ''} />
                        <span>First Person</span>
                    </button>

                    <button
                        onClick={() => setViewMode('side')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                            viewMode === 'side'
                                ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                                : 'text-slate-300 hover:text-white hover:bg-slate-800'
                        }`}
                        title="Side Elevation View"
                    >
                        <span>Side View</span>
                    </button>

                    <button
                        onClick={() => setViewMode('driver')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                            viewMode === 'driver'
                                ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                                : 'text-slate-300 hover:text-white hover:bg-slate-800'
                        }`}
                        title="Driver Cab Inspection"
                    >
                        <span>Cab View</span>
                    </button>

                    <button
                        onClick={() => setViewMode('orbit')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                            viewMode === 'orbit'
                                ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                                : 'text-slate-300 hover:text-white hover:bg-slate-800'
                        }`}
                        title="Free 360 Orbit"
                    >
                        <span>360 Orbit</span>
                    </button>
                </div>

                {/* Right Tools (Fullscreen) */}
                <div className="pointer-events-auto bg-slate-900/80 backdrop-blur-md border border-slate-700/60 p-1 rounded-xl shadow-lg flex items-center gap-1">
                    <button
                        onClick={toggleFullscreen}
                        className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                        title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen 3D Viewer'}
                    >
                        {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                    </button>
                </div>
            </div>

            {/* Graceful Fallback Notice if remote 3D file was unavailable */}
            {loadError && (
                <div className="absolute top-16 left-3 right-3 sm:right-auto z-20 bg-amber-950/90 backdrop-blur-md border border-amber-500/50 p-2.5 rounded-xl shadow-2xl flex items-center gap-3 text-amber-100 text-xs pointer-events-auto">
                    <ShieldAlert size={18} className="text-amber-400 shrink-0" />
                    <div>
                        <p className="font-bold text-[11px] text-amber-300">Preview Asset Offline</p>
                        <p className="text-[10px] text-amber-200/80">Displaying interactive procedural locomotive blueprint</p>
                    </div>
                    <button
                        onClick={() => setLoadError(null)}
                        className="ml-auto px-2 py-1 bg-amber-500/20 hover:bg-amber-500/40 rounded text-[10px] font-bold text-amber-300 border border-amber-500/30 transition-colors"
                    >
                        Dismiss
                    </button>
                </div>
            )}

            {/* Loading Indicator Overlay */}
            {isLoading && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-950/70 backdrop-blur-xs gap-3">
                    <Loader2 size={32} className="animate-spin text-amber-500" />
                    <span className="text-xs font-bold text-slate-300 uppercase tracking-widest font-mono">Loading 3D Mesh...</span>
                </div>
            )}

            {/* 3D Canvas */}
            <Canvas
                shadows
                dpr={[1, 2]}
                camera={{ fov: 42, near: 0.05, far: 5000, position: [0, 1.2, 5.2] }}
                gl={{ antialias: true, alpha: false, preserveDrawingBuffer: true }}
                className="w-full h-full cursor-grab active:cursor-grabbing"
            >
                <color attach="background" args={['#0b1120']} />

                {/* Studio 3-Point Lighting */}
                <ambientLight intensity={0.9} />
                <directionalLight position={[12, 18, 10]} intensity={1.5} castShadow shadow-mapSize={1024} />
                <directionalLight position={[-12, 10, -8]} intensity={0.8} />
                <directionalLight position={[0, -5, 10]} intensity={0.4} />
                <hemisphereLight intensity={0.6} groundColor="#1e293b" color="#cbd5e1" />

                {/* Render either the verified loaded model OR the procedural 3D locomotive */}
                <Center top position={[0, 0, 0]}>
                    {model ? (
                        <primitive object={model} />
                    ) : (
                        <ProceduralLocomotive wireframe={wireframe} />
                    )}
                </Center>

                {/* Realistic Ground Contact Shadow */}
                <ContactShadows 
                    position={[0, 0, 0]} 
                    opacity={0.7} 
                    scale={35} 
                    blur={1.8} 
                    far={10} 
                    resolution={512} 
                    color="#000000" 
                />

                <CameraRig 
                    viewMode={viewMode} 
                    isTransitioning={isTransitioning}
                    setIsTransitioning={setIsTransitioning}
                    controlsRef={controlsRef}
                />

                <OrbitControls
                    ref={controlsRef}
                    autoRotate={autoRotate}
                    autoRotateSpeed={1.2}
                    enableZoom={true}
                    enablePan={true}
                    minDistance={0.5}
                    maxDistance={40}
                    maxPolarAngle={Math.PI / 2 + 0.05}
                    makeDefault
                />

                <gridHelper args={[60, 60, '#334155', '#1e293b']} position={[0, -0.005, 0]} />
            </Canvas>

            {/* Bottom Quick Controls & Indicator */}
            <div className="absolute bottom-3 left-3 right-3 z-20 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
                <div className="pointer-events-auto bg-slate-900/85 backdrop-blur-md border border-slate-700/60 px-3 py-1.5 rounded-full flex items-center gap-2 shadow-lg">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[11px] font-bold text-slate-200">
                        {viewMode === 'first-person' && 'First-Person Mode • Eye-Level Front View'}
                        {viewMode === 'driver' && 'Cab Mode • Driver Perspective'}
                        {viewMode === 'side' && 'Elevation Mode • Full Side Profile'}
                        {viewMode === 'orbit' && 'Orbit Mode • Drag to rotate freely'}
                    </span>
                </div>

                <div className="pointer-events-auto bg-slate-900/85 backdrop-blur-md border border-slate-700/60 p-1 rounded-xl shadow-lg flex items-center gap-1 text-slate-300">
                    <button
                        onClick={() => handleZoom('in')}
                        className="p-1.5 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                        title="Zoom In"
                    >
                        <ZoomIn size={15} />
                    </button>
                    <button
                        onClick={() => handleZoom('out')}
                        className="p-1.5 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                        title="Zoom Out"
                    >
                        <ZoomOut size={15} />
                    </button>
                    <div className="w-[1px] h-4 bg-slate-700/80 mx-0.5" />
                    <button
                        onClick={() => setAutoRotate(prev => !prev)}
                        className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 ${
                            autoRotate ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'hover:text-white hover:bg-slate-800'
                        }`}
                        title="Toggle Auto-Rotation"
                    >
                        <RotateCw size={13} className={autoRotate ? 'animate-spin' : ''} />
                        <span>Auto-Spin</span>
                    </button>
                    <button
                        onClick={() => setWireframe(prev => !prev)}
                        className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 ${
                            wireframe ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'hover:text-white hover:bg-slate-800'
                        }`}
                        title="Toggle Wireframe Blueprint"
                    >
                        <Layers size={13} />
                        <span className="hidden sm:inline">Wireframe</span>
                    </button>
                    <button
                        onClick={handleResetView}
                        className="p-1.5 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                        title="Reset to First-Person View"
                    >
                        <RefreshCw size={14} />
                    </button>
                </div>
            </div>
        </div>
    )
}
