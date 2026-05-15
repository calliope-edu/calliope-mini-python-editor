/**
 * Gets the current url and parses the query parameters.
 */
export function useUrl() {
    const url = new URL(window.location.href);
    const params = url.searchParams;
    const isMobile = params.get("mobile") === "true";
    const isCampus = params.get("campus") === "true";
    const controllerRaw = params.get("controller");
    const controllerParsed = controllerRaw ? parseInt(controllerRaw, 10) : 0;
    const controller = Number.isFinite(controllerParsed) ? controllerParsed : 0;
    // Level 2+ delegates flash, save and connection to the host (campus).
    const isControllerApp = controller >= 2;

    return {
        params,
        url,
        isMobile,
        isCampus,
        controller,
        isControllerApp,
    }
}
