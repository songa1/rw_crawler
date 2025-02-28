import requests
from bs4 import BeautifulSoup
import logging
import time
import json
import os
from urllib.parse import urlparse

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - [Elapsed: %(relativeCreated)d ms] - %(message)s")

SITES_FILE = "sites.json"

def load_existing_sites():
    if os.path.exists(SITES_FILE):
        try:
            with open(SITES_FILE, "r", encoding="utf-8") as file:
                data = json.load(file)
                return set(data.get("rwSites", []))
        except json.JSONDecodeError:
            logging.warning("Could not decode JSON, starting fresh.")
    return set()

def save_sites(sites):
    sorted_sites = sorted(sites)
    with open(SITES_FILE, "w", encoding="utf-8") as file:
        json.dump({"rwSites": sorted_sites}, file, indent=4)
    logging.info(f"Saved {len(sorted_sites)} .rw domains to {SITES_FILE}")

def crawl_web(seed_urls):
    visited_urls = set()
    rw_domains = load_existing_sites()
    urls_to_visit = list(seed_urls)
    
    while urls_to_visit:
        url = urls_to_visit.pop(0)

        if url in visited_urls:
            continue

        try:
            logging.info(f"Crawling: {url}")
            response = requests.get(url, timeout=5)
            response.raise_for_status()

            visited_urls.add(url)

            soup = BeautifulSoup(response.content, "html.parser")

            for link in soup.find_all("a", href=True):
                absolute_url = link["href"]

                parsed_url = urlparse(absolute_url)
                if parsed_url.netloc.endswith(".rw") and absolute_url not in visited_urls and absolute_url not in urls_to_visit:
                    rw_domains.add(absolute_url)
                    logging.info(f"Found .rw domain: {absolute_url}")

                if absolute_url.startswith("http") and absolute_url not in visited_urls and absolute_url not in urls_to_visit:
                  urls_to_visit.append(absolute_url)

        except requests.exceptions.RequestException as e:
            logging.error(f"Error fetching URL {url}: {e}")
            if isinstance(e, requests.exceptions.HTTPError) and e.response.status_code == 403:
              logging.warning(f"Got 403 Forbidden for {url}")
            time.sleep(1)
        except Exception as e:
            logging.exception(f"An unexpected error occurred while crawling {url}: {e}")
            
        time.sleep(0.5)
    save_sites(rw_domains)
    return rw_domains

if __name__ == "__main__":
    seed_urls = ["https://www.gov.rw/", "https://www.wikipedia.org", "https://google.rw", "https://rw.wikipedia.org/wiki/Intangiriro"]
    rw_websites = crawl_web(seed_urls)
    
    logging.info("Crawling complete")
    print(f"Websites with .rw domain: {rw_websites}")
