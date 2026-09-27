declare module "next-pwa" {
  type NextPWA = (
    options: {
      dest: string;
      register: boolean;
      skipWaiting: boolean;
      disable: boolean;
      exclude: RegExp[];
    }
  ) => (nextConfig: import("next").NextConfig) => import("next").NextConfig;

  const withPWA: NextPWA;
  export default withPWA;
}
