/// <reference types="vite/client" />

declare module "*.jpg" {
  const imageUrl: string;
  export default imageUrl;
}

interface ImportMetaEnv {
  readonly VITE_ADMIN_PATH?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
