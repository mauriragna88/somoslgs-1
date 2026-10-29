'use client'

import { useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const COUNT = 180

const vertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uPixelRatio;
  attribute float aSeed;
  attribute float aSize;
  varying float vTwinkle;
  void main() {
    vec3 p = position;
    p.y += mod(uTime * (0.05 + aSeed * 0.08) + aSeed * 10.0, 7.0) - 3.5;
    p.x += sin(uTime * 0.3 + aSeed * 40.0) * 0.18;
    vTwinkle = 0.45 + 0.55 * sin(uTime * (0.8 + aSeed * 1.6) + aSeed * 60.0);
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_PointSize = aSize * uPixelRatio * (9.0 / -mv.z);
    gl_Position = projectionMatrix * mv;
  }
`

const fragmentShader = /* glsl */ `
  varying float vTwinkle;
  void main() {
    float d = distance(gl_PointCoord, vec2(0.5));
    float glow = smoothstep(0.5, 0.0, d);
    vec3 gold = vec3(1.0, 0.72, 0.30);
    gl_FragColor = vec4(gold, glow * glow * vTwinkle * 0.9);
  }
`

function Embers({ pointer }: { pointer: React.MutableRefObject<{ x: number; y: number }> }) {
  const group = useRef<THREE.Group>(null)
  const material = useRef<THREE.ShaderMaterial>(null)

  const geometry = useMemo(() => {
    const positions = new Float32Array(COUNT * 3)
    const seeds = new Float32Array(COUNT)
    const sizes = new Float32Array(COUNT)
    for (let i = 0; i < COUNT; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 12
      positions[i * 3 + 1] = (Math.random() - 0.5) * 7
      positions[i * 3 + 2] = -Math.random() * 6
      seeds[i] = Math.random()
      sizes[i] = 0.6 + Math.random() * 1.6
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    g.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1))
    g.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1))
    return g
  }, [])

  useFrame((state, delta) => {
    if (material.current) {
      material.current.uniforms.uTime.value = state.clock.elapsedTime
    }
    if (group.current) {
      const target = pointer.current
      group.current.rotation.y = THREE.MathUtils.damp(group.current.rotation.y, target.x * 0.12, 3, delta)
      group.current.rotation.x = THREE.MathUtils.damp(group.current.rotation.x, -target.y * 0.07, 3, delta)
      group.current.position.x = THREE.MathUtils.damp(group.current.position.x, -target.x * 0.35, 3, delta)
    }
  })

  return (
    <group ref={group}>
      <points geometry={geometry}>
        <shaderMaterial
          ref={material}
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          uniforms={{
            uTime: { value: 0 },
            uPixelRatio: { value: typeof window === 'undefined' ? 1 : Math.min(window.devicePixelRatio, 1.5) },
          }}
        />
      </points>
    </group>
  )
}

interface HeroParticlesProps {
  pointer: React.MutableRefObject<{ x: number; y: number }>
  active: boolean
  onReady: () => void
}

export default function HeroParticles({ pointer, active, onReady }: HeroParticlesProps) {
  return (
    <Canvas
      dpr={[1, 1.5]}
      frameloop={active ? 'always' : 'never'}
      camera={{ position: [0, 0, 5], fov: 50 }}
      gl={{ alpha: true, antialias: false, powerPreference: 'high-performance' }}
      onCreated={({ gl }) => {
        gl.setClearColor(0x000000, 0)
        onReady()
      }}
      aria-hidden="true"
    >
      <Embers pointer={pointer} />
    </Canvas>
  )
}
