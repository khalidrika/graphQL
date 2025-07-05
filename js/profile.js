document.addEventListener("DOMContentLoaded", (f) => {
  f.preventDefault();
  const jwt = localStorage.getItem("jwt");
  if (!jwt) {
    window.location.href = "index.html";
    return;
  }

  document.getElementById("logout").addEventListener("click", (e) => {
    e.preventDefault();
    localStorage.removeItem("jwt");
    window.location.href = "index.html";
  });

  fetchUserData(jwt).catch(err => {
    console.error("Initial fetch error:", err);
    // alert("Failed to load profile data. Please try again later.");
  });
});

const QUERIES =
  `{
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


async function fetchUserData(jwt) {
  try {
    const response = await fetch("https://learn.zone01oujda.ma/api/graphql-engine/v1/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${jwt}`,
      },
      body: JSON.stringify({ query: QUERIES }),
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
    if (error.message != "Failed to fetch") {
      localStorage.removeItem("jwt");
      window.location.href = "index.html";
    }
    throw new Error("Failed to fetch user profile. Please check console for details.");
  }
}

function processUserData(data) {
  const user = data.user[0];
  // console.log(user.transactions);

  const level = data.userLevl?.[0]?.amount ?? "Unknown";

  //full name
  document.getElementById("user-fullname").textContent = `${user.firstName} ${user.lastName}`;

  // levl
  document.getElementById("user-level").textContent = level;

  //audit xp
  document.getElementById("audit-ratio").textContent += user.auditRatio.toFixed(2);
  document.getElementById("audit-success").textContent += user.audits_aggregate.aggregate.count;
  document.getElementById("audit-fail").textContent += user.failed_audits.aggregate.count;

  const skills = Sort(user.transactions)
  renderSkillsBarChart(skills);


  //progects

  //svg
  renderAuditPieChart(
    user.audits_aggregate.aggregate.count,
    user.failed_audits.aggregate.count
  );
  renderXpBarChart(data.userXp);


}

function renderAuditPieChart(successCount, failCount) {
  const svg = document.getElementById("audit-pie-chart");
  svg.innerHTML = "";

  const total = successCount + failCount;
  if (total === 0) {

    // yla ma kan t ahaja
    const noDataText = document.createElementNS("http://www.w3.org/2000/svg", "text");
    noDataText.setAttribute("x", 100);
    noDataText.setAttribute("y", 105);
    noDataText.setAttribute("text-anchor", "middle");
    noDataText.setAttribute("font-size", "16");
    noDataText.setAttribute("fill", "#999");
    noDataText.textContent = "No audit data";
    svg.appendChild(noDataText);
    return;
  }

  const radius = 90;
  const cx = 100;
  const cy = 100;

  const successPercent = successCount / total;
  const failPercent = failCount / total;
  const successAngle = successPercent * 360;

  function polarToCartesian(cx, cy, r, angleInDegrees) {
    const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
    return {
      x: cx + r * Math.cos(angleInRadians),
      y: cy + r * Math.sin(angleInRadians)
    };
  }

  function describeArc(startAngle, endAngle, color) {
    const start = polarToCartesian(cx, cy, radius, endAngle);
    const end = polarToCartesian(cx, cy, radius, startAngle);
    const largeArc = endAngle - startAngle > 180 ? "1" : "0";

    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    const d = [
      "M", cx, cy,
      "L", start.x, start.y,
      "A", radius, radius, 0, largeArc, 0, end.x, end.y,
      "Z"
    ].join(" ");

    path.setAttribute("d", d);
    path.setAttribute("fill", color);
    return path;
  }

  // lkatba lwast
  const centerText = document.createElementNS("http://www.w3.org/2000/svg", "text");
  centerText.setAttribute("x", cx);
  centerText.setAttribute("y", cy + 5);
  centerText.setAttribute("text-anchor", "middle");
  centerText.setAttribute("font-size", "18");
  centerText.setAttribute("fill", "#333");
  centerText.textContent = `${Math.round(successPercent * 100)}% Success`;

  //2 pc
  const successArc = describeArc(0, successAngle, "#4caf50");
  const failArc = describeArc(successAngle, 360, "#f44336");

  // reiaction
  successArc.addEventListener("mouseenter", () => {
    centerText.textContent = `${Math.round(successPercent * 100)}% Success`;
  });

  failArc.addEventListener("mouseenter", () => {
    centerText.textContent = `${Math.round(failPercent * 100)}% Fail`;
  });

  svg.addEventListener("mouseleave", () => {
    centerText.textContent = `${Math.round(successPercent * 100)}% Success`;
  });

  // tartib 
  svg.appendChild(successArc);
  svg.appendChild(failArc);
  svg.appendChild(centerText);
}


