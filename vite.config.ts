import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'; // ১. প্লাগইনটি ইম্পোর্ট করুন
// https://vite.dev/config/
export default defineConfig({
 plugins: [react(), viteSingleFile()], // ২. প্লাগইনটি এখানে যুক্ত করুন
  base: './',
})
