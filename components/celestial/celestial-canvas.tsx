"use client";

import { PerspectiveCamera, Stars } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { useReducedMotion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Group, Mesh, PerspectiveCamera as ThreePerspectiveCamera, ShaderMaterial, Texture } from "three";
import {
  AdditiveBlending,
  CanvasTexture,
  Color,
  DoubleSide,
  LinearFilter,
  SRGBColorSpace
} from "three";

const NOISE_GLSL = /* glsl */ `
  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);

    return mix(
      mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
      u.y
    );
  }

  float fbm(vec2 p) {
    float value = 0.0;
    float amplitude = 0.5;
    float frequency = 1.0;

    for (int i = 0; i < 6; i++) {
      value += noise(p * frequency) * amplitude;
      frequency *= 2.08;
      amplitude *= 0.52;
    }

    return value;
  }
`;

const PLANET_VERT = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vWorldNormal;

  void main() {
    vUv = uv;
    vWorldNormal = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const SATURN_FRAG = /* glsl */ `
  uniform float uTime;
  varying vec2 vUv;
  varying vec3 vWorldNormal;
  ${NOISE_GLSL}

  void main() {
    float t = uTime * 0.004;
    vec2 uv = vUv;

    float warp = fbm(vec2(uv.x * 3.6 + t, uv.y * 1.5 + 0.6)) * 0.085;
    float bands = sin((uv.y + warp) * 13.0) * 0.5 + 0.5;
    float micro = (fbm(vec2(uv.x * 9.0 - t * 0.2, uv.y * 6.4)) - 0.5) * 0.15;
    float pattern = clamp(bands + micro, 0.0, 1.0);

    vec3 sand = vec3(0.93, 0.84, 0.66);
    vec3 honey = vec3(0.83, 0.67, 0.42);
    vec3 bronze = vec3(0.62, 0.46, 0.24);
    vec3 umber = vec3(0.35, 0.24, 0.13);
    vec3 ivory = vec3(0.98, 0.93, 0.84);

    vec3 color;
    if (pattern < 0.32) {
      color = mix(umber, bronze, pattern / 0.32);
    } else if (pattern < 0.68) {
      color = mix(bronze, honey, (pattern - 0.32) / 0.36);
    } else {
      color = mix(honey, sand, (pattern - 0.68) / 0.32);
    }

    float equator = smoothstep(0.38, 0.48, uv.y) * smoothstep(0.62, 0.52, uv.y);
    color = mix(color, ivory, equator * 0.26);

    vec3 lightDir = normalize(vec3(-0.8, 0.48, 0.85));
    float diffuse = max(dot(vWorldNormal, lightDir), 0.06);
    vec3 lit = color * (0.2 + diffuse * 0.8);

    vec3 rimColor = vec3(0.42, 0.48, 0.9);
    float rim = pow(1.0 - max(dot(normalize(vWorldNormal), vec3(0.0, 0.0, 1.0)), 0.0), 2.4);
    lit += rimColor * rim * 0.07;

    gl_FragColor = vec4(lit, 1.0);
  }
`;

const ATMO_VERT = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vViewDir;

  void main() {
    vNormal = normalize(normalMatrix * normal);
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vViewDir = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }
`;

const ATMO_FRAG = /* glsl */ `
  uniform vec3 uColor;
  uniform float uIntensity;
  uniform float uPower;
  varying vec3 vNormal;
  varying vec3 vViewDir;

  void main() {
    float fresnel = pow(clamp(1.0 - dot(vNormal, vViewDir), 0.0, 1.0), uPower);
    gl_FragColor = vec4(uColor, fresnel * uIntensity);
  }
`;

function Atmosphere({
  radius,
  color,
  intensity,
  power
}: {
  radius: number;
  color: string;
  intensity: number;
  power: number;
}) {
  const uniforms = useMemo(
    () => ({
      uColor: { value: new Color(color) },
      uIntensity: { value: intensity },
      uPower: { value: power }
    }),
    [color, intensity, power]
  );

  return (
    <mesh>
      <sphereGeometry args={[radius, 64, 64]} />
      <shaderMaterial
        uniforms={uniforms}
        vertexShader={ATMO_VERT}
        fragmentShader={ATMO_FRAG}
        transparent
        blending={AdditiveBlending}
        depthWrite={false}
      />
    </mesh>
  );
}

function createRingTexture(): Texture {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 64;
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    const fallback = new CanvasTexture(canvas);
    fallback.colorSpace = SRGBColorSpace;
    return fallback;
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
  gradient.addColorStop(0, "rgba(0,0,0,0)");
  gradient.addColorStop(0.08, "rgba(110,116,144,0.38)");
  gradient.addColorStop(0.18, "rgba(188,180,156,0.76)");
  gradient.addColorStop(0.42, "rgba(244,232,204,0.92)");
  gradient.addColorStop(0.65, "rgba(187,180,162,0.74)");
  gradient.addColorStop(0.82, "rgba(109,116,145,0.34)");
  gradient.addColorStop(1, "rgba(0,0,0,0)");

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let x = 0; x < canvas.width; x += 4) {
    const alpha = 0.04 + ((Math.sin(x * 0.03) + 1) * 0.5) * 0.1;
    ctx.fillStyle = `rgba(255,255,255,${alpha})`;
    ctx.fillRect(x, 0, 1, canvas.height);
  }

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.minFilter = LinearFilter;
  texture.magFilter = LinearFilter;
  texture.needsUpdate = true;
  return texture;
}

function SaturnHero() {
  const groupRef = useRef<Group>(null);
  const meshRef = useRef<Mesh>(null);
  const materialRef = useRef<ShaderMaterial>(null);
  const ringTexture = useMemo(() => createRingTexture(), []);
  const uniforms = useMemo(() => ({ uTime: { value: 0 } }), []);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;

    if (groupRef.current) {
      groupRef.current.position.y = -0.34 + Math.sin(t * 0.12) * 0.08;
      groupRef.current.rotation.z = -0.22 + Math.sin(t * 0.05) * 0.015;
    }

    if (meshRef.current) {
      meshRef.current.rotation.y = t * 0.045;
    }

    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = t;
    }
  });

  return (
    <group ref={groupRef} position={[6.6, -0.34, -2.4]} rotation={[0.55, -0.92, -0.22]}>
      <mesh ref={meshRef}>
        <sphereGeometry args={[3.15, 128, 128]} />
        <shaderMaterial
          ref={materialRef}
          uniforms={uniforms}
          vertexShader={PLANET_VERT}
          fragmentShader={SATURN_FRAG}
        />
      </mesh>

      <Atmosphere radius={3.33} color="#d8b47a" intensity={0.9} power={3.5} />
      <Atmosphere radius={4.05} color="#6874b7" intensity={0.18} power={2.0} />

      <mesh rotation={[1.26, 0.12, 0.14]}>
        <ringGeometry args={[4.35, 6.6, 256]} />
        <meshBasicMaterial
          map={ringTexture}
          color="#f2e3bf"
          side={DoubleSide}
          transparent
          opacity={0.82}
          depthWrite={false}
        />
      </mesh>

      <mesh rotation={[1.26, 0.12, 0.14]}>
        <ringGeometry args={[6.72, 7.45, 256]} />
        <meshBasicMaterial
          color="#8893d4"
          side={DoubleSide}
          transparent
          opacity={0.12}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

function DustDrift() {
  const pointsRef = useRef<Group>(null);
  const particles = useMemo(
    () =>
      new Float32Array(
        Array.from({ length: 180 }, (_, index) => {
          const spiral = index * 0.91;
          const radius = 4 + (index % 17) * 0.37;
          const x = Math.cos(spiral) * radius - 1.4;
          const y = Math.sin(spiral * 1.3) * (0.5 + (index % 7) * 0.24);
          const z = -5 - (index % 9) * 0.5;
          return [x, y, z];
        }).flat()
      ),
    []
  );

  useFrame(({ clock }) => {
    if (!pointsRef.current) {
      return;
    }

    const t = clock.elapsedTime;
    pointsRef.current.position.x = Math.sin(t * 0.035) * 0.15;
    pointsRef.current.position.y = Math.cos(t * 0.025) * 0.08;
    pointsRef.current.rotation.y = t * 0.008;
  });

  return (
    <group ref={pointsRef}>
      <points>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[particles, 3]}
            count={particles.length / 3}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          color="#d6dcee"
          transparent
          size={0.028}
          sizeAttenuation
          depthWrite={false}
          opacity={0.17}
        />
      </points>
    </group>
  );
}

function CameraDrift() {
  const cameraRef = useRef<ThreePerspectiveCamera>(null);

  useFrame(({ clock }) => {
    if (!cameraRef.current) {
      return;
    }

    const t = clock.elapsedTime;
    cameraRef.current.position.x = Math.sin(t * 0.04) * 0.08;
    cameraRef.current.position.y = Math.cos(t * 0.05) * 0.06;
    cameraRef.current.position.z = 8.3 + Math.sin(t * 0.03) * 0.08;
    cameraRef.current.lookAt(0.2, -0.15, 0);
  });

  return <PerspectiveCamera ref={cameraRef} makeDefault position={[0, 0, 8.3]} fov={34} />;
}

function CelestialScene() {
  return (
    <>
      <ambientLight intensity={0.26} />
      <directionalLight position={[-7, 2.4, 4.6]} intensity={1.45} color="#f7e7c3" />
      <pointLight position={[4.8, -0.8, 3.5]} intensity={24} distance={22} color="#e2b36e" />
      <pointLight position={[8.5, 2.2, 2.8]} intensity={10} distance={18} color="#6977c0" />

      <Stars radius={120} depth={50} count={1600} factor={2.6} saturation={0} fade speed={0.22} />
      <DustDrift />
      <SaturnHero />
      <CameraDrift />
    </>
  );
}

function MobileFallback() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }

    const resize = () => {
      canvas.width = Math.max(1, Math.floor(canvas.offsetWidth * window.devicePixelRatio));
      canvas.height = Math.max(1, Math.floor(canvas.offsetHeight * window.devicePixelRatio));
    };

    const stars = Array.from({ length: 120 }, () => ({
      x: Math.random(),
      y: Math.random(),
      r: 0.4 + Math.random() * 1.2,
      alpha: 0.18 + Math.random() * 0.36
    }));

    resize();
    window.addEventListener("resize", resize);

    const start = performance.now();

    const draw = () => {
      const width = canvas.width;
      const height = canvas.height;
      const elapsed = (performance.now() - start) / 1000;

      ctx.clearRect(0, 0, width, height);

      for (const star of stars) {
        const pulse = star.alpha + Math.sin(elapsed * 0.28 + star.x * 8) * 0.04;
        ctx.beginPath();
        ctx.arc(star.x * width, star.y * height, star.r * window.devicePixelRatio, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(233,238,248,${pulse})`;
        ctx.fill();
      }

      const centerX = width * 0.92 + Math.sin(elapsed * 0.12) * width * 0.008;
      const centerY = height * 0.44 + Math.cos(elapsed * 0.1) * height * 0.01;
      const radius = width * 0.23;

      const ringGradient = ctx.createRadialGradient(centerX, centerY, radius * 0.95, centerX, centerY, radius * 1.9);
      ringGradient.addColorStop(0, "rgba(0,0,0,0)");
      ringGradient.addColorStop(0.26, "rgba(244,227,194,0.78)");
      ringGradient.addColorStop(0.4, "rgba(175,170,156,0.6)");
      ringGradient.addColorStop(0.62, "rgba(117,126,170,0.18)");
      ringGradient.addColorStop(1, "rgba(0,0,0,0)");

      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(-0.38);
      ctx.scale(1.7, 0.34);
      ctx.beginPath();
      ctx.arc(0, 0, radius * 1.22, 0, Math.PI * 2);
      ctx.fillStyle = ringGradient;
      ctx.fill();
      ctx.restore();

      const planetGradient = ctx.createRadialGradient(
        centerX - radius * 0.3,
        centerY - radius * 0.38,
        radius * 0.18,
        centerX,
        centerY,
        radius * 1.05
      );
      planetGradient.addColorStop(0, "#f8ead0");
      planetGradient.addColorStop(0.34, "#d0aa65");
      planetGradient.addColorStop(0.72, "#7c562d");
      planetGradient.addColorStop(1, "#22160d");

      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.fillStyle = planetGradient;
      ctx.fill();

      ctx.globalCompositeOperation = "multiply";
      for (let index = 0; index < 12; index += 1) {
        const y = centerY - radius + index * (radius * 0.16);
        ctx.fillStyle = `rgba(90,56,26,${0.06 + index * 0.009})`;
        ctx.fillRect(centerX - radius, y, radius * 2, radius * 0.08);
      }

      ctx.globalCompositeOperation = "source-over";

      const atmosphere = ctx.createRadialGradient(centerX, centerY, radius * 0.9, centerX, centerY, radius * 1.45);
      atmosphere.addColorStop(0, "rgba(0,0,0,0)");
      atmosphere.addColorStop(0.62, "rgba(229,187,120,0.2)");
      atmosphere.addColorStop(0.82, "rgba(106,121,203,0.12)");
      atmosphere.addColorStop(1, "rgba(0,0,0,0)");

      ctx.beginPath();
      ctx.arc(centerX, centerY, radius * 1.45, 0, Math.PI * 2);
      ctx.fillStyle = atmosphere;
      ctx.fill();

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} aria-hidden="true" className="absolute inset-0 h-full w-full" />;
}

