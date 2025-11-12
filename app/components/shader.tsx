"use client";

import React, { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Environment } from "@react-three/drei";
import * as THREE from "three";
import { Slider } from "@/components/ui/slider";

// Seeded random number generator for deterministic randomness
function seededRandom(seed: number) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

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
    vWaterLevel = waterLevel;
    
    vec3 pos = position;
    
    // Realistic wilting - leaves droop and curl moderately
    // uv.y = 0 is base (attached to stem), uv.y = 1 is tip
    float wiltIntensity = 1.0 - waterLevel;
    
    // Droop curve - tips droop more than base
    float wiltFactor = uv.y * uv.y;
    
    // Moderate downward droop - leaves sag but don't collapse completely
    pos.y -= wiltIntensity * wiltFactor * 0.8;
    
    // Backward curl - leaves fold back slightly when dry
    pos.z -= wiltIntensity * wiltFactor * 0.5;
    
    // Sideways variation for natural randomness
    float sideVariation = sin(leafIndex * 2.5) * wiltIntensity * wiltFactor * 0.3;
    pos.x += sideVariation;
    
    // Shrinkage when dehydrated - leaves get smaller
    // IMPORTANT: Apply shrinkage from the base (uv.y = 0) so base stays attached
    float shrink = mix(0.8, 1.0, waterLevel);
    pos.x *= shrink; // Width shrinks
    pos.y *= mix(shrink, 1.0, 1.0 - uv.y); // Base stays at y=0, tips shrink
    
    // Gentle wave animation (only when healthy)
    float wave = sin(time * 1.5 + leafIndex * 1.5 + position.x * 3.0) * 0.02 * waterLevel;
    pos.y += wave * uv.y;
    pos.x += wave * 0.3 * uv.y;
    
    // Edge curling when dry - subtle crispy edges
    float edgeCurl = wiltIntensity * 0.6;
    float edgeDist = abs(uv.x - 0.5) * 2.0;
    if (edgeDist > 0.5) {
      float curlAmount = (edgeDist - 0.5) * edgeCurl;
      pos.z += curlAmount * 0.8;
      // Tips curl up slightly when very dry
      if (uv.y > 0.7) {
        pos.y += curlAmount * (uv.y - 0.7) * 1.5;
      }
    }
    
    vNormal = normalize(normalMatrix * normal);
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
  
  // DRAMATIC color palette - obvious visual changes
  vec3 vibrantGreen = vec3(0.15, 0.75, 0.25);   // Lush, saturated green
  vec3 healthyGreen = vec3(0.2, 0.65, 0.2);     // Normal healthy green
  vec3 yellowGreen = vec3(0.55, 0.65, 0.2);     // Stressed yellowing
  vec3 dryYellow = vec3(0.75, 0.65, 0.15);      // Very yellow/stressed
  vec3 brownYellow = vec3(0.65, 0.5, 0.15);     // Turning brown
  vec3 brownDry = vec3(0.55, 0.4, 0.2);         // Brown and dying
  vec3 deadBrown = vec3(0.4, 0.25, 0.15);       // Dead and crispy
  
  // Create leaf veins
  float vein(vec2 uv, vec2 start, vec2 end, float width) {
    vec2 pa = uv - start;
    vec2 ba = end - start;
    float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
    float dist = length(pa - ba * h);
    return smoothstep(width, width * 0.5, dist);
  }
  
  void main() {
    // REALISTIC color transitions - plants show stress early and often
    vec3 baseColor;
    if (vWaterLevel > 0.85) {
      // Super healthy, vibrant green
      baseColor = mix(healthyGreen, vibrantGreen, (vWaterLevel - 0.85) / 0.15);
    } else if (vWaterLevel > 0.65) {
      // Starting to stress - yellowing begins
      baseColor = mix(yellowGreen, healthyGreen, (vWaterLevel - 0.65) / 0.2);
    } else if (vWaterLevel > 0.45) {
      // Clearly stressed - yellow dominates
      baseColor = mix(dryYellow, yellowGreen, (vWaterLevel - 0.45) / 0.2);
    } else if (vWaterLevel > 0.25) {
      // Very stressed - browning starts
      baseColor = mix(brownYellow, dryYellow, (vWaterLevel - 0.25) / 0.2);
    } else if (vWaterLevel > 0.1) {
      // Dying - mostly brown
      baseColor = mix(brownDry, brownYellow, (vWaterLevel - 0.1) / 0.15);
    } else {
      // Dead - dark brown/crispy
      baseColor = mix(deadBrown, brownDry, vWaterLevel / 0.1);
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
    
    vec3 veinColor = mix(baseColor * 0.7, baseColor * 0.4, 1.0 - vWaterLevel);
    baseColor = mix(baseColor, veinColor, veins);
    
    // Subsurface scattering effect (only when hydrated - dry leaves don't glow)
    vec3 lightDir = normalize(vec3(0.5, 1.0, 0.5));
    float backlight = max(0.0, -dot(vNormal, lightDir));
    vec3 sss = vec3(0.3, 0.8, 0.4) * backlight * 0.5 * vWaterLevel * vWaterLevel;
    baseColor += sss;
    
    // Fresnel effect for translucency (only when healthy)
    vec3 viewDir = normalize(cameraPosition - vPosition);
    float fresnel = pow(1.0 - abs(dot(viewDir, vNormal)), 3.0);
    baseColor += fresnel * vec3(0.2, 0.4, 0.2) * vWaterLevel * vWaterLevel * 0.3;
    
    // Lighting
    float diffuse = max(0.0, dot(vNormal, lightDir));
    baseColor *= 0.6 + 0.4 * diffuse;
    
    // Brown spots and damage when dry - appears earlier and more dramatically
    if (vWaterLevel < 0.6) {
      // Multiple spot patterns for realistic leaf damage
      float spotPattern1 = sin(vUv.x * 40.0 + leafIndex) * sin(vUv.y * 40.0);
      float spotPattern2 = sin(vUv.x * 25.0 - leafIndex * 2.0) * sin(vUv.y * 30.0);
      
      // Spots intensify as water level drops
      float spotIntensity = (0.6 - vWaterLevel) * 2.0;
      float spots = smoothstep(0.2, 0.6, spotPattern1) * spotIntensity;
      spots += smoothstep(0.3, 0.7, spotPattern2) * spotIntensity * 0.5;
      
      // Mix in dark brown spots
      baseColor = mix(baseColor, deadBrown * 0.5, clamp(spots, 0.0, 0.7));
    }
    
    // Edges turn brown first (edge burn effect)
    if (vWaterLevel < 0.5) {
      float edgeDist = min(abs(vUv.x - 0.5) * 2.0, abs(vUv.y - 0.5) * 2.0);
      if (edgeDist > 0.7) {
        float edgeBurn = (edgeDist - 0.7) * (0.5 - vWaterLevel) * 5.0;
        baseColor = mix(baseColor, deadBrown * 0.4, clamp(edgeBurn, 0.0, 0.8));
      }
    }
    
    gl_FragColor = vec4(baseColor, 1.0);
  }
`;

const stemVertexShader = `
  uniform float waterLevel;
  uniform float time;
  
  varying vec3 vPosition;
  varying float vWaterLevel;
  
  void main() {
    vec3 pos = position;
    vWaterLevel = waterLevel;
    
    vPosition = pos;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

const stemFragmentShader = `
  uniform float waterLevel;
  
  varying vec3 vPosition;
  varying float vWaterLevel;
  
  void main() {
    vec3 healthyStem = vec3(0.25, 0.45, 0.30);
    vec3 dryStem = vec3(0.35, 0.30, 0.20);
    
    vec3 stemColor = mix(dryStem, healthyStem, vWaterLevel);
    
    // Add some variation along the length
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

function Leaf({ stemEndPosition, rotation, scale, waterLevel, index }) {
  const materialRef = useRef();
  const geometry = useMemo(() => createRealisticLeafGeometry(), []);

  // Create stable uniforms object that won't change reference
  const uniforms = useMemo(
    () => ({
      waterLevel: { value: waterLevel },
      time: { value: 0 },
      leafIndex: { value: index },
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }),
    [index]
  ); // Only recreate if index changes, waterLevel updated via ref

  // Update water level immediately when prop changes
  React.useEffect(() => {
    if (materialRef.current) {
      materialRef.current.uniforms.waterLevel.value = waterLevel;
    }
  }, [waterLevel]);

  // Update uniforms every frame
  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.time.value = state.clock.elapsedTime;
      materialRef.current.uniforms.waterLevel.value = waterLevel;
    }
  });

  return (
    <group position={stemEndPosition} rotation={rotation} scale={scale}>
      <mesh geometry={geometry}>
        <shaderMaterial
          ref={materialRef}
          vertexShader={leafVertexShader}
          fragmentShader={leafFragmentShader}
          uniforms={uniforms}
          side={THREE.DoubleSide}
          uniformsNeedUpdate
        />
      </mesh>
    </group>
  );
}

function Stem({ start, end, waterLevel, onEndPositionUpdate, stemIndex }) {
  const materialRef = useRef();
  const meshRef = useRef();
  const previousWaterLevelRef = useRef(waterLevel);
  const geometryRef = useRef(null);

  const midpointOffset = useMemo(
    () => ({
      x: (seededRandom(stemIndex * 2 + 100) - 0.5) * 0.2,
      z: (seededRandom(stemIndex * 2 + 101) - 0.5) * 0.2,
    }),
    [stemIndex]
  );

  // Calculate drooped end position based on water level
  const getDroopedEndPosition = React.useCallback(
    (water) => {
      const droop = 1.0 - water; // Droop intensity

      // Stems droop more dramatically at low water levels
      // Use quadratic curve for more dramatic effect when very dry
      const downwardDroop = droop * droop * 0.7; // Stronger droop at low water

      // CRITICAL: Never allow stems to droop below the soil level (y = 0.05)
      const SOIL_LEVEL = 0.05;
      const droopedY = end[1] - downwardDroop;
      const clampedY = Math.max(droopedY, SOIL_LEVEL);

      return [
        end[0], // Keep horizontal position - stems stay rooted
        clampedY, // Clamped to never go below soil
        end[2], // Keep depth position - stems stay rooted
      ];
    },
    [end]
  );

  // Create geometry based on water level (without using refs)
  const createGeometry = React.useCallback(
    (water) => {
      const droopedEnd = getDroopedEndPosition(water);

      // Stems ALWAYS go up first, then droop at the top
      // Calculate midpoint that's higher than both start and end when drooping
      const upwardBias = 0.3; // Stems rise up from the soil
      const midpointY = Math.max(
        start[1] + upwardBias, // At minimum, go up from base
        (start[1] + droopedEnd[1]) / 2 + water * 0.2 // When healthy, taller midpoint
      );

      // Horizontal position interpolates normally
      const midpointX = (start[0] + droopedEnd[0]) / 2 + midpointOffset.x;
      const midpointZ = (start[2] + droopedEnd[2]) / 2 + midpointOffset.z;

      const curve = new THREE.QuadraticBezierCurve3(
        new THREE.Vector3(...start),
        new THREE.Vector3(midpointX, midpointY, midpointZ),
        new THREE.Vector3(...droopedEnd)
      );

      const newGeometry = new THREE.TubeGeometry(curve, 20, 0.015, 8, false);

      return newGeometry;
    },
    [start, getDroopedEndPosition, midpointOffset]
  );

  // Initialize geometry once
  const initialGeometry = useMemo(() => {
    return createGeometry(waterLevel);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update geometry when water level changes (with threshold to avoid constant updates)
  React.useEffect(() => {
    const waterLevelDiff = Math.abs(waterLevel - previousWaterLevelRef.current);
    if (waterLevelDiff > 0.01 && meshRef.current) {
      // Dispose old geometry
      if (
        geometryRef.current &&
        geometryRef.current !== meshRef.current.geometry
      ) {
        geometryRef.current.dispose();
      }

      const newGeometry = createGeometry(waterLevel);
      geometryRef.current = meshRef.current.geometry;
      meshRef.current.geometry = newGeometry;
      previousWaterLevelRef.current = waterLevel;
    }
  }, [waterLevel, createGeometry]);

  // Notify parent of end position after rendering
  React.useEffect(() => {
    if (onEndPositionUpdate) {
      const droopedEnd = getDroopedEndPosition(waterLevel);
      onEndPositionUpdate(droopedEnd);
    }
  }, [waterLevel, getDroopedEndPosition, onEndPositionUpdate]);

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      if (geometryRef.current) {
        geometryRef.current.dispose();
      }
    };
  }, []);

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.time.value = state.clock.elapsedTime;
      materialRef.current.uniforms.waterLevel.value = waterLevel;
    }
  });

  return (
    <mesh ref={meshRef} geometry={initialGeometry}>
      <shaderMaterial
        ref={materialRef}
        vertexShader={stemVertexShader}
        fragmentShader={stemFragmentShader}
        uniforms={{
          waterLevel: { value: waterLevel },
          time: { value: 0 },
        }}
      />
    </mesh>
  );
}

// Component to manage a single stem-leaf pair with isolated state
function PlantLeafPair({ leaf, waterLevel, index }) {
  const [stemEndPosition, setStemEndPosition] = React.useState(
    leaf.originalPosition
  );

  const handleStemEndUpdate = React.useCallback((newPos) => {
    setStemEndPosition(newPos);
  }, []);

  return (
    <group>
      <Stem
        start={leaf.stemStart}
        end={leaf.stemEnd}
        waterLevel={waterLevel}
        onEndPositionUpdate={handleStemEndUpdate}
        stemIndex={index}
      />
      <Leaf
        stemEndPosition={stemEndPosition}
        rotation={leaf.rotation}
        scale={leaf.scale}
        waterLevel={waterLevel}
        index={index}
      />
    </group>
  );
}

function Plant({ waterLevel, leafCount }) {
  const leaves = useMemo(() => {
    return Array.from({ length: leafCount }, (_, i) => {
      const angle = (i / leafCount) * Math.PI * 2 + seededRandom(i * 5) * 0.5;
      const height = seededRandom(i * 5 + 1) * 0.6 + 0.4;
      const radius = 0.3 + seededRandom(i * 5 + 2) * 0.3;

      const leafPos = [
        Math.cos(angle) * radius,
        height,
        Math.sin(angle) * radius,
      ];

      return {
        originalPosition: leafPos,
        rotation: [
          seededRandom(i * 5 + 3) * 0.3 - 0.15,
          angle + Math.PI / 2,
          seededRandom(i * 5 + 4) * 0.2 - 0.1,
        ],
        scale: 0.3 + seededRandom(i * 5 + 5) * 0.2,
        stemStart: [0, 0, 0],
        stemEnd: leafPos,
      };
    });
  }, [leafCount]);

  return (
    <group position={[0, 0, 0]}>
      {leaves.map((leaf, i) => (
        <PlantLeafPair key={i} leaf={leaf} waterLevel={waterLevel} index={i} />
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

export default function Component({
  initialWaterLevel = 80,
}: {
  initialWaterLevel?: number;
}) {
  // Normalize water level to 0-1 range
  // Expect initialWaterLevel to be a percentage (0-100) or could be higher/lower
  const normalizeWaterLevel = (value: number) => {
    // Clamp between 0 and 200, then map to 0-1
    // 0 = completely dry, 100 = normal, 200 = overwatered
    return Math.max(0, Math.min(1, value / 100));
  };

  const [waterLevel, setWaterLevel] = React.useState(
    normalizeWaterLevel(initialWaterLevel)
  );

  const handleSliderChange = (values: number[]) => {
    setWaterLevel(values[0] / 100);
  };

  return (
    <div className="w-full h-full flex flex-col">
      <Canvas
        camera={{ position: [0, 0.5, 2], fov: 50 }}
        className="w-full flex-1"
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
      {/* 
      <div className="px-8 pb-6">
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium">Water Level</label>
          <span className="text-sm tabular-nums">
            {Math.round(waterLevel * 100)}%
          </span>
        </div>
        <Slider
          value={[waterLevel * 100]}
          onValueChange={handleSliderChange}
          max={100}
          min={0}
          step={1}
          className="w-full"
        />
      </div> */}
    </div>
  );
}
