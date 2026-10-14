import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { EXRLoader } from "three/addons/loaders/EXRLoader.js";

import './style.css'


document.addEventListener('DOMContentLoaded', () => {
	new WebXRWalkthrough();
})

class WebXRWalkthrough {

	private Scene: THREE.Scene;
	private Camera: THREE.PerspectiveCamera;
	private Renderer: THREE.WebGLRenderer;
	private Timer: THREE.Timer;
	private LoadingManager: THREE.LoadingManager;
	private BaseUrl: string;
	private MoveSpeed: number = 1.2;
	private keys: { [key: string]: boolean } = {};

	constructor() {
		
		this.BaseUrl = `${import.meta.env.BASE_URL}`
		this.SetupLoadingManager();

		this.SetupScene();
		this.SetupCamera();
		this.SetupRenderer();
		this.SetupResizeHandler();

		this.CreateHDRILighting();
		this.CreateFloor();
		this.CreateSceneObjects();

		this.SetupRenderTimer();
		this.SetupKeyboardMovement();
	}

	SetupScene() : void {
		this.Scene = new THREE.Scene();
	}

	SetupCamera() : void {
		const aspectRatio: number = window.innerWidth / window.innerHeight;		

		this.Camera = new THREE.PerspectiveCamera(40, // field of view
												aspectRatio, // aspect ratio 
												0.1, // near view distance 
												2000); // far view distance

												

		this.Camera.position.set(0, 1.5, 5);
		
	}

	SetupLoadingManager(): void {
		this.LoadingManager = new THREE.LoadingManager();

		this.LoadingManager.onError = function (url) {
			console.warn('There was an error loading ' + url );
		};
	}

	SetupRenderer() : void {
		const canvas: HTMLCanvasElement = document.querySelector<HTMLCanvasElement>('.js-displaycanvas')!;
		this.Renderer = new THREE.WebGLRenderer({canvas: canvas});
		this.Renderer.setSize(window.innerWidth, window.innerHeight);

		this.Renderer.outputColorSpace = THREE.SRGBColorSpace;
	}

	SetupResizeHandler() : void {
		
		window.addEventListener('resize', () => {

			const aspectRatio: number = window.innerWidth / window.innerHeight;			
			this.Camera.aspect =  aspectRatio;
			this.Camera.updateProjectionMatrix();

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
				this.Camera.position.z = this.Camera.position.z - (amountToMove);
			}

			if (this.keys['S'] || this.keys['s']) {
				this.Camera.position.z = this.Camera.position.z + (amountToMove);
			}

			if (this.keys['D'] || this.keys['d']) {
				this.Camera.position.x = this.Camera.position.x + (amountToMove);
			}

			if (this.keys['A'] || this.keys['a']) {
				this.Camera.position.x = this.Camera.position.x - (amountToMove);
			}

			this.Renderer.render(this.Scene, this.Camera);
		})
	}

	AnimateLoop() : void {
		this.Renderer.render(this.Scene, this.Camera);
	}

	CreateHDRILighting() : void {
		const hdriUrl = `${this.BaseUrl}resources/DayEnvironmentHDRI066_2K_HDR.exr`;

		const exrLoader: EXRLoader = new EXRLoader(this.LoadingManager);

		exrLoader.load(hdriUrl, (hdriTexture: THREE.DataTexture) => {
			hdriTexture.mapping = THREE.EquirectangularReflectionMapping;

			this.Scene.environment = hdriTexture;
			//this.Scene.background = hdriTexture;
		})

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

			 console.log('scene children:', gltf.scene.children);
    
    gltf.scene.traverse((child) => {
        console.log(child.name, child.type, child);
    });
	
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

			this.Scene.add(model);		
		} ));
	}
}