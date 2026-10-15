import { defineConfig } from 'vite'
import basicSsl from '@vitejs/plugin-basic-ssl'

export default defineConfig({
  // Your custom configuration options go here later
	base: './',

	plugins: [
		basicSsl()
   ],
	server: {
		https: true,
		host: true,
		port: 9999
   },
	css: { 
		devSourcemap: true 
	}, 
	build: { 
		sourcemap: true 
	}
})