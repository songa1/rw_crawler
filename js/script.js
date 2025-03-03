document.addEventListener("DOMContentLoaded", () => {
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
    })
    .catch((error) => console.error("Error fetching sites.json:", error));

  function displayDomains(domains) {
    domainCount.innerHTML = `${domains.size || 0} URLs`;
    allDomains.innerHTML = "";
    domains.forEach((domain) => {
      const li = document.createElement("li");
      li.innerHTML = `<a href="${domain}" target="_blank" style="word-wrap: break-word;">${domain}</a>`;
      allDomains.appendChild(li);
    });
  }
});
