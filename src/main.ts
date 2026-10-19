import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { EXRLoader } from "three/addons/loaders/EXRLoader.js";
import { VRButton } from 'three/addons/webxr/VRButton.js';

import './style.css'


document.addEventListener('DOMContentLoaded', () => {
	new WebXRWalkthrough();
})

class WebXRWalkthrough {

	private Scene: THREE.Scene;
	private DesktopCamera: THREE.PerspectiveCamera;
	private VRCamera: THREE.PerspectiveCamera;
	private Renderer: THREE.WebGLRenderer;
	private Timer: THREE.Timer;
	private LoadingManager: THREE.LoadingManager;
	private BaseUrl: string;
	private MoveSpeed: number = 1.2;
	private keys: { [key: string]: boolean } = {};
	private CameraRig: THREE.Group;

	constructor() {
		
		this.BaseUrl = `${import.meta.env.BASE_URL}`
		this.SetupLoadingManager();

		this.SetupScene();

		this.SetupDesktopCamera();
		this.SetupVRCamera();

		this.SetupRenderer();
		this.SetupResizeHandler();

		this.CreateHDRILighting();
		this.CreateDirectionalLight();

		this.CreateFloor();
		this.CreateSceneObjects();

		this.SetupXR();

		this.SetupRenderTimer();
		this.SetupKeyboardMovement();
	}

	SetupScene() : void {
		this.Scene = new THREE.Scene();
	}

	SetupDesktopCamera() : void {
		const aspectRatio: number = window.innerWidth / window.innerHeight;		

		this.DesktopCamera = new THREE.PerspectiveCamera(40, // field of view
												aspectRatio, // aspect ratio 
												0.1, // near view distance 
												2000); // far view distance

												

		this.DesktopCamera.position.set(0, 1.5, 5);
		
	}

	SetupVRCamera() : void {

		const aspectRatio: number = window.innerWidth / window.innerHeight;		

		this.VRCamera = new THREE.PerspectiveCamera(40, // field of view
												aspectRatio, // aspect ratio 
												0.1, // near view distance 
												2000); // far view distance

												

		this.DesktopCamera.position.set(0, 1.5, 5);
		
	}

	EnableShadows() : void {

		this.Scene.traverse((child : THREE.Object3D<THREE.Object3DEventMap>) => {	

					if (child instanceof THREE.Mesh) {

						child.receiveShadow = true;
						child.castShadow = true;
					}
				});
	}

	SetupLoadingManager(): void {
		this.LoadingManager = new THREE.LoadingManager();

		this.LoadingManager.onError = function (url) {
			console.warn('There was an error loading ' + url );
		}

		this.LoadingManager.onLoad = () => {
			this.EnableShadows();
		}
	}

	SetupRenderer() : void {
		const canvas: HTMLCanvasElement = document.querySelector<HTMLCanvasElement>('.js-displaycanvas')!;
		this.Renderer = new THREE.WebGLRenderer({canvas: canvas});
		this.Renderer.setSize(window.innerWidth, window.innerHeight);

		this.Renderer.shadowMap.enabled = true;
		this.Renderer.shadowMap.type = THREE.PCFShadowMap;

		this.Renderer.outputColorSpace = THREE.SRGBColorSpace;
	}

	SetupResizeHandler() : void {
		
		window.addEventListener('resize', () => {

			const aspectRatio: number = window.innerWidth / window.innerHeight;			
			this.DesktopCamera.aspect =  aspectRatio;
			this.DesktopCamera.updateProjectionMatrix();

			this.Renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
			this.Renderer.setSize(window.innerWidth, window.innerHeight);

		});
	}

	SetupRenderTimer() : void {
		this.Timer = new THREE.Timer();

		this.Timer.connect(document); // Pause when document is hidden

		this.Renderer.setAnimationLoop((timestamp) => {
			this.Timer.update(timestamp);

			const deltaTime = this.Timer.getDelta();

			const amountToMove = this.MoveSpeed * deltaTime;

			if (this.keys['w'] || this.keys['W']) {
				this.DesktopCamera.position.z = this.DesktopCamera.position.z - (amountToMove);
			}

			if (this.keys['S'] || this.keys['s']) {
				this.DesktopCamera.position.z = this.DesktopCamera.position.z + (amountToMove);
			}

			if (this.keys['D'] || this.keys['d']) {
				this.DesktopCamera.position.x = this.DesktopCamera.position.x + (amountToMove);
			}

			if (this.keys['A'] || this.keys['a']) {
				this.DesktopCamera.position.x = this.DesktopCamera.position.x - (amountToMove);
			}

			// VR Mode uses a different camera so it can keep a different position
			if (this.Renderer.xr.isPresenting) {
				this.Renderer.render(this.Scene, this.VRCamera);
			}
			else
			{
				this.Renderer.render(this.Scene, this.DesktopCamera);
			}
			
		})
	}

