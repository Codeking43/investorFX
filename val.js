  // Import Firebase SDK modules
  import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
  import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
  import { getDatabase, ref, set } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-database.js";

  // Firebase configuration
 // Firebase configuration
const firebaseConfig = {
apiKey: "AIzaSyAicjO4bsXnfdF4l6sCmFvoRliiV6EC62I",
authDomain: "portfolioclient-7d2fa.firebaseapp.com",
databaseURL: "https://portfolioclient-7d2fa-default-rtdb.firebaseio.com",
projectId: "portfolioclient-7d2fa",
storageBucket: "portfolioclient-7d2fa.appspot.com",
messagingSenderId: "141801602453",
appId: "1:141801602453:web:91d3d6231987678dc78a9c"
};

  // Initialize Firebase app and services
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const database = getDatabase(app);

  function displayMessage(message, isError = false) {
      const errorElement = document.getElementById('error');
      const messageElement = document.getElementById('spanT');
      errorElement.style.display = 'block';
      messageElement.textContent = message;
      messageElement.style.color = isError ? 'red' : 'green';
  }

  // Define signup and login functions and attach to window object for global access
  window.signup = async function() {
      const username = document.getElementById('signup-username').value;
      const userAddress=document.getElementById('signup-useraddress').value;
      const userFullName=document.getElementById('signup-userFullName').value;
      const email = document.getElementById('signup-email').value;
      const password = document.getElementById('signup-password').value;

      try {
          const userCredential = await createUserWithEmailAndPassword(auth, email, password);
          const user = userCredential.user;

          await set(ref(database, 'users/' + user.uid), {
              uid: user.uid,
              fullname:userFullName,
              userAddress:userAddress,
              username: username,
              email: email,
              investedAmount: 0,
          });

          displayMessage('Signup successful! Redirecting to login...');
          setTimeout(() => window.location.href = "index.html", 1500);
      } catch (error) {
          displayMessage(`Error: ${error.message}`, true);
      }
  };

  window.login = async function() {
const email = document.getElementById('login-email').value;
const password = document.getElementById('login-password').value;

try {
  // Attempt to sign in the user
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  // Generate and store the session token in session storage
  const sessionToken = generateSessionToken();
  sessionStorage.setItem('sessionToken', sessionToken);

  // Store session token in Firebase under the user's profile
  const userRef = ref(database, `users/${user.uid}/sessionToken`);
  await set(userRef, sessionToken);

  // Display a success message and redirect to the dashboard
  displayMessage('Login successful! Redirecting to dashboard...');
  setTimeout(() => window.location.href = "user.html", 1500);
} catch (error) {
  // Display an error message if login fails
  displayMessage('Invalid credentials or error logging in', true);
}
};

// Function to generate a secure session token
function generateSessionToken() {
return Math.random().toString(36).substr(2); // Simple token generator; replace with a secure random method in production
}
