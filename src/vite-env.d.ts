/// <reference types="vite/client" />
interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
  // AJOUTÉ — active le bloc des comptes de démonstration sur l'écran de connexion
  // pour un build de démonstration (`npm run dev` l'affiche déjà par défaut).
  readonly VITE_DEMO_HINTS?: string
}
interface ImportMeta {
  readonly env: ImportMetaEnv
}
