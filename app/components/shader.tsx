"use client";

import React, { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Environment } from "@react-three/drei";
import * as THREE from "three";

const leafVertexShader = `
  uniform float waterLevel;
  uniform float time;
  uniform float leafIndex;
  
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying float vWaterLevel;
  
  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    vWaterLevel = waterLevel;
    
    vec3 pos = position;
    
    // Wilting effect - leaves droop when dehydrated
    float droop = (1.0 - waterLevel) * 0.5;
    float droopAmount = droop * (1.0 - uv.y) * (1.0 - uv.y);
    pos.y -= droopAmount;
    pos.z -= droopAmount * 0.5;
    
    // Shrinkage when dehydrated
    float shrink = mix(0.75, 1.0, waterLevel);
    pos *= shrink;
    
    // Gentle wave animation (more when hydrated)
    float wave = sin(time * 2.0 + leafIndex * 1.5 + position.x * 3.0) * 0.02 * waterLevel;
    pos.y += wave * uv.y;
    pos.x += wave * 0.5 * uv.y;
    
    // Edge curling when dry
    float edgeCurl = (1.0 - waterLevel) * 0.3;
    float distFromCenter = length(uv - 0.5);
    if (distFromCenter > 0.3) {
      float curlAmount = (distFromCenter - 0.3) * edgeCurl;
      pos.z += curlAmount;
    }
    
    vPosition = pos;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

const leafFragmentShader = `
  uniform float waterLevel;
  uniform float time;
  uniform float leafIndex;
  
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying float vWaterLevel;
  
  // Beautiful color palette
  vec3 healthyGreen = vec3(0.15, 0.55, 0.25);
  vec3 vibrantGreen = vec3(0.25, 0.65, 0.35);
  vec3 yellowGreen = vec3(0.45, 0.65, 0.30);
  vec3 dryYellow = vec3(0.65, 0.55, 0.25);
  vec3 brownDry = vec3(0.45, 0.35, 0.20);
  
  // Create leaf veins
  float vein(vec2 uv, vec2 start, vec2 end, float width) {
    vec2 pa = uv - start;
    vec2 ba = end - start;
    float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
    float dist = length(pa - ba * h);
    return smoothstep(width, width * 0.5, dist);
  }
  
  void main() {
    // Base color transitions
    vec3 baseColor;
    if (vWaterLevel > 0.7) {
      baseColor = mix(healthyGreen, vibrantGreen, (vWaterLevel - 0.7) / 0.3);
    } else if (vWaterLevel > 0.4) {
      baseColor = mix(yellowGreen, healthyGreen, (vWaterLevel - 0.4) / 0.3);
    } else if (vWaterLevel > 0.2) {
      baseColor = mix(dryYellow, yellowGreen, (vWaterLevel - 0.2) / 0.2);
    } else {
      baseColor = mix(brownDry, dryYellow, vWaterLevel / 0.2);
    }
    
    // Add color variation across the leaf
    float colorVar = sin(vUv.x * 3.14159) * sin(vUv.y * 3.14159);
    baseColor += vec3(0.05, 0.08, 0.05) * colorVar;
    
    // Create vein pattern
    float veins = 0.0;
    vec2 center = vec2(0.5, 0.0);
    
    // Main central vein
    veins += vein(vUv, vec2(0.5, 0.0), vec2(0.5, 1.0), 0.015);
    
    // Side veins
    for (float i = 0.0; i < 6.0; i++) {
      float t = (i + 1.0) / 7.0;
      float angle = mix(-0.6, 0.6, mod(i, 2.0));
      vec2 start = vec2(0.5, t);
      vec2 end = vec2(0.5 + angle * (1.0 - t), t + 0.15);
      veins += vein(vUv, start, end, 0.008) * 0.7;
    }
    
    vec3 veinColor = mix(baseColor * 0.7, baseColor * 0.5, 1.0 - vWaterLevel);
    baseColor = mix(baseColor, veinColor, veins);
    
    // Subsurface scattering effect
    vec3 lightDir = normalize(vec3(0.5, 1.0, 0.5));
    float backlight = max(0.0, -dot(vNormal, lightDir));
    vec3 sss = vec3(0.3, 0.8, 0.4) * backlight * 0.5 * vWaterLevel;
    baseColor += sss;
    
    // Fresnel effect for translucency
    vec3 viewDir = normalize(cameraPosition - vPosition);
    float fresnel = pow(1.0 - abs(dot(viewDir, vNormal)), 3.0);
    baseColor += fresnel * vec3(0.2, 0.4, 0.2) * vWaterLevel * 0.3;
    
    // Lighting
    float diffuse = max(0.0, dot(vNormal, lightDir));
    baseColor *= 0.6 + 0.4 * diffuse;
    
    // Brown spots when very dry
    if (vWaterLevel < 0.3) {
      float spotPattern = sin(vUv.x * 40.0 + leafIndex) * sin(vUv.y * 40.0);
      float spots = smoothstep(0.3, 0.5, spotPattern) * (0.3 - vWaterLevel) * 3.0;
      baseColor = mix(baseColor, brownDry * 0.6, spots);
    }
    
    gl_FragColor = vec4(baseColor, 1.0);
  }
