document.addEventListener("DOMContentLoaded", () => {
  const jwt = localStorage.getItem("jwt");
  if (!jwt) {
    window.location.href = "index.html";
    return;
  }

  document.getElementById("logout").addEventListener("click", () => {
    localStorage.removeItem("jwt");
    window.location.href = "index.html";
  });

  fetchUserData(jwt);
  const groupedSkills = groupSkills(data.user[0].transactions);
  renderSkills(groupedSkills);


});

async function fetchUserData(jwt) {
  const query = `
  {
    user {
      firstName
      lastName
      transactions(where: { type: { _like: "skill%" } }) {
        type
        amount
      }
    }
    transaction(
      where: {
        type: { _eq: "xp" },
        path: { _nlike: "%checkpoint%" },
        event: { object: { name: { _eq: "Module" } } }
      },
      order_by: { createdAt: desc },
      limit: 10
    ) {
      amount
      path
      createdAt
    }
  }`;

  try {
    const res = await fetch("https://learn.zone01oujda.ma/api/graphql-engine/v1/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + jwt,
      },
      body: JSON.stringify({ query }),
    });

    const { data } = await res.json();

    document.getElementById("user-fullname").textContent =
      `${data.user[0].firstName} ${data.user[0].lastName}`;

    const list = document.getElementById("xp-list");
    data.transaction.forEach((t) => {
      const li = document.createElement("li");
      li.textContent = `${t.amount} XP - ${t.path} (${new Date(t.createdAt).toLocaleDateString()})`;
      list.appendChild(li);
    });

  } catch (err) {
    console.error("Failed to fetch data:", err);
    alert("Session expired or invalid. Please log in again.");
    localStorage.removeItem("jwt");
    window.location.href = "index.html";
  }
}
function renderSkills(skills) {
  const list = document.getElementById("skills-list");
  Object.entries(skills).forEach(([type, amount]) => {
    const li = document.createElement("li");
    li.textContent = `${type.replace("skill_", "")}: ${amount}`;
    list.appendChild(li);
  });
}
