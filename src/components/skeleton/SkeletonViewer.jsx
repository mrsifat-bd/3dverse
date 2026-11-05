'use client'
// The 3D skeleton (three.js + React Three Fiber). Loaded only on the builder
// page, after the list is usable (next/dynamic, no server rendering).
// Renders on demand (no frames while nothing changes), uses the lighter model
// on phones, and releases the GPU memory when the page is left.
import { Component, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

const COLORS = {
  bone: new THREE.Color('#e7dfcf'),
  context: new THREE.Color('#d9d2c4'),
  selected: new THREE.Color('#c0603a'),
  pool: new THREE.Color('#d98f6d'),
  group: new THREE.Color('#b3532f'),
  hover: new THREE.Color('#f0b28f'),
  focus: new THREE.Color('#8a3d1f'),
}

// Camera presets (the model is 1.7 m tall, feet at y = 0, facing +z).
const TARGET = new THREE.Vector3(0, 0.88, 0)
const VIEWS = {
  front: [0, 0.95, 3.7],
  back: [0, 0.95, -3.7],
  left: [3.7, 0.95, 0], // the skeleton's left side
  right: [-3.7, 0.95, 0],
}

function loaderExt(loader) { loader.setMeshoptDecoder(MeshoptDecoder) }

function Model({ url, colorFor, pickable, onPick, onHover }) {
  const gltf = useLoader(GLTFLoader, url, loaderExt)
  const invalidate = useThree((s) => s.invalidate)
  const meshes = useMemo(() => {
    const list = []
    gltf.scene.traverse((o) => {
      if (!o.isMesh) return
      o.userData.bone = o.name.replace(/\.\d+$/, '')
      if (!o.userData.mat) {
        o.material = new THREE.MeshStandardMaterial({ color: COLORS.bone, roughness: 0.72, metalness: 0.02 })
        o.userData.mat = true
      }
      list.push(o)
    })
    return list
  }, [gltf])

  useEffect(() => {
    for (const m of meshes) {
      const c = colorFor(m.userData.bone)
      m.material.color.copy(COLORS[c] || COLORS.bone)
      m.material.emissive.copy(c === 'hover' || c === 'focus' ? COLORS[c] : new THREE.Color(0)).multiplyScalar(c === 'focus' ? 0.18 : c === 'hover' ? 0.12 : 0)
    }
    invalidate()
  }, [meshes, colorFor, invalidate])

  useEffect(() => () => {
    // Free GPU memory when the viewer goes away.
    for (const m of meshes) { m.geometry?.dispose(); m.material?.dispose() }
    useLoader.clear(GLTFLoader, url)
  }, [meshes, url])

  return (
    <primitive
      object={gltf.scene}
      onPointerMove={(e) => { const b = e.object.userData.bone; if (pickable(b)) { e.stopPropagation(); onHover(b, e) } }}
      onPointerOut={() => onHover(null)}
      onClick={(e) => {
        if (e.delta > 6) return // it was a drag, not a tap
        const b = e.object.userData.bone
        if (!pickable(b)) return
        e.stopPropagation(); onPick(b)
      }}
    />
  )
}

function Controls({ view, viewNonce, reducedMotion, zoomNonce }) {
  const { camera, gl, invalidate } = useThree()
  const ctl = useRef(null)
  const goal = useRef(null)
  useEffect(() => {
    const c = new OrbitControls(camera, gl.domElement)
    c.target.copy(TARGET); c.enableDamping = !reducedMotion; c.dampingFactor = 0.12
    c.minDistance = 0.35; c.maxDistance = 6; c.zoomSpeed = 0.9; c.rotateSpeed = 0.8
    c.addEventListener('change', () => invalidate())
    c.update(); ctl.current = c
    return () => c.dispose()
  }, [camera, gl, invalidate, reducedMotion])
  useEffect(() => {
    const pos = VIEWS[view] || VIEWS.front
    goal.current = { pos: new THREE.Vector3(...pos), target: TARGET.clone() }
    if (reducedMotion && ctl.current) { camera.position.copy(goal.current.pos); ctl.current.target.copy(goal.current.target); goal.current = null; ctl.current.update() }
    invalidate()
  }, [view, viewNonce, reducedMotion, camera, invalidate])
  useEffect(() => {
    if (!zoomNonce || !ctl.current) return
    const dir = camera.position.clone().sub(ctl.current.target)
    const f = zoomNonce.dir > 0 ? 0.8 : 1.25
    const len = Math.min(6, Math.max(0.35, dir.length() * f))
    camera.position.copy(ctl.current.target.clone().add(dir.setLength(len)))
    ctl.current.update(); invalidate()
  }, [zoomNonce, camera, invalidate])
  useFrame(() => {
    const c = ctl.current
    if (!c) return
    if (goal.current) {
      camera.position.lerp(goal.current.pos, 0.14)
      c.target.lerp(goal.current.target, 0.14)
      if (camera.position.distanceTo(goal.current.pos) < 0.005) goal.current = null
      invalidate()
    }
    if (c.update()) invalidate()
  })
  return null
}

class Boundary extends Component {
  constructor(p) { super(p); this.state = { failed: false } }
  static getDerivedStateFromError() { return { failed: true } }
  componentDidCatch() { this.props.onError?.() }
  render() { return this.state.failed ? null : this.props.children }
}

function hasWebGL() {
  try {
    const c = document.createElement('canvas')
    return Boolean(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')))
  } catch { return false }
}

export default function SkeletonViewer({ colorFor, pickable, onPick, labelFor, view, viewNonce, zoomNonce, t, onReady }) {
  const [state, setState] = useState('init') // init | nowebgl | ready | failed
  const [hover, setHover] = useState(null)
  const [hoverPos, setHoverPos] = useState(null)
  const wrap = useRef(null)
  const [url, setUrl] = useState(null)
  const reducedMotion = useMemo(() => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches, [])

  useEffect(() => {
    if (!hasWebGL()) { setState('nowebgl'); return }
    const small = window.matchMedia('(max-width: 767px)').matches || (navigator.deviceMemory && navigator.deviceMemory <= 4)
    setUrl(small ? '/models/skeleton-lo.glb' : '/models/skeleton-hi.glb')
  }, [])

  const colorWithHover = useMemo(() => (b) => (hover && b === hover && colorFor(b) === 'bone' ? 'hover' : colorFor(b)), [hover, colorFor])

  if (state === 'nowebgl' || state === 'failed') {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
        <img src="/models/skeleton-front.webp" alt="" className="max-h-[70%] w-auto opacity-80" />
        <p className="max-w-xs text-sm text-stone" role="status">{state === 'nowebgl' ? t('builder.noWebgl') : t('builder.failed3d')}</p>
        {state === 'failed' && <button type="button" className="btn-ghost text-sm" onClick={() => setState('init')}>{t('builder.retry')}</button>}
      </div>
    )
  }

  return (
    <div ref={wrap} className="relative h-full w-full" onPointerLeave={() => { setHover(null); setHoverPos(null) }}>
      {url && (
        <Boundary onError={() => setState('failed')}>
          <Canvas
            frameloop="demand"
            dpr={[1, 1.75]}
            camera={{ fov: 30, position: VIEWS.front, near: 0.05, far: 30 }}
            gl={{ antialias: true, powerPreference: 'high-performance', alpha: true }}
            onCreated={({ gl }) => { gl.setClearColor(0x000000, 0); gl.outputColorSpace = THREE.SRGBColorSpace }}
            aria-label={t('builder.viewerLabel')}
            role="img"
            style={{ touchAction: 'none' }}
          >
            <hemisphereLight args={['#ffffff', '#8a7b66', 1.15]} />
            <directionalLight position={[1.5, 3, 4]} intensity={1.7} />
            <directionalLight position={[-2, 1.5, -3]} intensity={0.55} />
            <Suspense fallback={null}>
              <Model url={url} colorFor={colorWithHover} pickable={pickable}
                onPick={(b) => onPick(b)}
                onHover={(b, e) => {
                  setHover(b)
                  if (b && e && wrap.current) { const r = wrap.current.getBoundingClientRect(); setHoverPos({ x: e.clientX - r.left, y: e.clientY - r.top }) } else setHoverPos(null)
                }} />
              <Ready onReady={() => { setState('ready'); onReady?.() }} />
            </Suspense>
            <Controls view={view} viewNonce={viewNonce} zoomNonce={zoomNonce} reducedMotion={reducedMotion} />
          </Canvas>
        </Boundary>
      )}
      {state !== 'ready' && (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-3" role="status">
          <img src="/models/skeleton-front.webp" alt="" className="max-h-[72%] w-auto animate-pulse opacity-40" />
          <span className="text-sm text-stone">{t('builder.loading3d')}</span>
        </div>
      )}
      {hover && hoverPos && (
        <div className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-lg border border-line bg-paper/95 px-2.5 py-1 text-xs font-medium text-ink shadow-md"
          style={{ left: hoverPos.x, top: hoverPos.y - 10 }}>
          {labelFor(hover)}
        </div>
      )}
    </div>
  )
}

function Ready({ onReady }) {
  const done = useRef(false)
  useEffect(() => { if (!done.current) { done.current = true; onReady() } })
  return null
}
