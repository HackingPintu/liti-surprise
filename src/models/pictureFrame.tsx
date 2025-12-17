// import { useLoader, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
// import type { ThreeElements } from "@react-three/fiber";
// import { useEffect, useMemo, useState, useRef, useCallback } from "react";
// import { useTexture, useCursor } from "@react-three/drei";
// import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
// import {
//   Box3,
//   MeshStandardMaterial,
//   SRGBColorSpace,
//   Vector3,
//   DoubleSide,
//   Group,
//   Quaternion,
//   Euler
// } from "three";

// type PictureFrameProps = ThreeElements["group"] & {
//   id: string; 
//   image: string;
//   isActive: boolean;
//   onToggle: (id: string) => void;
//   imageScale?: number | [number, number];
//   imageOffset?: [number, number, number];
//   scale?: number;
// };

// const DEFAULT_IMAGE_SCALE: [number, number] = [0.82, 0.82];
// const CAMERA_DISTANCE = 2.5; 
// const CAMERA_Y_FLOOR = 0.8;

// export function PictureFrame({
//   id,
//   image,
//   isActive,
//   onToggle,
//   imageScale = DEFAULT_IMAGE_SCALE,
//   imageOffset,
//   scale = 1,
//   position, 
//   rotation,
//   children,
//   ...groupProps
// }: PictureFrameProps) {
//   const { gl, camera } = useThree();
//   const groupRef = useRef<Group>(null);
//   const [hovered, setHovered] = useState(false);

//   useCursor(hovered || isActive, "pointer");

//   const gltf = useLoader(GLTFLoader, "/picture_frame.glb");
//   const pictureTexture = useTexture(image);

//   useEffect(() => {
//     pictureTexture.colorSpace = SRGBColorSpace;
//     pictureTexture.anisotropy = gl.capabilities.getMaxAnisotropy();
//   }, [pictureTexture, gl]);

//   const frameScene = useMemo(() => gltf.scene.clone(true), [gltf.scene]);

//   const { frameSize, frameCenter } = useMemo(() => {
//     const box = new Box3().setFromObject(frameScene);
//     const size = new Vector3();
//     const center = new Vector3();
//     box.getSize(size);
//     box.getCenter(center);
//     return { frameSize: size, frameCenter: center };
//   }, [frameScene]);

//   const scaledImage = useMemo<[number, number]>(() => {
//     return Array.isArray(imageScale) ? imageScale : [imageScale, imageScale];
//   }, [imageScale]);
  
//   const [imageWidth, imageHeight] = [
//     frameSize.x * scaledImage[0], 
//     frameSize.y * scaledImage[1]
//   ];

//   const [offsetX, offsetY, offsetZ] = imageOffset ?? [0, 0.05, -0.27];
  
//   const imagePosition: [number, number, number] = [
//     frameCenter.x + offsetX,
//     frameCenter.y + offsetY,
//     frameCenter.z + offsetZ,
//   ];

//   const pictureMaterial = useMemo(
//     () => new MeshStandardMaterial({
//         map: pictureTexture,
//         roughness: 0.08,
//         metalness: 0,
//         side: DoubleSide,
//       }),
//     [pictureTexture]
//   );

//   useEffect(() => {
//     return () => pictureMaterial.dispose();
//   }, [pictureMaterial]);

//   // ANIMATION LOGIC
//   const defaultPosition = useMemo(() => new Vector3(...(position as [number,number,number] || [0,0,0])), [position]);
//   const defaultQuaternion = useMemo(() => {
//     const euler = new Euler(...(rotation as [number,number,number] || [0,0,0]));
//     return new Quaternion().setFromEuler(euler);
//   }, [rotation]);

//   useEffect(() => {
//     if (groupRef.current) {
//         groupRef.current.position.copy(defaultPosition);
//         groupRef.current.quaternion.copy(defaultQuaternion);
//     }
//   }, [defaultPosition, defaultQuaternion]);

//   useEffect(() => {
//     if (!isActive) setHovered(false);
//   }, [isActive]);

//   const tmpPosition = useMemo(() => new Vector3(), []);
//   const tmpQuaternion = useMemo(() => new Quaternion(), []);
//   const tmpDirection = useMemo(() => new Vector3(), []);
//   const cameraOffset = useMemo(() => new Vector3(0, -0.2, 0), []); 
  
//   // Create a reusable rotation for 180 degree turn
//   const rotate180 = useMemo(() => new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), Math.PI), []);

//   useFrame((_, delta) => {
//     const group = groupRef.current;
//     if (!group) return;

//     const positionTarget = tmpPosition;
//     const rotationTarget = tmpQuaternion;

//     if (isActive) {
//       positionTarget.copy(camera.position);
//       positionTarget.add(
//         tmpDirection
//           .copy(camera.getWorldDirection(tmpDirection))
//           .multiplyScalar(CAMERA_DISTANCE)
//       );
//       positionTarget.add(cameraOffset);
//       if (positionTarget.y < CAMERA_Y_FLOOR) positionTarget.y = CAMERA_Y_FLOOR;

