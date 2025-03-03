document
  .getElementById("searchButton")
  .addEventListener("click", async function (e) {
    e.preventDefault();
    let domain = document.getElementById("searchInput").value.trim();

    if (!domain) {
      alert("Please enter a domain name.");
      return;
    }

    let apiUrl = `https://rdap.org/domain/${domain}`;

    try {
      let response = await fetch(apiUrl);
      if (!response.ok) {
        alert("Domain is not found!");
        throw new Error("Domain not found.");
      }
      let data = await response.json();

      // Displaying results in HTML
      document.getElementById("searchResults").innerHTML = `
            <h3>Domain Information</h3>
            <p><strong>Domain:</strong> ${data.ldhName}</p>
            <p><strong>Status:</strong> ${data.status.join(", ")}</p>
            <p><strong>Registrar:</strong> ${
              data.entities[0]?.vcardArray[1][1][3] || "N/A"
            }</p>
            <p><strong>Creation Date:</strong> ${
              data.events.find((e) => e.eventAction === "registration")
                ?.eventDate || "N/A"
            }</p>
            <p><strong>Last Updated:</strong> ${
              data.events.find((e) => e.eventAction === "last changed")
                ?.eventDate || "N/A"
            }</p>
        `;
    } catch (error) {
      document.getElementById(
        "searchResults"
      ).innerHTML = `<p style="color:red;">Error: ${error.message}</p>`;
    }
  });
