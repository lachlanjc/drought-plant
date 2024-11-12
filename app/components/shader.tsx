"use client";

import React, { useEffect, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Slider } from "@/components/ui/slider";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";

const vertexShader = `
  uniform float waterLevel;
  uniform float time;
  varying vec2 vUv;
  varying float vWaterLevel;

  void main() {
    vUv = uv;
    vWaterLevel = waterLevel;

    // Calculate height based on water level
    float height = mix(0.5, 1.0, waterLevel);

    // Add some waviness to the leaves
    float waviness = sin(position.x * 10.0 + time) * 0.05 * waterLevel;

    // Displace the vertex
    vec3 displaced = position;
    displaced.y *= height;
    displaced.x += waviness;
    displaced.z += waviness;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
  }
`;

const fragmentShader = `
  uniform float waterLevel;
  varying vec2 vUv;
  varying float vWaterLevel;

  void main() {
    // Base color (brown when dry, green when watered)
    vec3 dryColor = vec3(0.6, 0.4, 0.2);
    vec3 wetColor = vec3(0.2, 0.8, 0.3);

    // Mix colors based on water level
    vec3 finalColor = mix(dryColor, wetColor, vWaterLevel);

    // Add some variation based on UV coordinates
    finalColor *= 0.8 + 0.2 * sin(vUv.y * 20.0);

    // Darken the bottom of the plant
    finalColor *= 0.5 + 0.5 * vUv.y;

    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

function Plant({ waterLevel }: { waterLevel: number }) {
  const meshRef = useRef<THREE.Mesh | null>(null);
  const materialRef = useRef<THREE.ShaderMaterial | null>(null);

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.time.value = state.clock.getElapsedTime();
    }
  });

  return (
    <mesh ref={meshRef}>
      <planeGeometry args={[1, 1, 32, 32]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={{
          waterLevel: { value: waterLevel },
          time: { value: 0 },
        }}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

export default function Component({ waterLevel }: { waterLevel: number }) {
  // const [waterLevel, setWaterLevel] = useState(0.5);

  return (
    <>
      <Canvas
        camera={{ position: [0, 0, 2] }}
        className="w-full h-full"
        style={{ opacity: waterLevel }}
      >
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} />
        <Plant waterLevel={waterLevel} />
        <OrbitControls />
      </Canvas>
      {/* <div className="w-full max-w-md p-4 bg-white rounded-lg shadow-md">
        <h2 className="text-lg font-semibold mb-2">Water Level</h2>
        <Slider
          value={[waterLevel]}
          onValueChange={(value) => setWaterLevel(value[0])}
          max={1}
          step={0.01}
          className="w-full"
        />
      </div> */}
    </>
  );
}
