// firebase-config.js

// Importa as funções necessárias do SDK do Firebase v9
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-database.js";

// A sua configuração do Firebase, agora em um único lugar
const firebaseConfig = {
    apiKey: "AIzaSyDQJpcAfxnKCtUF5yLv9BE46TsQlm1pnKA",
    authDomain: "ifpr-mapa-portas-v2.firebaseapp.com",
    databaseURL: "https://ifpr-mapa-portas-v2-default-rtdb.firebaseio.com",
    projectId: "ifpr-mapa-portas-v2",
    storageBucket: "ifpr-mapa-portas-v2.appspot.com",
    messagingSenderId: "930682137935",
    appId: "1:930682137935:web:0ba20b1a82c0a7fe3f693a"
};

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);

// Exporta as instâncias do Auth e do Realtime Database para serem usadas em outros arquivos
export const auth = getAuth(app);
export const database = getDatabase(app);