function StaticFallback() {
  return (
    <div aria-hidden="true" className="absolute inset-0 overflow-hidden">
      <div className="absolute right-[-18%] top-[18%] h-[33rem] w-[33rem] rounded-full bg-[radial-gradient(circle_at_32%_28%,rgba(248,234,208,0.96),rgba(207,168,98,0.84)_22%,rgba(113,76,38,0.78)_58%,rgba(18,12,8,0.94)_100%)] shadow-[0_0_120px_rgba(217,180,113,0.14)]" />
      <div className="absolute right-[-12%] top-[24%] h-[18rem] w-[36rem] -rotate-[18deg] rounded-full border border-[#d9cfbc]/16 bg-[radial-gradient(circle,rgba(248,233,203,0.34),rgba(136,142,179,0.08)_48%,transparent_72%)]" />
      <div className="absolute inset-0 opacity-[0.14] bg-[radial-gradient(circle_at_14%_18%,rgba(255,255,255,0.88)_0,rgba(255,255,255,0.88)_0.75px,transparent_1.4px),radial-gradient(circle_at_70%_32%,rgba(210,216,231,0.54)_0,rgba(210,216,231,0.54)_0.85px,transparent_1.7px),radial-gradient(circle_at_40%_78%,rgba(255,255,255,0.42)_0,rgba(255,255,255,0.42)_0.7px,transparent_1.4px)] bg-size-[240px_240px,320px_320px,280px_280px]" />
    </div>
  );
}

function useMobileDetect() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 767px)");
    const update = () => setIsMobile(mediaQuery.matches);

    update();
    mediaQuery.addEventListener("change", update);
    return () => mediaQuery.removeEventListener("change", update);
  }, []);

  return isMobile;
}

export default function CelestialCanvas() {
  const reduceMotion = useReducedMotion();
  const isMobile = useMobileDetect();

  if (reduceMotion) {
    return <StaticFallback />;
  }

  if (isMobile) {
    return (
      <div aria-hidden="true" className="absolute inset-0">
        <MobileFallback />
      </div>
    );
  }

  return (
    <div aria-hidden="true" className="absolute inset-0">
      <Canvas dpr={[1, 1.5]} gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}>
        <CelestialScene />
      </Canvas>
    </div>
  );
}