//       // --- THE FIX IS HERE ---
//       // 1. Copy camera rotation (faces away from user)
//       rotationTarget.copy(camera.quaternion);
//       // 2. Rotate 180 degrees on Y axis (faces user)
//       rotationTarget.multiply(rotate180);
      
//     } else {
//       positionTarget.copy(defaultPosition);
//       rotationTarget.copy(defaultQuaternion);
//     }

//     const lerpAlpha = 1 - Math.exp(-delta * 8); 
//     group.position.lerp(positionTarget, lerpAlpha);
//     group.quaternion.slerp(rotationTarget, lerpAlpha);

//     const baseScale = Number(scale) || 1;
//     const targetScale = (hovered && !isActive) ? baseScale * 1.1 : baseScale;
//     group.scale.lerp(new Vector3(targetScale, targetScale, targetScale), lerpAlpha);
//   });

//   const handleClick = useCallback((e: ThreeEvent<MouseEvent>) => {
//     e.stopPropagation();
//     onToggle(id);
//   }, [id, onToggle]);

//   const handlePointerOver = useCallback((e: ThreeEvent<PointerEvent>) => {
//     e.stopPropagation();
//     if (!isActive) setHovered(true);
//   }, [isActive]);

//   const handlePointerOut = useCallback((e: ThreeEvent<PointerEvent>) => {
//     e.stopPropagation();
//     setHovered(false);
//   }, []);

