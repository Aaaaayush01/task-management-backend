const BASE_URL = "https://task-management-backend-uw8d.onrender.com";
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
    alert(data.msg);

  } catch (err) {
    alert("Server error");
    console.log(err);
  }
});