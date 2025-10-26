// Importa o Firebase
import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth'

// ⚠️ COLE AQUI AS CONFIGURAÇÕES que você copiou no PASSO 2
const firebaseConfig = {
  apiKey: "AIzaSyB91Phu7yTos_vWb0oLH0Pi7bFgNZvi-RY",
  authDomain: "point-da-zefinha.firebaseapp.com",
  projectId: "point-da-zefinha.firebasestorage.app",
  storageBucket: "seu-projeto.appspot.com",
  messagingSenderId: "33298145915",
  appId: "1:33298145915:web:5776982f1875df1222f8de"
}

// Inicializa o Firebase
const app = initializeApp(firebaseConfig)

// Inicializa a autenticação
const auth = getAuth(app)

// Provedor do Google
const googleProvider = new GoogleAuthProvider()

// Exporta para usar em outros arquivos
export { auth, googleProvider, signInWithPopup }