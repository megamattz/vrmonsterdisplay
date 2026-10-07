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

	constructor() {
		
		this.SetupScene();
		this.SetupCamera();
		this.SetupRenderer();

		this.SetupResizeHandler();

		this.CreateHDRILighting();

		this.CreateSceneObjects();

		this.SetupRenderTimer();
	}

	SetupScene() : void {
		this.Scene = new THREE.Scene();
	}

	SetupCamera() : void {
		const aspectRatio: number = window.innerWidth / window.innerHeight;

		this.Camera = new THREE.PerspectiveCamera(75, // field of view
												aspectRatio, // aspect ratio 
												1, // near view distance 
												2000); // far view distance
	}

	SetupRenderer() : void {
		const canvas: HTMLCanvasElement = document.querySelector<HTMLCanvasElement>('.js-displaycanvas')!;
		this.Renderer = new THREE.WebGLRenderer({canvas: canvas});
		this.Renderer.setSize(window.innerWidth, window.innerHeight);
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

		this.Timer.connect(document); // PAuse when document is hidden

		this.Renderer.setAnimationLoop((timestamp) => {
			this.Timer.update(timestamp);

			//const deltaTime = this.Timer.getDelta();
			this.Renderer.render(this.Scene, this.Camera);
		})
	}

	AnimateLoop() : void {
		this.Renderer.render(this.Scene, this.Camera);
	}

	CreateHDRILighting() : void {
		const hdriUrl = `${import.meta.env.BASE_URL}resources/DayEnvironmentHDRI066_2K_HDR.exr`;

		const exrLoader: EXRLoader = new EXRLoader();
		exrLoader.load(hdriUrl, (hdriTexture: THREE.DataTexture) => {
			hdriTexture.mapping = THREE.EquirectangularReflectionMapping;

			this.Scene.environment = hdriTexture;
			this.Scene.background = hdriTexture;
		})

	}

	CreateSceneObjects() : void {

		const loadingManager: THREE.LoadingManager = new THREE.LoadingManager();

		loadingManager.onError = ((url) => {
  			console.error('failed to load ' + url);
		});

		const gltfLoader: GLTFLoader = new GLTFLoader(loadingManager);

		const modelUrl = `${import.meta.env.BASE_URL}resources/4LeggedCreatureExportWithEyes.glb`;

		gltfLoader.load(modelUrl, ((gltf) => {
			this.Scene.add(gltf.scene);
		} ));
	}
}