// ─── Configuração centralizada ────────────────────────────────────────────────

// URL do backend (legado — não usado pelo Supabase)
export const API_URL = 'https://remediario.onrender.com';

// ─── Google Maps / Places API ─────────────────────────────────────────────────
//
// 1. Acesse: https://console.cloud.google.com/
// 2. Crie um projeto e ative as APIs:
//      • Maps SDK for Android
//      • Maps SDK for iOS
//      • Places API
// 3. Gere uma chave de API e cole abaixo.
//
// IMPORTANTE — bare workflow (android/ e ios/ já gerados):
//   Android → android/app/src/main/AndroidManifest.xml
//     Adicione dentro de <application>:
//     <meta-data
//       android:name="com.google.android.geo.API_KEY"
//       android:value="AIzaSyCBMKCiDABaYr0d4L5FVT8gtaLPZFSF2Y8" />
//
//   iOS → ios/CuidaBem/AppDelegate.mm
//     Adicione no topo: #import <GoogleMaps/GoogleMaps.h>
//     No didFinishLaunchingWithOptions: [GMSServices provideAPIKey:@"AIzaSyCBMKCiDABaYr0d4L5FVT8gtaLPZFSF2Y8"];
//
export const GOOGLE_MAPS_API_KEY = 'AIzaSyCBMKCiDABaYr0d4L5FVT8gtaLPZFSF2Y8';
