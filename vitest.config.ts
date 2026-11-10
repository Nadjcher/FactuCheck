import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    globals: false,
    // Les tests d'intégration lancent le Schematron (node-schematron, lent) ;
    // sous charge parallèle, le défaut de 5 s est insuffisant.
    testTimeout: 30000,
    // Isolation par processus (les tests de services modifient process.env).
    pool: "forks",
    isolate: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