function renderXpBarChart(xpData) {
  const svg = document.getElementById("xp-bar-chart");
  svg.innerHTML = "";

  if (!xpData.length) {
    const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    text.setAttribute("x", 300);
    text.setAttribute("y", 150);
    text.setAttribute("text-anchor", "middle");
    text.textContent = "No XP data";
    svg.appendChild(text);
    return;
  }

  const width = 600;
  const height = 300;
  const padding = 40;
  const barWidth = (width - 2 * padding) / xpData.length;

  const maxXP = Math.max(...xpData.map(x => x.amount));

  xpData.forEach((entry, index) => {
    const x = padding + index * barWidth;
    const barHeight = (entry.amount / maxXP) * (height - 2 * padding);
    const y = height - padding - barHeight;

    const bar = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    bar.setAttribute("x", x);
    bar.setAttribute("y", y);
    bar.setAttribute("width", barWidth - 5); // 5px gap
    bar.setAttribute("height", barHeight);
    bar.setAttribute("fill", "#2196f3");

    const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
    label.setAttribute("x", x + barWidth / 2 - 5);
    label.setAttribute("y", height - 10);
    label.setAttribute("text-anchor", "middle");
    label.setAttribute("font-size", "10");
    label.setAttribute("opacity", "0"); // hiden
    label.textContent = new Date(entry.createdAt).toLocaleDateString('en-GB');

    bar.addEventListener("mouseover", () => {
      label.setAttribute("opacity", "1");
    });
    bar.addEventListener("mouseout", () => {
      label.setAttribute("opacity", "0");
    });




    const title = document.createElementNS("http://www.w3.org/2000/svg", "title");
    title.textContent = xpData[index].path.slice(14, 50)

    const valueText = document.createElementNS("http://www.w3.org/2000/svg", "text");
    valueText.setAttribute("x", x + barWidth / 2 - 5);
    valueText.setAttribute("y", y - 5);
    valueText.setAttribute("text-anchor", "middle");
    valueText.setAttribute("font-size", "10");
    valueText.textContent = entry.amount;

    bar.append(title)
    svg.appendChild(bar);
    svg.appendChild(label);
    svg.appendChild(valueText);
  });
}

function renderSkillsBarChart(skills) {
  const svg = document.getElementById("skills-bar-chart");
  svg.innerHTML = "";

  if (!skills.length) {
    const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    text.setAttribute("x", 300);
    text.setAttribute("y", 150);
    text.setAttribute("text-anchor", "middle");
    text.textContent = "No skills data";
    svg.appendChild(text);
    return;
  }

  const width = 600;
  const height = 300;
  const padding = 40;
  const barWidth = (width - 2 * padding) / skills.length;

  const maxSkill = Math.max(...skills.map(s => s.amount));

  skills.forEach((skill, index) => {
    const skillName = skill.type.replace("skill_", "");
    const x = padding + index * barWidth;
    const barHeight = (skill.amount / maxSkill) * (height - 2 * padding);
    const y = height - padding - barHeight;

    const bar = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    bar.setAttribute("x", x);
    bar.setAttribute("y", y);
    bar.setAttribute("width", barWidth - 5);
    bar.setAttribute("height", barHeight);
    bar.setAttribute("fill", "#673ab7");
    //namee skills
    const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
    label.setAttribute("x", x + barWidth / 2 - 5);
    label.setAttribute("y", height - 10);
    label.setAttribute("text-anchor", "middle");
    label.setAttribute("font-size", "10");
    label.setAttribute("opacity", "0"); //hesen
    label.textContent = skillName;

    // hover 
    bar.addEventListener("mouseover", () => {
      label.setAttribute("opacity", "1");
    });
    bar.addEventListener("mouseout", () => {
      label.setAttribute("opacity", "0");
    });


    //xp
    const value = document.createElementNS("http://www.w3.org/2000/svg", "text");
    value.setAttribute("x", x + barWidth / 2 - 5);
    value.setAttribute("y", y - 5);
    value.setAttribute("text-anchor", "middle");
    value.setAttribute("font-size", "10");
    value.textContent = skill.amount;

    svg.appendChild(bar);
    svg.appendChild(label);
    svg.appendChild(value);
  });
}


function Sort(data) {
  const typeMap = {};

  for (let i = 0; i < data.length; i++) {
    const item = data[i];
    const currentType = item.type;

    if (!typeMap[currentType] || item.amount > typeMap[currentType].amount) {
      typeMap[currentType] = item;
    }
  }

  return Object.values(typeMap);
}