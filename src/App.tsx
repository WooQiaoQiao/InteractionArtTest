import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Settings, Heart, Flower, Sparkles, CircleDot, User, Camera as CameraIcon } from 'lucide-react';

declare global {
  interface Window {
    Hands: any;
    Camera: any;
  }
}

const PARTICLE_COUNT = 30000;

function getHeart() {
  const pos = new Float32Array(PARTICLE_COUNT * 3);
  for(let i=0; i<PARTICLE_COUNT; i++) {
    const t = Math.random() * Math.PI * 2;
    const r = Math.sqrt(Math.random());
    const x = 16 * Math.pow(Math.sin(t), 3);
    const y = 13 * Math.cos(t) - 5 * Math.cos(2*t) - 2 * Math.cos(3*t) - Math.cos(4*t);
    pos[i*3] = x * r * 0.15;
    pos[i*3+1] = y * r * 0.15;
    pos[i*3+2] = (Math.random() - 0.5) * 1.5;
  }
  return pos;
}

function getFlower() {
  const pos = new Float32Array(PARTICLE_COUNT * 3);
  for(let i=0; i<PARTICLE_COUNT; i++) {
    const t = Math.random() * Math.PI * 2;
    const r = Math.sqrt(Math.random());
    const k = 5;
    const radius = Math.cos(k * t) * r * 3;
    pos[i*3] = Math.cos(t) * radius;
    pos[i*3+1] = Math.sin(t) * radius;
    pos[i*3+2] = (Math.random() - 0.5) * 0.5;
  }
  return pos;
}

function getSaturn() {
  const pos = new Float32Array(PARTICLE_COUNT * 3);
  const sphereCount = Math.floor(PARTICLE_COUNT * 0.4);
  const ringCount = PARTICLE_COUNT - sphereCount;
  
  for(let i=0; i<sphereCount; i++) {
    const u = Math.random();
    const v = Math.random();
    const theta = u * 2.0 * Math.PI;
    const phi = Math.acos(2.0 * v - 1.0);
    const r = 1.5 * Math.cbrt(Math.random());
    pos[i*3] = r * Math.sin(phi) * Math.cos(theta);
    pos[i*3+1] = r * Math.sin(phi) * Math.sin(theta);
    pos[i*3+2] = r * Math.cos(phi);
  }
  
  for(let i=0; i<ringCount; i++) {
    const idx = sphereCount + i;
    const t = Math.random() * Math.PI * 2;
    const r = 2.0 + Math.random() * 1.5;
    pos[idx*3] = Math.cos(t) * r;
    pos[idx*3+1] = (Math.random() - 0.5) * 0.1;
    pos[idx*3+2] = Math.sin(t) * r;
  }
  
  for(let i=0; i<PARTICLE_COUNT; i++) {
    const y = pos[i*3+1];
    const z = pos[i*3+2];
    const angle = 0.4;
    pos[i*3+1] = y * Math.cos(angle) - z * Math.sin(angle);
    pos[i*3+2] = y * Math.sin(angle) + z * Math.cos(angle);
  }
  return pos;
}

function getBuddha() {
  const pos = new Float32Array(PARTICLE_COUNT * 3);
  const art = [
    "        ****        ",
    "       ******       ",
    "       ******       ",
    "        ****        ",
    "      ********      ",
    "     **********     ",
    "    ****    ****    ",
    "   ****      ****   ",
    "  ****        ****  ",
    "  ****        ****  ",
    " ******      ****** ",
    "********************",
    " ****************** ",
    "  ****************  "
  ];
  const w = art[0].length;
  const h = art.length;
  const validPoints = [];
  for(let y=0; y<h; y++) {
    for(let x=0; x<w; x++) {
      if(art[y][x] === '*') {
        validPoints.push({x: x - w/2, y: -(y - h/2)});
      }
    }
  }
  
  for(let i=0; i<PARTICLE_COUNT; i++) {
    const pt = validPoints[Math.floor(Math.random() * validPoints.length)];
    pos[i*3] = (pt.x + Math.random() - 0.5) * 0.3;
    pos[i*3+1] = (pt.y + Math.random() - 0.5) * 0.3;
    pos[i*3+2] = (Math.random() - 0.5) * 0.5;
  }
  return pos;
}

function getFireworks() {
  const pos = new Float32Array(PARTICLE_COUNT * 3);
  for(let i=0; i<PARTICLE_COUNT; i++) {
    const u = Math.random();
    const v = Math.random();
    const theta = u * 2.0 * Math.PI;
    const phi = Math.acos(2.0 * v - 1.0);
    const rType = Math.random();
    let r = 0;
    if (rType < 0.3) r = 1.0 + Math.random() * 0.2;
    else if (rType < 0.6) r = 2.0 + Math.random() * 0.2;
    else r = 3.0 + Math.random() * 0.2;
    
    if (Math.random() < 0.5) {
      r *= Math.random();
    }
    
    pos[i*3] = r * Math.sin(phi) * Math.cos(theta);
    pos[i*3+1] = r * Math.sin(phi) * Math.sin(theta);
    pos[i*3+2] = r * Math.cos(phi);
  }
  return pos;
}