`;

const stemVertexShader = `
  uniform float waterLevel;
  uniform float time;
  
  varying vec3 vPosition;
  
  void main() {
    vec3 pos = position;
    
    // Gentle swaying
    float sway = sin(time + position.y * 2.0) * 0.02 * waterLevel;
    pos.x += sway * (position.y + 1.0);
    
    vPosition = pos;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

const stemFragmentShader = `
  uniform float waterLevel;
  
  varying vec3 vPosition;
  
  void main() {
    vec3 healthyStem = vec3(0.25, 0.45, 0.30);
    vec3 dryStem = vec3(0.35, 0.30, 0.20);
    
    vec3 stemColor = mix(dryStem, healthyStem, waterLevel);
    
    // Add some variation
    stemColor *= 0.9 + 0.1 * sin(vPosition.y * 20.0);
    
    gl_FragColor = vec4(stemColor, 1.0);
  }
`;

function createRealisticLeafGeometry() {
  const shape = new THREE.Shape();

  // Create more realistic leaf with pointed tip and organic curves
  shape.moveTo(0, 0);

  // Left side
  shape.bezierCurveTo(-0.15, 0.1, -0.3, 0.25, -0.35, 0.4);
  shape.bezierCurveTo(-0.38, 0.55, -0.35, 0.7, -0.25, 0.85);
  shape.bezierCurveTo(-0.15, 0.95, -0.05, 1.0, 0, 1.1);

  // Right side
  shape.bezierCurveTo(0.05, 1.0, 0.15, 0.95, 0.25, 0.85);
  shape.bezierCurveTo(0.35, 0.7, 0.38, 0.55, 0.35, 0.4);
  shape.bezierCurveTo(0.3, 0.25, 0.15, 0.1, 0, 0);

  return new THREE.ShapeGeometry(shape, 64);
}

function Leaf({ position, rotation, scale, waterLevel, index }) {
  const materialRef = useRef();
  const groupRef = useRef();
  const geometry = useMemo(() => createRealisticLeafGeometry(), []);

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.time.value = state.clock.elapsedTime;
      materialRef.current.uniforms.waterLevel.value = waterLevel;
    }

    // Adjust the entire leaf group position to match the droop in the shader
    if (groupRef.current) {
      const droop = (1.0 - waterLevel) * 0.25;
      groupRef.current.position.y = position[1] - droop;
      groupRef.current.position.z = position[2] - droop * 0.25;
    }
  });

  return (
    <group ref={groupRef} position={position} rotation={rotation} scale={scale}>
      <mesh geometry={geometry}>
        <shaderMaterial
          ref={materialRef}
          vertexShader={leafVertexShader}
          fragmentShader={leafFragmentShader}
          uniforms={{
            waterLevel: { value: 0.8 },
            time: { value: 0 },
            leafIndex: { value: index },
          }}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

function Stem({ start, end, waterLevel, index }) {
  const materialRef = useRef();
  const meshRef = useRef();
  const lastUpdateTimeRef = useRef(0);
  const [currentGeometry, setCurrentGeometry] = React.useState(null);

  const midpointOffset = useMemo(
    () => ({
      x: (Math.random() - 0.5) * 0.2,
      z: (Math.random() - 0.5) * 0.2,
    }),
    []
  );

  React.useEffect(() => {
    const baseCurve = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(...start),
      new THREE.Vector3(
        (start[0] + end[0]) / 2 + midpointOffset.x,
        (start[1] + end[1]) / 2,
        (start[2] + end[2]) / 2 + midpointOffset.z
      ),
      new THREE.Vector3(...end)
    );

    const geo = new THREE.TubeGeometry(baseCurve, 20, 0.015, 8, false);
    setCurrentGeometry(geo);

    return () => {
      if (geo) geo.dispose();
    };
  }, [start, end, midpointOffset]);

  useFrame((state) => {
    if (materialRef.current && typeof waterLevel === 'number' && !isNaN(waterLevel)) {
      materialRef.current.uniforms.time.value = state.clock.elapsedTime;
      materialRef.current.uniforms.waterLevel.value = waterLevel;
    }

    // Throttle geometry updates to every 100ms instead of every frame
    const now = state.clock.elapsedTime;
    if (meshRef.current && currentGeometry && 
        typeof waterLevel === 'number' && !isNaN(waterLevel) &&
        now - lastUpdateTimeRef.current > 0.1) {
      
      lastUpdateTimeRef.current = now;
      
      const droop = (1.0 - waterLevel) * 0.25;
      const newEnd = new THREE.Vector3(
        end[0],
        end[1] - droop,
        end[2] - droop * 0.25
      );

      const curve = new THREE.QuadraticBezierCurve3(
        new THREE.Vector3(...start),
        new THREE.Vector3(
          (start[0] + newEnd.x) / 2 + midpointOffset.x,
          (start[1] + newEnd.y) / 2,
          (start[2] + newEnd.z) / 2 + midpointOffset.z
        ),
        newEnd
      );

      const newGeometry = new THREE.TubeGeometry(curve, 20, 0.015, 8, false);

      if (meshRef.current.geometry && meshRef.current.geometry !== currentGeometry) {
        meshRef.current.geometry.dispose();
      }

      meshRef.current.geometry = newGeometry;
      
      // Dispose old geometry from state
      if (currentGeometry) {
        currentGeometry.dispose();
      }
      setCurrentGeometry(newGeometry);
    }
  });

  if (!currentGeometry) return null;

  return (
    <mesh ref={meshRef} geometry={currentGeometry}>
      <shaderMaterial
        ref={materialRef}
        vertexShader={stemVertexShader}
        fragmentShader={stemFragmentShader}
        uniforms={{
          waterLevel: { value: 0.8 },
          time: { value: 0 },
        }}
      />
    </mesh>
  );
}

