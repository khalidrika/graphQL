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
});

const QUERIES = {
  PROFILE: `{
    user {
      firstName
      lastName
      auditRatio
      audits_aggregate(where: { closureType: { _eq: succeeded } }) {
        aggregate { count }
      }
      failed_audits: audits_aggregate(where: { closureType: { _eq: failed } }) {
        aggregate { count }
      }
      transactions(where: { type: { _like: "skill_%" } }) {
        type
        amount
      }
    }

    transaction(
      where: {
        _and: [
          { type: { _eq: "level" } },
          { event: { object: { name: { _eq: "Module" } } } }
        ]
      },
      order_by: { amount: desc },
      limit: 1
    ) {
      amount
    }
  }`,
};

async function fetchUserData(jwt) {
  try {
    const res = await fetch("https://learn.zone01oujda.ma/api/graphql-engine/v1/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + jwt,
      },
      body: JSON.stringify({ query: QUERIES.PROFILE }),
    });

    const { data } = await res.json();
    const user = data.user[0];
    console.log(user);
    
    if (!user) throw new Error("User not found");

    document.getElementById("user-fullname").textContent =
      `${user.firstName} ${user.lastName}`;

    document.getElementById("user-level").textContent =
      `Level: ${data.transaction[0]?.amount || "N/A"}`;

    document.getElementById("audit-ratio").textContent =
      `Ratio: ${user.auditRatio?.toFixed(2) || "0.00"}`;

    document.getElementById("audit-success").textContent =
      `Success: ${user.audits_aggregate.aggregate.count}`;

    document.getElementById("audit-fail").textContent =
      `Fail: ${user.failed_audits.aggregate.count}`;

    const groupedSkills = groupSkills(user.transactions);
    renderSkills(groupedSkills);

  } catch (err) {
    console.error("Failed to fetch data:", err);
    alert("Session expired or invalid. Please log in again.");
    localStorage.removeItem("jwt");
    window.location.href = "index.html";
  }
}

function groupSkills(transactions) {
  const skills = {};
  transactions.forEach(tx => {
    const type = tx.type;
    const amount = tx.amount;
    if (!skills[type]) skills[type] = 0;
    skills[type] += amount;
  });
  return skills;
}

function renderSkills(skills) {
  const list = document.getElementById("skills-list");
  list.innerHTML = "";

  const total = Object.values(skills).reduce((acc, val) => acc + val, 0);

  Object.entries(skills).forEach(([type, amount]) => {
    const li = document.createElement("li");
    const percentage = ((amount / total) * 100).toFixed(1);
    li.textContent = `${type.replace("skill_", "")}: ${amount} XP (${percentage}%)`;
    list.appendChild(li);
  });
}
