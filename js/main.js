document.addEventListener("DOMContentLoaded", () => {
    const jwt = localStorage.getItem("jwt");
    if (jwt) {
        window.location.href = "profile.html";
        return;
    }

    const form = document.querySelector(".login");
    form.addEventListener("submit", handleLogin);
});

async function handleLogin(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const identifier = formData.get("identifier").trim();
    const password = formData.get("password");

    if (!identifier || !password) {
        alert("Please fill in both fields.");
        return;
    }

    try {
        const credentials = btoa(`${identifier}:${password}`);
        const response = await fetch("https://learn.zone01oujda.ma/api/auth/signin", {
            method: "POST",
            headers: {
                "Authorization": `Basic ${credentials}`,
            },
        });

        if (!response.ok) {
            alert("Invalid credentials. Please try again.");
            return;
        }

        const jwt = (await response.text()).replace(/^"|"$/g, "");
        localStorage.setItem("jwt", jwt);
        window.location.href = "profile.html";
    } catch (err) {
        console.error("Login error:", err);
        alert("An error occurred. Please try again.");
    }
}
