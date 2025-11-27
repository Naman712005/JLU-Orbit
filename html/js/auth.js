// API base (adjust if your backend runs elsewhere)
// — dynamic API base that gets set by the server via /config.js — fallback to relative path
const API_BASE = (window.__CONFIG__ && window.__CONFIG__.API_BASE) || (location.origin + '/api') || '/api';

// container and links for toggling UI
const container = document.querySelector(".container");
const LoginLink = document.querySelector(".SignInLink");
const RegisterLink = document.querySelector(".SignUpLink");

// forms and special OTP box
const loginForm = document.getElementById("loginForm");
const signupForm = document.getElementById("signupForm");
const otpBox = document.getElementById("otpBox");
const otpForm = document.getElementById("otpForm");

// Keep track of pending user for OTP verification
let pendingUserId = null;

// Toggle UI
RegisterLink.addEventListener("click", (e) => {
  e.preventDefault();
  container.classList.add("active");
  // hide otp if visible
  hideOtp();
});

LoginLink.addEventListener("click", (e) => {
  e.preventDefault();
  container.classList.remove("active");
  hideOtp();
});

function showOtp() {
  otpBox.style.display = "block";
  // hide login and signup visually
  document.querySelector(".form-box.Login").style.display = "none";
  document.querySelector(".form-box.Register").style.display = "none";
  document.querySelector(".info-content.Login").style.display = "none";
  document.querySelector(".info-content.Register").style.display = "none";
}

function hideOtp() {
  otpBox.style.display = "none";
  document.querySelector(".form-box.Login").style.display = "";
  document.querySelector(".form-box.Register").style.display = "";
  document.querySelector(".info-content.Login").style.display = "";
  document.querySelector(".info-content.Register").style.display = "";
}

/* ---------- LOGIN ---------- */
loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value.trim();

  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (res.ok) {
      // expecting { token, user }
      localStorage.setItem("authToken", data.token);
      localStorage.setItem("currentUser", JSON.stringify(data.user));
      localStorage.setItem("userName", data.user?.name || "User");
      window.location.href = "index.html";
    } else {
      alert(data.error || "Login failed");
    }
  } catch (err) {
    console.error(err);
    alert("Network error");
  }
});

/* ---------- SIGNUP ---------- */
signupForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = document.getElementById("signupName").value.trim();
  const course = document.getElementById("signupCourse").value.trim();
  const specialization = document
    .getElementById("signupSpecialization")
    .value.trim();
  const semester = document.getElementById("signupSemester").value.trim();
  const jluid = document.getElementById("signupJluid").value.trim();
  const email = document.getElementById("signupEmail").value.trim();
  const password = document.getElementById("signupPassword").value.trim();

  // simple client-side validation (you can expand)
  if (
    !name ||
    !course ||
    !specialization ||
    !semester ||
    !jluid ||
    !email ||
    !password
  ) {
    return alert("Please fill all fields.");
  }

  try {
    const res = await fetch(`${API_BASE}/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        course,
        specialization,
        semester,
        jluid,
        email,
        password,
      }),
    });
    const data = await res.json();
    if (res.ok) {
      // backend should return userId to verify OTP
      pendingUserId = data.userId || data.user?._id || null;
      if (!pendingUserId) {
        // If backend immediately returns token + user (no OTP flow), handle that:
        if (data.token && data.user) {
          localStorage.setItem("authToken", data.token);
          localStorage.setItem("currentUser", JSON.stringify(data.user));
          localStorage.setItem("userName", data.user?.name || "User");
          window.location.href = "index.html";
          return;
        }

        alert(
          "Signup completed but no userId returned for OTP. Check backend response."
        );
        return;
      }

      // Show OTP UI
      showOtp();
    } else {
      alert(data.error || "Signup failed");
    }
  } catch (err) {
    console.error(err);
    alert("Network error");
  }
});

/* ---------- OTP VERIFICATION ---------- */
otpForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const otp = document.getElementById("otpInput").value.trim();
  if (!pendingUserId) return alert("No signup in progress.");

  try {
    const res = await fetch(`${API_BASE}/auth/verify-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: pendingUserId, otp }),
    });
    const data = await res.json();
    if (res.ok) {
      // expecting { token, user }
      localStorage.setItem("authToken", data.token);
      localStorage.setItem("currentUser", JSON.stringify(data.user));

      localStorage.setItem("userName", data.user?.name || "User");
      window.location.href = "index.html";
    } else {
      alert(data.error || "OTP verification failed");
    }
  } catch (err) {
    console.error(err);
    alert("Network error");
  }
});

// Optional: prefill for dev/testing if desired
// document.getElementById('signupEmail').value = 'test@example.com';
