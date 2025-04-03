import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { initializeApp, getApps, FirebaseApp } from "firebase/app";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

console.time("Firebase Initialization Time");
console.log("Firebase 初期化開始");

let app: FirebaseApp;

if (!getApps().length) {
  console.log("Firebase 初期化開始");  // ✅ これで実行されたか確認
  app = initializeApp(firebaseConfig);
} else {
  console.log("Firebase はすでに初期化済み");  // ✅ すでに初期化済みの場合
  app = getApps()[0];
}

console.timeEnd("Firebase Initialization Time");

const messaging = getMessaging(app);

export { messaging, getToken, onMessage };
