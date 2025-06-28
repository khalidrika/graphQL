document.addEventListener("DOMContentLoaded", async (e) => {
    login();
})

async function login() {
    try {
        document.querySelector(".login").addEventListener("submit", async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const identifier = formData.get("identifier");
            const password = formData.get("password");
            const credentials = btoa(`${identifier}:${password}`);

            let response = await fetch("https://learn.zone01oujda.ma/api/auth/signin", {
                method: "POST",
                headers: {
                    "Authorization": `Basic ${credentials}`,
                },
            })

            if (!response.ok) {
                alert("Invalid credentials. please try again.");
                return;
            }

            const raw = await response.text();
            const jwt = raw.replace(/^"|"$/g, "");

            localStorage.setItem("jwt", jwt);
            
            window.location.href = "profile.html"
        })
    } catch (err) {
        console.log("login error:", err);
        alert("An error occurred. Please try again.");
    }
}