import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.13d652b2f19f4b5f9528251cdec00174',
  appName: 'findwhosabi',
  webDir: 'dist',
  // server: {
  //   url: 'https://13d652b2-f19f-4b5f-9528-251cdec00174.lovableproject.com?forceHideBadge=true',
  //   cleartext: true
  // },
  plugins: {
    SplashScreen: {
      launchShowDuration: 0
    }
  }
};

export default config;