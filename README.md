# RW CRAWLER

## ALGORITHM

IMPORT required libraries (requests, BeautifulSoup, aiohttp, asyncio, json, logging, etc.)

SET GLOBAL CONSTANTS:
    - MAX_DEPTH = 2
    - HEADERS = {"User-Agent": "Mozilla/5.0 (compatible; MyCrawler/1.0)"}
    - SITES_FILE = "sites.json"
    - STATE_FILE = "crawl_state.json"

FUNCTION load_existing_sites():
    IF SITES_FILE exists:
        READ and return saved ".rw" domains
    ELSE:
        RETURN an empty set

FUNCTION save_sites(sites):
    SAVE sorted .rw domains to SITES_FILE

FUNCTION save_crawl_state(visited, pending, rw_sites):
    SAVE visited pages, pending queue, and .rw sites to STATE_FILE

FUNCTION load_crawl_state():
    IF STATE_FILE exists:
        RETURN saved visited URLs, pending queue, and .rw domains
    ELSE:
        RETURN empty structures

FUNCTION can_crawl(url):
    PARSE robots.txt file of the domain
    RETURN whether crawling is allowed

ASYNC FUNCTION crawl_page(session, url, rw_domains, visited_urls, urls_to_visit, depth):
    IF url is already visited OR depth > MAX_DEPTH:
        RETURN

    IF robots.txt blocks crawling:
        LOG skipping URL
        RETURN

    TRY:
        FETCH page content
        PARSE HTML with BeautifulSoup
        ADD URL to visited list

    FOR each link in the page:
            CONVERT link to absolute URL
            IF URL ends with ".rw" and not already found:
                ADD to rw_domains
                LOG new .rw domain found
            IF URL is valid and not visited:
                ADD to pending queue

    EXCEPT errors:
        LOG error message

ASYNC FUNCTION crawl_web(seed_urls):
    LOAD saved crawl state

    IF no pending URLs:
        INITIALIZE queue with seed URLs

    CREATE an HTTP session
    WHILE pending URLs exist:
        PICK URL and depth from queue
        ADD crawl_page task to async queue

    IF queue reaches batch size (e.g., 10 tasks):
            EXECUTE all tasks asynchronously
            SAVE current state

    IF remaining tasks exist:
        EXECUTE remaining tasks
    SAVE final state and found sites
    RETURN .rw sites
