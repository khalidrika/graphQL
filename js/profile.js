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

  fetchUserData(jwt).catch(err => {
    console.error("Initial fetch error:", err);
    alert("Failed to load profile data. Please try again later.");
  });
});

const QUERIES = {
  PROFILE: `{
    user(limit: 1) {
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

    userLevl: transaction(
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

    userXp: transaction(
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
  }`
};

async function fetchUserData(jwt) {
  try {
    const response = await fetch("https://learn.zone01oujda.ma/api/graphql-engine/v1/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${jwt}`,
      },
      body: JSON.stringify({ query: QUERIES.PROFILE }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`HTTP error! Status: ${response.status}\nBody: ${errorBody}`);
    }

    const result = await response.json();

    if (result.errors) {
      throw new Error(`GraphQL errors:\n${result.errors.map(e => e.message).join('\n')}`);
    }

    if (!result.data?.user?.[0]) {
      throw new Error("No user data found in response");
    }

    processUserData(result.data);
  } catch (error) {
    console.error("Error details:", {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    throw new Error("Failed to fetch user profile. Please check console for details.");
  }
}

function processUserData(data) {
  const user = data.user[0];
  const level = data.userLevl?.[0]?.amount ?? "Unknown";

  //full name
  document.getElementById("user-fullname").textContent = `${user.firstName} ${user.lastName}`;

  // levl
  document.getElementById("user-level").textContent = level;

  //audit xp
  document.getElementById("audit-ratio").textContent += user.auditRatio.toFixed(2);
  document.getElementById("audit-success").textContent += user.audits_aggregate.aggregate.count;
  document.getElementById("audit-fail").textContent += user.failed_audits.aggregate.count;

  //skills
  const skillsList = document.getElementById("skills-list");
  user.transactions.forEach(skill => {
    const li = document.createElement("li");
    li.textContent = `${skill.type.replace("skill_", "")}: ${skill.amount}`;
    skillsList.appendChild(li);
  });

  //progects
  const xpList = document.getElementById("recent-xp-list");
  data.userXp.forEach(tx => {
    const li = document.createElement("li");
    li.textContent = `${tx.amount} XP from ${tx.path}`;
    xpList.appendChild(li);
  });
}
