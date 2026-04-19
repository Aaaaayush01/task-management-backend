const BASE_URL = "https://task-management-backend-uw8d.onrender.com";
document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  try {
    const res = await fetch(`${BASE_URL}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (res.ok) {
  localStorage.setItem("token", data.token);
  alert("Login successful");
  window.location.href = "../app/dashboard.html";
} else {
      alert(data.msg);
    }
  } catch (err) {
    alert("Server error");
    console.log(err);
  }
});
