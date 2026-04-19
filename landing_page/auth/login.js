const BASE_URL = "https://task-management-backend-uw8d.onrender.com";

const message = document.getElementById("message");

document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  try {
    const res = await fetch(`${BASE_URL}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (data.token) {
      // Save token
      localStorage.setItem("token", data.token);

      // Instant redirect (no popup)
      window.location.href = "../app/dashboard.html";
    } else {
      message.textContent = data.msg || "Invalid credentials";
      message.className = "message error";
    }

  } catch (err) {
    message.textContent = "Server error";
    message.className = "message error";
    console.log(err);
  }
});