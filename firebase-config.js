// ============================================================================
// SPARK DRIVES & AUTOMATION - INDUSTRIAL IoT PLATFORM
// Firebase Configuration & Initialization
// ============================================================================

const firebaseConfig = {
  apiKey: "AIzaSyAVAAMssNduvCzFilUOX48pWHhGcy4d5es",
  authDomain: "sparkautomation-b49d9.firebaseapp.com",
  databaseURL: "https://sparkautomation-b49d9-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "sparkautomation-b49d9",
  storageBucket: "sparkautomation-b49d9.firebasestorage.app",
  messagingSenderId: "1023394394394",
  appId: "1:1023394394394:web:6b2c707423a7431f9d7ca3",
  measurementId: "G-H91QD90925"
};

// Initialize Firebase
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

// Export references to global scope
const auth = firebase.auth();
const rtdb = firebase.database();

window.SparkFirebase = {
  app: firebase.app(),
  auth: auth,
  rtdb: rtdb,
  config: firebaseConfig
};
