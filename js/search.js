document
  .getElementById("searchButton")
  .addEventListener("click", async function (e) {
    e.preventDefault();
    let domain = document.getElementById("searchInput").value.trim();
    let resultsDiv = document.getElementById("searchResults");

    if (!domain) {
      alert("Please enter a domain name.");
      return;
    }

    let rdapUrl = `https://rdap.org/domain/${domain}`;
    let similarWebUrl = `https://corsproxy.io/?https://data.similarweb.com/api/v1/data?domain=${domain}`;

    // Show Loading Message
    resultsDiv.innerHTML = "<p>Loading...</p>";

    try {
      let [rdapResponse, similarWebResponse] = await Promise.all([
        fetch(rdapUrl),
        fetch(similarWebUrl),
      ]);

      if (!rdapResponse.ok) {
        throw new Error("Domain not found.");
      }

      let rdapData = await rdapResponse.json();
      let similarWebData = similarWebResponse.ok
        ? await similarWebResponse.json()
        : null;

      let visitorCount = similarWebData?.visits
        ? `${similarWebData.visits} visitors`
        : "N/A";

      resultsDiv.innerHTML = `<h3>Domain Information</h3>
        <p><strong>Domain:</strong> ${rdapData?.ldhName}</p>
        <p><strong>Status:</strong> ${rdapData?.status.join(", ")}</p>
        <p><strong>Registrar:</strong> ${
          rdapData.entities[0]?.vcardArray[1][1][3] || "N/A"
        }</p>
        <p><strong>Creation Date:</strong> ${
          rdapData.events.find((e) => e.eventAction === "registration")
            ?.eventDate || "N/A"
        }</p>
        <p><strong>Last Updated:</strong> ${
          rdapData.events.find((e) => e.eventAction === "last changed")
            ?.eventDate || "N/A"
        }</p>
    
        <h3>Website Traffic (SimilarWeb)</h3>
        <p><strong>Monthly Visitors:</strong> ${visitorCount}</p>
        <p><strong>Site Name:</strong> ${similarWebData?.SiteName}</p>
        <p><strong>Description:</strong> ${similarWebData?.Description}</p>
        <p><strong>Title:</strong> ${similarWebData?.Title}</p>
        
        <h4>Traffic Share by Country:</h4>
        <ul>
          ${similarWebData?.TopCountryShares.map(
            (country) =>
              `<li>${country?.CountryCode}: ${country?.Value * 100}%</li>`
          ).join("")}
        </ul>
    
        <h4>Engagements:</h4>
        <p><strong>Bounce Rate:</strong> ${
          similarWebData?.Engagments?.BounceRate
        }</p>
        <p><strong>Page per Visit:</strong> ${
          similarWebData?.Engagments?.PagePerVisit
        }</p>
        <p><strong>Visits:</strong> ${similarWebData?.Engagments?.Visits}</p>
        <p><strong>Time on Site:</strong> ${
          similarWebData?.Engagments?.TimeOnSite
        }</p>
    
        <h4>Rankings:</h4>
        <p><strong>Global Rank:</strong> ${similarWebData?.GlobalRank?.Rank}</p>
        <p><strong>Country Rank:</strong> ${
          similarWebData?.CountryRank?.Rank
        }</p>
        <p><strong>Global Category Rank:</strong> ${
          similarWebData?.GlobalCategoryRank?.Rank
        }</p>
        
        <h4>Traffic Sources:</h4>
        <ul>
          ${Object.entries(similarWebData?.TrafficSources)
            .map(([source, value]) => `<li>${source}: ${value * 100}%</li>`)
            .join("")}
        </ul>
    
        <h4>Top Keywords:</h4>
        <ul>
          ${similarWebData?.TopKeywords.map(
            (keyword) =>
              `<li>${keyword?.Name} - Volume: ${keyword?.Volume}, Estimated Value: ${keyword?.EstimatedValue}</li>`
          ).join("")}
        </ul>
    
        <h4>Competitors:</h4>
        <p>Top Similarity Competitors: ${
          similarWebData?.Competitors?.TopSimilarityCompetitors.length
            ? similarWebData?.Competitors?.TopSimilarityCompetitors.join(", ")
            : "None"
        }</p>
    
        <h4>Snapshot Date:</h4>
        <p>${similarWebData?.SnapshotDate}</p>
    
        <h3>Website Screenshot:</h3>
        <img src="${
          similarWebData?.LargeScreenshot
        }" alt="Website Screenshot" />
        `;
    } catch (error) {
      resultsDiv.innerHTML = `<p style="color:red;">Error: ${error.message}</p>`;
    }
  });
