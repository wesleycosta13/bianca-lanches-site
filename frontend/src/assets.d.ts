/// <reference types="vite/client" />

declare module "*.jpg" {
  const imageUrl: string;
  export default imageUrl;
}

interface ImportMetaEnv {
  readonly VITE_WHATSAPP_CONTATO?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}