const vertexShader = `
uniform float uTime;
uniform float uProgress;
uniform float uDispersion;
uniform float uScale;

attribute vec3 targetPosition;

varying vec3 vPos;

vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}

float snoise(vec3 v){ 
  const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
  const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);

  vec3 i  = floor(v + dot(v, C.yyy) );
  vec3 x0 = v - i + dot(i, C.xxx) ;

  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min( g.xyz, l.zxy );
  vec3 i2 = max( g.xyz, l.zxy );

  vec3 x1 = x0 - i1 + 1.0 * C.xxx;
  vec3 x2 = x0 - i2 + 2.0 * C.xxx;
  vec3 x3 = x0 - 1.0 + 3.0 * C.xxx;

  i = mod(i, 289.0 ); 
  vec4 p = permute( permute( permute( 
             i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
           + i.y + vec4(0.0, i1.y, i2.y, 1.0 )) 
           + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));

  float n_ = 1.0/7.0;
  vec3  ns = n_ * D.wyz - D.xzx;

  vec4 j = p - 49.0 * floor(p * ns.z *ns.z);

  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_ );

  vec4 x = x_ *ns.x + ns.yyyy;
  vec4 y = y_ *ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);

  vec4 b0 = vec4( x.xy, y.xy );
  vec4 b1 = vec4( x.zw, y.zw );

  vec4 s0 = floor(b0)*2.0 + 1.0;
  vec4 s1 = floor(b1)*2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));

  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;

  vec3 p0 = vec3(a0.xy,h.x);
  vec3 p1 = vec3(a0.zw,h.y);
  vec3 p2 = vec3(a1.xy,h.z);
  vec3 p3 = vec3(a1.zw,h.w);

  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;

  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), 
                                dot(p2,x2), dot(p3,x3) ) );
}

void main() {
  vec3 mixedPos = mix(position, targetPosition, uProgress);
  
  float noiseX = snoise(mixedPos * 2.0 + uTime * 0.5);
  float noiseY = snoise(mixedPos * 2.0 + uTime * 0.5 + 100.0);
  float noiseZ = snoise(mixedPos * 2.0 + uTime * 0.5 + 200.0);
  
  vec3 noiseVec = vec3(noiseX, noiseY, noiseZ);
  
  vec3 finalPos = mixedPos + noiseVec * uDispersion;
  finalPos *= uScale;
  
  vPos = finalPos;
  
  vec4 mvPosition = modelViewMatrix * vec4(finalPos, 1.0);
  gl_PointSize = (8.0 / -mvPosition.z);
  gl_Position = projectionMatrix * mvPosition;
}
`;

const fragmentShader = `
uniform vec3 uColor;
varying vec3 vPos;

void main() {
  float dist = length(gl_PointCoord - vec2(0.5));
  if (dist > 0.5) discard;
  
  float alpha = 1.0 - (dist * 2.0);
  vec3 finalColor = uColor + (vPos * 0.1);
  
  gl_FragColor = vec4(finalColor, alpha * 0.8);
}
`;

const loadScript = (src: string) => new Promise((resolve, reject) => {
  if (document.querySelector(`script[src="\${src}"]`)) {
    resolve(true);
    return;
  }
  const script = document.createElement('script');
  script.src = src;
  script.crossOrigin = 'anonymous';
  script.onload = resolve;
  script.onerror = reject;
  document.body.appendChild(script);
});

const ParticleSystem = ({ shape, color, dispersionRef, scaleRef }: any) => {
  const meshRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  
  const shapes = useMemo(() => ({
    heart: getHeart(),
    flower: getFlower(),
    saturn: getSaturn(),
    buddha: getBuddha(),
    fireworks: getFireworks()
  }), []);

  const currentShape = useRef(shape);
  const progress = useRef(1.0);

  useEffect(() => {
    if (currentShape.current !== shape && meshRef.current) {
      const geometry = meshRef.current.geometry;
      geometry.setAttribute('position', new THREE.BufferAttribute(shapes[currentShape.current as keyof typeof shapes], 3));
      geometry.setAttribute('targetPosition', new THREE.BufferAttribute(shapes[shape as keyof typeof shapes], 3));
      progress.current = 0.0;
      currentShape.current = shape;
    }
  }, [shape, shapes]);

  const initialPositions = shapes[shape as keyof typeof shapes];

  useFrame((state) => {
    if (progress.current < 1.0) {
      progress.current += 0.02;
      if (progress.current > 1.0) progress.current = 1.0;
    }
    
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
      materialRef.current.uniforms.uProgress.value = progress.current;
      
      const targetDispersion = dispersionRef.current;
      const targetScale = scaleRef.current;
      
      materialRef.current.uniforms.uDispersion.value += (targetDispersion - materialRef.current.uniforms.uDispersion.value) * 0.1;
      materialRef.current.uniforms.uScale.value += (targetScale - materialRef.current.uniforms.uScale.value) * 0.1;
      
      materialRef.current.uniforms.uColor.value.set(color);
    }
    
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.1;
      meshRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.2) * 0.1;
    }
  });

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uProgress: { value: 1 },
    uDispersion: { value: 0 },
    uScale: { value: 1 },
    uColor: { value: new THREE.Color(color) }
  }), [color]);

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={PARTICLE_COUNT}
          array={initialPositions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-targetPosition"
          count={PARTICLE_COUNT}
          array={initialPositions}
          itemSize={3}
        />
      </bufferGeometry>
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent={true}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};

