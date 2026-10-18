import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, useFBX, useGLTF, Center, Bounds } from '@react-three/drei'

function FBXModel({ url }) {
    const object = useFBX(url)
    return <primitive object={object} />
}

function GLTFModel({ url }) {
    const { scene } = useGLTF(url)
    return <primitive object={scene} />
}

function Model({ url }) {
    const isFbx = url.toLowerCase().endsWith('.fbx')
    return isFbx ? <FBXModel url={url} /> : <GLTFModel url={url} />
}

export default function ModelViewer({ modelUrl }) {
    return (
        <div className="w-full h-full min-h-[400px] bg-slate-100/50 rounded-xl overflow-hidden cursor-grab active:cursor-grabbing relative">
            <Canvas
                shadows
                dpr={[1, 2]}
                camera={{ fov: 35, near: 0.01, far: 10000, position: [10, 5, 10] }}
            >
                <Suspense fallback={null}>
                    <ambientLight intensity={0.7} />
                    <directionalLight position={[10, 15, 10]} intensity={1.2} castShadow />
                    <directionalLight position={[-10, 10, -5]} intensity={0.5} />
                    <hemisphereLight intensity={0.4} groundColor="#aaa" />

                    <Bounds fit clip observe margin={1.4}>
                        <Center>
                            <Model url={modelUrl} />
                        </Center>
                    </Bounds>
                </Suspense>

                <OrbitControls
                    autoRotate
                    autoRotateSpeed={1}
                    enableZoom={true}
                    enablePan={true}
                    makeDefault
                />
                <gridHelper args={[50, 50, '#ddd', '#eee']} position={[0, -0.01, 0]} />
            </Canvas>

            <div className="absolute bottom-4 right-4 bg-white/80 backdrop-blur px-3 py-1 rounded-full text-xs font-bold text-gray-500 pointer-events-none">
                3D Viewer • Drag to rotate
            </div>
        </div>
    )
}
