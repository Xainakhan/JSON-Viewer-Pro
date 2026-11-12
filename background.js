import { getJsonSourceUrl } from "./src/core/source-url.js";

const VIEWER_PAGE_PATH = "src/pages/viewer.html";

/**
 * Opens the standalone viewer so the action never depends on a popup lifecycle.
 *
 * @returns {Promise<void>}
 */
async function openViewerPage() {
  try {
    const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const sourceUrl = getJsonSourceUrl(activeTab?.url);
    const viewerUrl = new URL(chrome.runtime.getURL(VIEWER_PAGE_PATH));
    if (sourceUrl !== null) {
      viewerUrl.searchParams.set("source", sourceUrl);
    }
    await chrome.tabs.create({ url: viewerUrl.href });
  } catch (error) {
    console.error("JSON Viewer Pro could not open the viewer page.", error);
  }
}

chrome.action.onClicked.addListener(() => {
  void openViewerPage();
});