function Plant({ waterLevel, leafCount }) {
  const leaves = useMemo(() => {
    return Array.from({ length: leafCount }, (_, i) => {
      const angle = (i / leafCount) * Math.PI * 2 + Math.random() * 0.5;
      const height = Math.random() * 0.6 + 0.4;
      const radius = 0.3 + Math.random() * 0.3;

      const leafPos = [
        Math.cos(angle) * radius,
        height,
        Math.sin(angle) * radius,
      ];

      return {
        position: leafPos,
        rotation: [
          Math.random() * 0.3 - 0.15,
          angle + Math.PI / 2,
          Math.random() * 0.2 - 0.1,
        ],
        scale: 0.3 + Math.random() * 0.2,
        stemStart: [0, 0, 0],
        stemEnd: leafPos,
      };
    });
  }, [leafCount]);

  return (
    <group position={[0, 0, 0]}>
      {leaves.map((leaf, i) => (
        <group key={i}>
          <Stem
            start={leaf.stemStart}
            end={leaf.stemEnd}
            waterLevel={waterLevel}
            index={i}
          />
          <Leaf
            position={leaf.position}
            rotation={leaf.rotation}
            scale={leaf.scale}
            waterLevel={waterLevel}
            index={i}
          />
        </group>
      ))}

      {/* Pot */}
      <mesh position={[0, -0.15, 0]}>
        <cylinderGeometry args={[0.35, 0.3, 0.4, 32]} />
        <meshStandardMaterial color="#c97854" roughness={0.8} />
      </mesh>

      {/* Soil */}
      <mesh position={[0, 0.03, 0]}>
        <cylinderGeometry args={[0.33, 0.33, 0.05, 32]} />
        <meshStandardMaterial color="#3d2817" roughness={0.9} />
      </mesh>
    </group>
  );
}

const leafCount = 8;
export default function Component({ waterLevel }: { waterLevel: number }) {
  // const [waterLevel, setWaterLevel] = React.useState(0.8)
  // const [leafCount, setLeafCount] = React.useState(8)

  return (
    <Canvas
      camera={{ position: [0, 0.5, 2], fov: 50 }}
      className="w-full h-full"
    >
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 5, 5]} intensity={0.8} />
      <directionalLight position={[-3, 2, -2]} intensity={0.3} />
      <Environment preset="apartment" />
      <Plant waterLevel={waterLevel} leafCount={leafCount} />
      <OrbitControls
        enablePan={false}
        minPolarAngle={Math.PI / 4}
        maxPolarAngle={Math.PI / 2}
      />
    </Canvas>
  );
}
