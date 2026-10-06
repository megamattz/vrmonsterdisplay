import * as THREE from 'three';
import './style.css'

document.addEventListener('DOMContentLoaded', () => {
	new WebXRWalkthrough();
})

class WebXRWalkthrough {

	private Scene: THREE.Scene;
	private Camera: THREE.Camera;
	private Renderer: THREE.WebGLRenderer;

	constructor() {
		
		this.SetupScene();
		this.SetupCamera();
		this.SetupRenderer();

		this.AnimateLoop();
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

	AnimateLoop() : void {
		this.Renderer.render(this.Scene, this.Camera);
	}
}