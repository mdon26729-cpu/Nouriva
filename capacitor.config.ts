import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: "com.nouriva.app",
  appName: "Nouriva",
  webDir: "capacitor-web",
  server: {
    url: "https://nouriva-sigma.vercel.app",
    cleartext: false,
  },
};

export default config;
