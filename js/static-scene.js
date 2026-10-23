import * as T from 'three';
import {mergeGeometries} from 'three/addons/BufferGeometryUtils.js';
// The scenery stays still while NPCs move. Batch only opaque, visible scenery;
// picking surfaces, selection rings, transparent water and HTML markers stay separate.
export function batchScenery(scene){
 scene.updateMatrixWorld(true);const buckets=new Map();
 scene.traverse(o=>{if(!o.isMesh||!o.visible||Array.isArray(o.material)||o.material.visible===false||o.material.transparent)return;const key=o.material.uuid+Object.keys(o.geometry.attributes).sort().join(',')+Boolean(o.geometry.index);if(!buckets.has(key))buckets.set(key,[]);buckets.get(key).push(o);});
 for(const meshes of buckets.values()){if(meshes.length<3)continue;const geometries=meshes.map(m=>m.geometry.clone().applyMatrix4(m.matrixWorld));const geometry=mergeGeometries(geometries,false);if(!geometry)continue;const merged=new T.Mesh(geometry,meshes[0].material);merged.castShadow=meshes.some(m=>m.castShadow);merged.receiveShadow=true;scene.add(merged);meshes.forEach(m=>m.removeFromParent());geometries.forEach(g=>g.dispose());}
}
