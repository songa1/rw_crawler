document.addEventListener("DOMContentLoaded", () => {
  const domainResults = document.querySelector(".results");
  const domainResultsCount = document.querySelector(".resultsCount");
  const searchForm = document.querySelector(".search-form");
  const searchInput = document.querySelector(".search-input");
  const allDomains = document.querySelector(".allDomains");
  const domainCount = document.querySelector(".domainCount");

  fetch("../sites.json")
    .then((response) => response.json())
    .then((data) => {
      console.log(data);
      let sites = new Set();
      data.rwSites.forEach((site) => {
        sites.add(site);
      });
      console.log(sites);
      displayDomains(sites);

      searchForm.addEventListener("submit", (event) => {
        event.preventDefault();
        const query = searchInput.value.toLowerCase();
        const filteredData = sites.filter((item) => item.includes(query));
        displayResults(filteredData);
      });
    })
    .catch((error) => console.error("Error fetching sites.json:", error));

  function displayDomains(domains) {
    domainCount.innerHTML = `${domains.size || 0} URLs`;
    allDomains.innerHTML = "";
    domains.forEach((domain) => {
      const li = document.createElement("li");
      li.innerHTML = `<a href="${domain}" target="_blank">${domain}</a>`;
      allDomains.appendChild(li);
    });
  }

  function displayResults(domains) {
    domainResultsCount.innerHTML = `${domains.size || 0} Results`;
    domainResults.innerHTML = "";
    domains.forEach((domain) => {
      const li = document.createElement("li");
      li.innerHTML = `<a href="${domain}" target="_blank">${domain}</a>`;
      domainResults.appendChild(li);
    });
  }
});
