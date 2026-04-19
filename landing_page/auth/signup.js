const BASE_URL = "https://task-management-backend-uw8d.onrender.com";

const message = document.getElementById("message");

document.getElementById("signupForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  try {
    const res = await fetch(`${BASE_URL}/signup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (data.msg === "User already exists") {
      message.innerHTML = 'User already exists. <a href="login.html">Login instead</a>';
      message.className = "message error";
    } else {
      message.textContent = "Signup successful! Redirecting...";
      message.className = "message success";

      setTimeout(() => {
        window.location.href = "login.html";
      }, 1000);
    }

  } catch (err) {
    message.textContent = "Server error";
    message.className = "message error";
    console.log(err);
  }
});