	AnimateLoop() : void {
		this.Renderer.render(this.Scene, this.DesktopCamera);
	}

	CreateHDRILighting() : void {
		const hdriUrl = `${this.BaseUrl}resources/DayEnvironmentHDRI066_2K_HDR.exr`;

		const exrLoader: EXRLoader = new EXRLoader(this.LoadingManager);

		exrLoader.load(hdriUrl, (hdriTexture: THREE.DataTexture) => {
			hdriTexture.mapping = THREE.EquirectangularReflectionMapping;

			this.Scene.environment = hdriTexture;
			this.Scene.environmentIntensity = 0.1;

			//this.Scene.background = hdriTexture;
		})

	}

	CreateDirectionalLight() : void {
		const directionalLight : THREE.DirectionalLight = new THREE.DirectionalLight(0xFFFFFF, 2);

		directionalLight.position.set(-8, 10, 4); // Left Side

		directionalLight.castShadow = true;
		directionalLight.shadow.bias = -0.0005; // Needed to avoid artifacts with shadows casting on themself

		directionalLight.target.position.set(0, 0, 0); // Point towards the monster
		this.Scene.add(directionalLight.target);   // required so the target is updated

		this.Scene.add(directionalLight);
	}

	SetupKeyboardMovement() : void {
		 window.addEventListener('keydown', (e : KeyboardEvent) => {
        	this.keys[e.key] = true;
		 });

		 window.addEventListener('keyup', (e : KeyboardEvent) => {
			this.keys[e.key] = false;
		 });
	}

	CreateFloor() : void {			

		const gltfLoader: GLTFLoader = new GLTFLoader(this.LoadingManager);

		const floorUrl = `${this.BaseUrl}resources/floor/circle.glb`;

		gltfLoader.load(floorUrl, (gltf) => {

			const floorMesh = gltf.scene.children[0] as THREE.Mesh;
		
			this.Scene.add(floorMesh);

		});
	}

	CreateSceneObjects() : void {

		const gltfLoader: GLTFLoader = new GLTFLoader(this.LoadingManager);

		const modelUrl = `${this.BaseUrl}resources/creature/4LeggedCreatureExportWithEyes.glb`;

		gltfLoader.load(modelUrl, ((gltf) => {
    
			const scale : number = 0.5;
			const sinkAmount = -0.2; // how far into the floor. Better to be slightly into the floor rather then over it

			// ----- Load the monster ---------------
			// This includes 2 models Monster + the eyes which are separate
			const model : THREE.Group = gltf.scene as THREE.Group;

			model.scale.set(scale, scale, scale);
			model.updateMatrixWorld(true); // Apply the scale

			// Create a bounding box around the monster
			const box = new THREE.Box3().setFromObject(model);

			// Place the monster on the floor
			model.position.y = -box.min.y + sinkAmount;

			model.castShadow = true;

			this.Scene.add(model);		
		} ));
	}

	SetupXR() : void {

		this.Renderer.xr.enabled = true;

		document.body.appendChild(VRButton.createButton(this.Renderer));

		// Create a rig which will control the camera position
		this.CameraRig = new THREE.Group();
		this.CameraRig.add(this.VRCamera);
		this.Scene.add(this.CameraRig);

		this.Renderer.xr.addEventListener('sessionstart', () => {
			this.VRSessionStart();
		});

		this.Renderer.xr.addEventListener('sessionend', () => {
			this.VRSessionEnd();
		});
	}

	VRSessionStart() : void {
		console.log('VR Starting')

		// Initial VR Camera position set something that looks good initially
		this.CameraRig.position.set(-1, 1, 1);

		// Rotate so it's facing the create initially
		this.CameraRig.rotation.y = Math.PI; 
	}

	VRSessionEnd() : void {

		console.log('VR Ending')
	}
}