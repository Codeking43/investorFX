import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { getDatabase, ref, get, set, push, onChildAdded, onChildChanged } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-database.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";

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

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);

// Check session validity on each request
async function checkSessionValidity() {
    const user = auth.currentUser;
    if (user) {
        const userRef = ref(database, `users/${user.uid}/sessionToken`);
        const snapshot = await get(userRef);
        const storedToken = snapshot.exists() ? snapshot.val() : null;
        const localToken = sessionStorage.getItem('sessionToken');

        if (storedToken !== localToken) {
            console.warn("Session token mismatch. Logging out.");
            logout();
        }
    }
}

// Monitor auth state, validate session, and fetch user data
onAuthStateChanged(auth, async (user) => {
    if (user) {
        await checkSessionValidity();
        const userRef = ref(database, 'users/' + user.uid);
        get(userRef).then((snapshot) => {
            if (snapshot.exists()) {
                const userData = snapshot.val();
                document.getElementById('username').innerText = userData.username;
                document.getElementById('userEmail').innerText = userData.email;
                document.getElementById('firstname').innerText = userData.firstname;
                listenForUserOrders(user.uid);
            } else {
                document.getElementById('statusMessage').innerText = "No user data found!";
            }
        }).catch((error) => console.error("Error fetching user data:", error));
    } else {
        window.location.href = "index.html";
    }
});

// Submit a new order
function submitOrder(e) {
    e.preventDefault();
    const amount = parseFloat(document.getElementById('investedAmount').value);
    const ordersRef = ref(database, 'orders');
    const newOrderRef = push(ordersRef);

    set(newOrderRef, {
        userId: auth.currentUser.uid,
        username: document.getElementById('username').innerText,
        amount: amount,
        paymentStatus: 'Pending',
        verifiedDate: null
    }).then(() => {
        document.getElementById('statusMessage').innerText = 'Payment submitted. Awaiting verification.';
    }).catch((error) => console.error("Error submitting order:", error));
}

// Function to listen for orders specific to the logged-in user
function listenForUserOrders(userId) {
    const ordersRef = ref(database, 'orders');

    onChildAdded(ordersRef, (snapshot) => {
        const orderData = snapshot.val();
        if (orderData.userId === userId) {
            updateOrderList(orderData);
        }
    });

    onChildChanged(ordersRef, (snapshot) => {
        const orderData = snapshot.val();
        if (orderData.userId === userId) {
            updateOrderList(orderData);
        }
    });
}

// Update the order list in the UI
function updateOrderList(orderData) {
    const orderListElement = document.getElementById('orderList');
    const orderItem = document.createElement('li');

    if (orderData.paymentStatus === 'Verified') {
        orderItem.innerText = `Username: ${orderData.username}, Amount: ₦${orderData.amount} (Verified)`;
        startCountdown(orderData.verifiedDate);
        document.getElementById('statusMessage').innerText = `Payment successful. Amount paid: ₦${orderData.amount}. Order is processed.`;
        document.getElementById('investAmount').innerText = orderData.amount;
    } else {
        orderItem.innerText = `Username: ${orderData.username}, Amount: ₦${orderData.amount} (Pending)`;
    }

    orderListElement.appendChild(orderItem);
}

// Countdown function for a verified order
function startCountdown(verifiedDate) {
    const countDownDate = new Date(verifiedDate).getTime() + (24 * 60 * 60 * 1000);
    const countdownInterval = setInterval(() => {
        const now = new Date().getTime();
        const distance = countDownDate - now;

        if (distance < 0) {
            clearInterval(countdownInterval);
            document.getElementById('countdown').innerText = 'Order is complete.';
        } else {
            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);
            document.getElementById('countdown').innerText = `Time left: ${hours}h ${minutes}m ${seconds}s`;
        }
    }, 1000);
    window.getElementById("payBTN").style.display='block';
}

// Logout function
function logout() {
    signOut(auth).then(() => {
        sessionStorage.removeItem('sessionToken');
        window.location.href = "index.html";
    }).catch((error) => console.error("Error logging out:", error));
}

// Attach submit event listener to the order form
document.getElementById('orderForm').addEventListener('submit', submitOrder);