const HandTracker = ({ dispersionRef, scaleRef, onStatusChange }: any) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    let camera: any = null;
    let hands: any = null;
    let isComponentMounted = true;

    const init = async () => {
      onStatusChange('loading');
      try {
        await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js');
        await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js');

        if (!isComponentMounted) return;

        hands = new window.Hands({
          locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
        });

        hands.setOptions({
          maxNumHands: 2,
          modelComplexity: 1,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5
        });

        hands.onResults((results: any) => {
          if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
            const landmarks1 = results.multiHandLandmarks[0];
            
            const dx = landmarks1[4].x - landmarks1[8].x;
            const dy = landmarks1[4].y - landmarks1[8].y;
            const dz = landmarks1[4].z - landmarks1[8].z;
            const pinchDist = Math.sqrt(dx*dx + dy*dy + dz*dz);
            
            let targetDispersion = (pinchDist - 0.05) * 15;
            targetDispersion = Math.max(0, Math.min(4, targetDispersion));
            dispersionRef.current = targetDispersion;

            if (results.multiHandLandmarks.length > 1) {
              const landmarks2 = results.multiHandLandmarks[1];
              const hdx = landmarks1[0].x - landmarks2[0].x;
              const hdy = landmarks1[0].y - landmarks2[0].y;
              const hdz = landmarks1[0].z - landmarks2[0].z;
              const handsDist = Math.sqrt(hdx*hdx + hdy*hdy + hdz*hdz);
              
              let targetScale = handsDist * 3;
              targetScale = Math.max(0.5, Math.min(3.0, targetScale));
              scaleRef.current = targetScale;
            } else {
              scaleRef.current += (1.0 - scaleRef.current) * 0.05;
            }
          } else {
            dispersionRef.current += (0 - dispersionRef.current) * 0.05;
            scaleRef.current += (1.0 - scaleRef.current) * 0.05;
          }
        });

        if (videoRef.current) {
          camera = new window.Camera(videoRef.current, {
            onFrame: async () => {
              if (videoRef.current && isComponentMounted) {
                await hands.send({ image: videoRef.current });
              }
            },
            width: 320,
            height: 240
          });

          await camera.start();
          if (isComponentMounted) onStatusChange('ready');
        }
      } catch (err) {
        console.error(err);
        if (isComponentMounted) onStatusChange('error');
      }
    };

    init();

    return () => {
      isComponentMounted = false;
      if (camera) camera.stop();
      if (hands) hands.close();
    };
  }, [dispersionRef, scaleRef, onStatusChange]);

  return (
    <div className="absolute top-4 right-4 md:top-auto md:bottom-6 md:right-6 z-50 pointer-events-auto">
      <div className="relative group">
        <video 
          ref={videoRef} 
          className="w-24 h-32 md:w-48 md:h-36 object-cover rounded-2xl md:rounded-3xl border border-white/20 shadow-2xl opacity-60 md:opacity-40 group-hover:opacity-100 transition-opacity transform scale-x-[-1] bg-black/50 backdrop-blur-md" 
          autoPlay 
          playsInline 
          muted 
        />
        <div className="absolute bottom-2 left-1 right-1 md:left-2 md:right-2 flex justify-center opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="bg-black/60 backdrop-blur-sm text-white/80 text-[8px] md:text-[10px] px-1.5 md:px-2 py-1 rounded-full flex items-center whitespace-nowrap">
            <CameraIcon className="w-2 h-2 md:w-3 md:h-3 mr-1" />
            识别中
          </div>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const [shape, setShape] = useState('heart');
  const [color, setColor] = useState('#ff3366');
  const [cameraStatus, setCameraStatus] = useState('initializing');
  
  const dispersionRef = useRef(0);
  const scaleRef = useRef(1);

  const shapes = [
    { id: 'heart', name: '心形', icon: Heart },
    { id: 'flower', name: '花朵', icon: Flower },
    { id: 'saturn', name: '土星', icon: CircleDot },
    { id: 'buddha', name: '佛像', icon: User },
    { id: 'fireworks', name: '烟花', icon: Sparkles },
  ];

  return (
    <div className="w-full h-[100dvh] bg-[#050505] text-white overflow-hidden relative font-sans">
      {/* 3D Canvas */}
      <div className="absolute inset-0 z-0">
        <Canvas camera={{ position: [0, 0, 5], fov: 60 }}>
          <ParticleSystem 
            shape={shape} 
            color={color} 
            dispersionRef={dispersionRef} 
            scaleRef={scaleRef} 
          />
        </Canvas>
      </div>

      {/* UI Overlay */}
      <div className="absolute top-0 left-0 w-full h-[100dvh] p-4 md:p-8 z-10 pointer-events-none flex flex-col justify-between">
        <div className="max-w-7xl mx-auto w-full flex flex-col md:flex-row justify-between h-full gap-4 md:gap-6">
          
          {/* Header */}
          <div className="pointer-events-auto shrink-0 w-2/3 md:w-auto">
            <h1 className="text-2xl md:text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/50 drop-shadow-lg">
              交互粒子系统
            </h1>
            <p className="hidden md:block text-white/50 mt-3 text-sm max-w-md leading-relaxed">
              通过摄像头检测手势：<br/>
              • 单手张合控制粒子扩散与聚拢<br/>
              • 双手距离控制粒子群整体缩放
            </p>
            
            <div className="mt-2 md:mt-5 inline-flex items-center px-3 py-1 md:px-4 md:py-1.5 rounded-full bg-black/40 md:bg-white/5 backdrop-blur-md border border-white/10 text-[10px] md:text-xs font-medium">
              <div className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full mr-1.5 md:mr-2 ${
                cameraStatus === 'ready' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 
                cameraStatus === 'error' ? 'bg-red-500' : 'bg-yellow-500 animate-pulse'
              }`} />
              {cameraStatus === 'ready' ? '摄像头已连接' : 
               cameraStatus === 'error' ? '摄像头连接失败' : '正在加载模型...'}
            </div>
          </div>

          {/* Controls Panel */}
          <div className="pointer-events-auto bg-black/40 backdrop-blur-2xl border border-white/10 p-4 md:p-6 rounded-3xl shadow-2xl w-full md:w-80 mt-auto">
            <div className="flex items-center mb-4 md:mb-6 pb-3 md:pb-4 border-b border-white/10">
              <Settings className="w-4 h-4 md:w-5 md:h-5 mr-2 md:mr-3 text-white/70" />
              <h2 className="text-sm md:text-lg font-medium tracking-wide">控制面板</h2>
            </div>

            {/* Shape Selector */}
            <div className="mb-6 md:mb-8">
              <label className="block text-[10px] md:text-xs font-semibold text-white/50 uppercase tracking-wider mb-3 md:mb-4">选择模板</label>
              <div className="grid grid-cols-5 gap-1.5 md:gap-2">
                {shapes.map((s) => {
                  const Icon = s.icon;
                  return (
                    <button
                      key={s.id}
                      onClick={() => setShape(s.id)}
                      className={`flex flex-col items-center justify-center p-2 md:p-3 rounded-xl md:rounded-2xl transition-all duration-300 ${
                        shape === s.id 
                          ? 'bg-white/20 text-white shadow-inner scale-105' 
                          : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/80 hover:scale-105'
                      }`}
                      title={s.name}
                    >
                      <Icon className="w-4 h-4 md:w-5 md:h-5 mb-1 md:mb-1.5" strokeWidth={shape === s.id ? 2.5 : 2} />
                      <span className="text-[9px] md:text-[10px] font-medium">{s.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Color Picker */}
            <div>
              <label className="block text-[10px] md:text-xs font-semibold text-white/50 uppercase tracking-wider mb-3 md:mb-4">粒子颜色</label>
              <div className="flex items-center space-x-3 md:space-x-4 bg-white/5 p-1.5 md:p-2 rounded-xl md:rounded-2xl border border-white/5">
                <div className="relative w-8 h-8 md:w-10 md:h-10 rounded-full overflow-hidden border-2 border-white/20 shadow-inner shrink-0">
                  <input 
                    type="color" 
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="absolute -top-2 -left-2 w-12 h-12 md:w-16 md:h-16 cursor-pointer"
                  />
                </div>
                <div className="flex-1 font-mono text-xs md:text-sm text-white/80 tracking-wider">
                  {color.toUpperCase()}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hand Tracker Video */}
      <HandTracker 
        dispersionRef={dispersionRef} 
        scaleRef={scaleRef} 
        onStatusChange={setCameraStatus} 
      />
    </div>
  );
}
