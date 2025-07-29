/**
 * Gets the current url and parses the query parameters.
 */
export function useUrl() {
    const url = new URL(window.location.href);
    const params = url.searchParams;
    const isMobile = params.get("mobile") === "true";
    const isCampus = params.get("campus") === "true";

    return {
        params,
        url,
        isMobile,
        isCampus
    }
}