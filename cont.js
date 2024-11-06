import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { getDatabase, ref, get, set, push, onChildAdded, onChildChanged } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-database.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";

// Firebase configuration and initialization
const firebaseConfig = {
    apiKey: "AIzaSyAicjO4bsXnfdF4l6sCmFvoRliiV6EC62I",
    authDomain: "portfolioclient-7d2fa.firebaseapp.com",
    databaseURL: "https://portfolioclient-7d2fa-default-rtdb.firebaseio.com",
    projectId: "portfolioclient-7d2fa",
    storageBucket: "portfolioclient-7d2fa.appspot.com",
    messagingSenderId: "141801602453",
    appId: "1:141801602453:web:91d3d6231987678dc78a9c"
    };
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);

// Check session validity and fetch user data if valid
onAuthStateChanged(auth, async (user) => {
    if (user) {
        await checkSessionValidity(user.uid);
        const userData = await fetchUserData(user.uid);
        if (userData) {
            displayUserInfo(userData);
            listenForUserOrders(user.uid);
        } else {
            displayStatusMessage("No user data found!");
        }
    } else {
        redirectToLogin();
    }
});

// Check session validity
async function checkSessionValidity(userId) {
    try {
        const sessionToken = await getSessionToken(userId);
        const localToken = sessionStorage.getItem('sessionToken');
        if (sessionToken !== localToken) {
            console.warn("Session token mismatch. Logging out.");
            logout();
        }
    } catch (error) {
        console.error("Error checking session validity:", error);
    }
}

// Fetch user data from database
async function fetchUserData(userId) {
    try {
        const snapshot = await get(ref(database, `users/${userId}`));
        return snapshot.exists() ? snapshot.val() : null;
    } catch (error) {
        console.error("Error fetching user data:", error);
    }
}

// Submit a new order
async function submitOrder(e) {
    e.preventDefault();
    const amount = parseFloat(document.getElementById('investedAmount').value);
    const username = document.getElementById('username').innerText || auth.currentUser.displayName || "Unknown User";

    if (isNaN(amount) || amount <= 0) {
        displayStatusMessage("Please enter a valid amount.");
        return;
    }

    try {
        const newOrderRef = push(ref(database, 'orders'));
        await set(newOrderRef, {
            userId: auth.currentUser.uid,
            username,
            amount,
            paymentStatus: 'Pending',
            submissionDate: new Date().toISOString(),
            verifiedDate: null
        });
        displayStatusMessage("Payment submitted. Awaiting verification.");
        document.getElementById('investedAmount').value = '';
    } catch (error) {
        console.error("Error submitting order:", error);
        displayStatusMessage("Error submitting order. Please try again later.");
    }
}

// Start countdown for payout eligibility
function startCountdown(submissionDate) {
    const countDownDate = new Date(submissionDate).getTime() + 5 * 24 * 60 * 60 * 1000;
    const countdownInterval = setInterval(() => {
        const remainingTime = calculateRemainingTime(countDownDate);
        if (remainingTime) {
            document.getElementById('countdown').innerText = remainingTime;
        } else {
            clearInterval(countdownInterval);
            document.getElementById('countdown').innerText = "Payout available!";
            enablePayoutButton();
        }
    }, 1000);
}

// Calculate remaining time for countdown
function calculateRemainingTime(countDownDate) {
    const now = Date.now();
    const distance = countDownDate - now;
    if (distance < 0) return null;

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);
    return `Payout in: ${days}d ${hours}h ${minutes}m ${seconds}s`;
}

// Enable payout button
function enablePayoutButton() {
    const payoutButton = document.getElementById('payoutButton');
    payoutButton.style.display = 'block';
    payoutButton.disabled = false;
}

// Payout function
function payout() {
    displayStatusMessage("Processing payout...");
    setTimeout(() => {
        displayStatusMessage("Payout completed successfully!");
        disablePayoutButton();
    }, 2000);
}

// Disable payout button
function disablePayoutButton() {
    const payoutButton = document.getElementById('payoutButton');
    payoutButton.disabled = true;
    payoutButton.innerText = "Payout Completed";
}

// Listen for user orders
function listenForUserOrders(userId) {
    const ordersRef = ref(database, 'orders');
    onChildAdded(ordersRef, (snapshot) => updateOrderList(snapshot.val(), userId));
    onChildChanged(ordersRef, (snapshot) => updateOrderList(snapshot.val(), userId));
}

// Update the order list in the UI
function updateOrderList(orderData, userId) {
    if (orderData.userId === userId) {
        const orderItem = createOrderItem(orderData);
        document.getElementById('orderList').appendChild(orderItem);

        if (orderData.paymentStatus === 'Verified') {
            startCountdown(orderData.verifiedDate || orderData.submissionDate);
            displayStatusMessage(`Payment successful. Amount paid: ₦${orderData.amount}.`);
            document.getElementById('investAmount').innerText = orderData.amount;
        }
    }
}

// Create order item element
function createOrderItem(orderData) {
    const orderItem = document.createElement('li');
    const statusText = orderData.paymentStatus === 'Verified' ? "(Verified)" : "(Pending)";
    orderItem.innerText = `Username: ${orderData.username}, Amount: ₦${orderData.amount} ${statusText}`;
    return orderItem;
}

// Logout function
function logout() {
    signOut(auth).then(() => {
        sessionStorage.removeItem('sessionToken');
        redirectToLogin();
    }).catch((error) => console.error("Error logging out:", error));
}

// Utility functions
function displayUserInfo(userData) {
    document.getElementById('username').innerText = userData.username || "User";
    document.getElementById('userEmail').innerText = userData.email || "No email";
}

function displayStatusMessage(message) {
    document.getElementById('statusMessage').innerText = message;
}

function redirectToLogin() {
    window.location.href = "index.html";
}

async function getSessionToken(userId) {
    try {
        const userRef = ref(database, `users/${userId}/sessionToken`);
        const snapshot = await get(userRef);
        return snapshot.exists() ? snapshot.val() : null;
    } catch (error) {
        console.error("Error fetching session token:", error);
    }
}

// Event Listeners
document.getElementById('orderForm').addEventListener('submit', submitOrder);
document.getElementById('logoutButton').addEventListener('click', logout);
document.getElementById('payoutButton').addEventListener('click', payout);