//   return (
//     <group 
//       ref={groupRef}
//       onClick={handleClick}
//       onPointerOver={handlePointerOver}
//       onPointerOut={handlePointerOut}
//       {...groupProps}
//     >
//       <group rotation={[0.04, 0, 0]}>
//         <primitive object={frameScene} />
//         <mesh position={imagePosition} rotation={[0.435, Math.PI, 0]} material={pictureMaterial}>
//           <planeGeometry args={[imageWidth, imageHeight]} />
//         </mesh>
//         {children}
//       </group>
//     </group>
//   );
// }
import { useLoader, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import type { ThreeElements } from "@react-three/fiber";
import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { useTexture, useCursor } from "@react-three/drei";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import {
  Box3,
  MeshStandardMaterial,
  SRGBColorSpace,
  Vector3,
  DoubleSide,
  Group,
  Quaternion,
  Euler,
  Mesh
} from "three";

type PictureFrameProps = ThreeElements["group"] & {
  id: string; 
  image: string;
  isActive: boolean;
  onToggle: (id: string) => void;
  imageScale?: number | [number, number];
  imageOffset?: [number, number, number];
  scale?: number;
};

const DEFAULT_IMAGE_SCALE: [number, number] = [0.82, 0.82];
const CAMERA_DISTANCE = 2.5; 
// Removed floor clamp constant to prevent clipping when looking down
// const CAMERA_Y_FLOOR = 0.8; 

export function PictureFrame({
  id,
  image,
  isActive,
  onToggle,
  imageScale = DEFAULT_IMAGE_SCALE,
  imageOffset,
  scale = 1,
  position, 
  rotation,
  children,
  ...groupProps
}: PictureFrameProps) {
  const { gl, camera } = useThree();
  const groupRef = useRef<Group>(null);
  const [hovered, setHovered] = useState(false);

  useCursor(hovered || isActive, "pointer");

  const gltf = useLoader(GLTFLoader, "/picture_frame.glb");
  const pictureTexture = useTexture(image);

  useEffect(() => {
    pictureTexture.colorSpace = SRGBColorSpace;
    pictureTexture.anisotropy = gl.capabilities.getMaxAnisotropy();
  }, [pictureTexture, gl]);

  // Clone scene so we can reuse the asset multiple times
  const frameScene = useMemo(() => gltf.scene.clone(true), [gltf.scene]);

  // --- TRAVERSE TO FIX MATERIAL OBSTRUCTION ---
  // The frame is a GLB model. To make it render "on top" of the cake,
  // we must manually tell its internal materials to ignore depth testing.
  useEffect(() => {
    frameScene.traverse((child) => {
      if ((child as Mesh).isMesh) {
        const mesh = child as Mesh;
        // Handle both single material and arrays of materials
        const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        
        materials.forEach((mat) => {
          // If active, ignore depth (draw on top). If not, respect depth (draw normally).
          mat.depthTest = !isActive;
          mat.depthWrite = !isActive;
          // Ensure we update the material needsUpdate flag so Three.js picks up the change
          mat.needsUpdate = true;
        });
      }
    });
  }, [isActive, frameScene]);

  const { frameSize, frameCenter } = useMemo(() => {
    const box = new Box3().setFromObject(frameScene);
    const size = new Vector3();
    const center = new Vector3();
    box.getSize(size);
    box.getCenter(center);
    return { frameSize: size, frameCenter: center };
  }, [frameScene]);

  const scaledImage = useMemo<[number, number]>(() => {
    return Array.isArray(imageScale) ? imageScale : [imageScale, imageScale];
  }, [imageScale]);
  
  const [imageWidth, imageHeight] = [
    frameSize.x * scaledImage[0], 
    frameSize.y * scaledImage[1]
  ];

  const [offsetX, offsetY, offsetZ] = imageOffset ?? [0, 0.05, -0.27];
  
  const imagePosition: [number, number, number] = [
    frameCenter.x + offsetX,
    frameCenter.y + offsetY,
    frameCenter.z + offsetZ,
  ];

  // --- PHOTO MATERIAL SETUP ---
  const pictureMaterial = useMemo(
    () => new MeshStandardMaterial({
        map: pictureTexture,
        roughness: 0.08,
        metalness: 0,
        side: DoubleSide,
        // These will be updated dynamically via the props on the mesh below, 
        // but setting defaults here is good practice.
      }),
    [pictureTexture]
  );

  useEffect(() => {
    return () => pictureMaterial.dispose();
  }, [pictureMaterial]);

  // --- ANIMATION LOGIC ---
  const defaultPosition = useMemo(() => new Vector3(...(position as [number,number,number] || [0,0,0])), [position]);
  const defaultQuaternion = useMemo(() => {
    const euler = new Euler(...(rotation as [number,number,number] || [0,0,0]));
    return new Quaternion().setFromEuler(euler);
  }, [rotation]);

  useEffect(() => {
    if (groupRef.current) {
        // Only force reset if NOT active, otherwise we interrupt animation
        if (!isActive) {
           groupRef.current.position.copy(defaultPosition);
           groupRef.current.quaternion.copy(defaultQuaternion);
        }
    }
  }, [defaultPosition, defaultQuaternion, isActive]);

  useEffect(() => {
    if (!isActive) setHovered(false);
  }, [isActive]);

  const tmpPosition = useMemo(() => new Vector3(), []);
  const tmpQuaternion = useMemo(() => new Quaternion(), []);
  const tmpDirection = useMemo(() => new Vector3(), []);
  const cameraOffset = useMemo(() => new Vector3(0, -0.2, 0), []); 
  
  const rotate180 = useMemo(() => new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), Math.PI), []);

  useFrame((_, delta) => {
    const group = groupRef.current;
    if (!group) return;

    const positionTarget = tmpPosition;
    const rotationTarget = tmpQuaternion;

    if (isActive) {
      // 1. Calculate Target in WORLD SPACE
      positionTarget.copy(camera.position);
      positionTarget.add(
        tmpDirection
          .copy(camera.getWorldDirection(tmpDirection))
          .multiplyScalar(CAMERA_DISTANCE)
      );
      positionTarget.add(cameraOffset);

      // --- CRITICAL FIX: CONVERT WORLD TO LOCAL ---
      // If the frame is inside a <Table> or other group, "positionTarget" (which is world space)
      // will be interpreted as local space, sending the frame far away.
      if (group.parent) {
         group.parent.worldToLocal(positionTarget);
      }

      // 2. Rotation Logic
      rotationTarget.copy(camera.quaternion);
      rotationTarget.multiply(rotate180);

      // Handle Parent Rotation for Quaternion as well
      if (group.parent) {
          const parentWorldQuat = new Quaternion();
          group.parent.getWorldQuaternion(parentWorldQuat);
          rotationTarget.premultiply(parentWorldQuat.invert());
      }
      
    } else {
      positionTarget.copy(defaultPosition);
      rotationTarget.copy(defaultQuaternion);
    }

    const lerpAlpha = 1 - Math.exp(-delta * 8); 
    group.position.lerp(positionTarget, lerpAlpha);
    group.quaternion.slerp(rotationTarget, lerpAlpha);

    const baseScale = Number(scale) || 1;
    const targetScale = (hovered && !isActive) ? baseScale * 1.1 : baseScale;
    group.scale.lerp(new Vector3(targetScale, targetScale, targetScale), lerpAlpha);
  });

  const handleClick = useCallback((e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    onToggle(id);
  }, [id, onToggle]);

  const handlePointerOver = useCallback((e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    if (!isActive) setHovered(true);
  }, [isActive]);

  const handlePointerOut = useCallback((e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setHovered(false);
  }, []);

  // RENDER CONFIG
  const renderOrder = isActive ? 100 : 0;
  const depthTest = !isActive;

  return (
    <group 
      ref={groupRef}
      onClick={handleClick}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
      renderOrder={renderOrder} // Draw this group LAST
      {...groupProps}
    >
      <group rotation={[0.04, 0, 0]}>
        {/* The Frame GLB */}
        <primitive object={frameScene} />
        
        {/* The Photo Plane */}
        <mesh 
            position={imagePosition} 
            rotation={[0.435, Math.PI, 0]} 
            // We can't just pass 'material={pictureMaterial}' here because 
            // we need to inject the depthTest prop dynamically.
        >
          <planeGeometry args={[imageWidth, imageHeight]} />
          <meshStandardMaterial 
            map={pictureTexture}
            roughness={0.08}
            metalness={0}
            side={DoubleSide}
            depthTest={depthTest}   // Disable depth test when active
            depthWrite={depthTest}  // Disable writing to depth buffer
          />
        </mesh>
        {children}
      </group>
    </group>
  );
}