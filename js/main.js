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

            const data = await response.json();
            console.log(data);
            localStorage.setItem("jwt", data);
        })
    } catch {
        console.log("err");
    }
}

const xpQuery = ``