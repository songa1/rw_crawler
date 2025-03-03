import requests
from bs4 import BeautifulSoup
import logging
import time
import aiohttp
import asyncio
import json
import os
from urllib.parse import urlparse, urljoin
from urllib.robotparser import RobotFileParser

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - [Elapsed: %(relativeCreated)d ms] - %(message)s")

SITES_FILE = "sites.json"
STATE_FILE = "crawl_state.json"
MAX_PENDING = 5000
HEADERS = {"User-Agent": "Mozilla/5.0 (compatible; MyCrawler/1.0)"}
MAX_DEPTH = 2

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

def save_crawl_state(visited, pending, rw_sites):
    state = {
        "visited": list(visited),
        "pending": pending,
        "rwSites": list(rw_sites)
    }
    with open(STATE_FILE, "w", encoding="utf-8") as file:
        json.dump(state, file, indent=4)
    logging.info(f"Saved crawl state with {len(visited)} visited and {len(pending)} pending URLs.")

def load_crawl_state():
    if os.path.exists(STATE_FILE):
        try:
            with open(STATE_FILE, "r", encoding="utf-8") as file:
                data = json.load(file)
                return set(data.get("visited", [])), data.get("pending", []), set(data.get("rwSites", []))
        except json.JSONDecodeError:
            logging.warning("Could not decode JSON, starting fresh.")
    return set(), [], set()

def can_crawl(url):
    parsed_url = urlparse(url)
    robots_url = f"{parsed_url.scheme}://{parsed_url.netloc}/robots.txt"
    
    rp = RobotFileParser()
    rp.set_url(robots_url)
    try:
        rp.read()
        return rp.can_fetch("*", url)
    except:
        return True
    
async def crawl_page(session, url, rw_domains, visited_urls, urls_to_visit, depth):
    if url in visited_urls or depth > MAX_DEPTH:
        return

    if not can_crawl(url):
        logging.warning(f"Skipping {url} due to robots.txt restrictions.")
        return

    try:
        logging.info(f"Crawling: {url} (Depth {depth})")
        async with session.get(url, headers=HEADERS, timeout=10) as response:
            if response.status == 200:
                html = await response.text()
                soup = BeautifulSoup(html, "html.parser")
                visited_urls.add(url)

                for link in soup.find_all("a", href=True):
                    absolute_url = urljoin(url, link["href"])
                    parsed_url = urlparse(absolute_url)

                    if parsed_url.netloc.endswith(".rw") and absolute_url not in rw_domains:
                        rw_domains.add(absolute_url)
                        logging.info(f"Found .rw domain: {absolute_url}")

                    if absolute_url.startswith("http") and absolute_url not in visited_urls:
                        if len(urls_to_visit) < MAX_PENDING:
                            urls_to_visit.append((absolute_url, depth + 1))
                        else:
                            logging.warning("Pending queue full, skipping new URLs.")
    
    except Exception as e:
        logging.error(f"Error fetching URL {url}: {e}")

async def crawl_web(seed_urls):
    visited_urls, urls_to_visit, rw_domains = load_crawl_state()

    if not urls_to_visit:
        urls_to_visit = [(url, 0) for url in seed_urls]

    async with aiohttp.ClientSession() as session:
        tasks = []
        while urls_to_visit:
            url, depth = urls_to_visit.pop(0)
            tasks.append(crawl_page(session, url, rw_domains, visited_urls, urls_to_visit, depth))

            if len(urls_to_visit) > MAX_PENDING:
                urls_to_visit = urls_to_visit[-MAX_PENDING:]

            if len(tasks) >= 10: 
                await asyncio.gather(*tasks)
                tasks = []
                save_crawl_state(visited_urls, urls_to_visit, rw_domains)

        if tasks:
            await asyncio.gather(*tasks)

    save_crawl_state(visited_urls, urls_to_visit, rw_domains)
    save_sites(rw_domains)
    return rw_domains

if __name__ == "__main__":
    seed_urls = ["https://www.gov.rw/", "https://ur.ac.rw/", "newtimes.co.rw", "https://url.rw/", "https://www.ktpress.rw/", "https://rdb.rw/", "https://google.rw", "https://www.ricta.org.rw/"]
    rw_websites = asyncio.run(crawl_web(seed_urls))
    logging.info("Crawling complete")
    print(f"Websites with .rw domain: {rw_websites}")
