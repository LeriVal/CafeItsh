import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    setupFiles: ['./tests/setup.ts'],
    testTimeout: 15000,
    // Los tests de integración comparten un solo MySQL: archivos en serie para
    // que las mutaciones globales (admins, disponibilidad) de uno no
    // interfieran con otro. Cada archivo limpia lo suyo en afterAll.
    fileParallelism: false,
  },
})
