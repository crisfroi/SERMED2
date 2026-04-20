export default {
  preset: "ts-jest",
  testEnvironment: "jsdom",
  roots: ["<rootDir>/src", "<rootDir>/tests", "<rootDir>/packages/hosix/src"],
  testMatch: ["**/__tests__/**/*.ts?(x)", "**/?(*.)+(spec|test).ts?(x)"],
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "^@hosix/(.*)$": "<rootDir>/packages/hosix/src/$1",
    "^@sermed2/shared$": "<rootDir>/packages/shared/src/index.ts",
    "\\.(css|less|scss|sass)$": "identity-obj-proxy",
  },
  setupFilesAfterEnv: ["<rootDir>/tests/setup.ts"],
  collectCoverageFrom: [
    "src/**/*.{ts,tsx}",
    "packages/hosix/src/**/*.{ts,tsx}",
    "!src/**/*.d.ts",
    "!src/main.tsx",
    "!src/index.tsx",
    "!packages/hosix/src/**/*.d.ts",
  ],
  coverageThreshold: {
    "./src/hooks/": {
      branches: 75,
      functions: 80,
      lines: 80,
      statements: 80,
    },
    "./src/components/": {
      branches: 70,
      functions: 75,
      lines: 75,
      statements: 75,
    },
  },
  transform: {
    "^.+\\.tsx?$": ["ts-jest", {
      tsconfig: {
        jsx: "react-jsx",
        esModuleInterop: true,
      },
    }],
  },
};
