const VIEWER_PAGE_PATH = "src/pages/viewer.html";

/**
 * Opens the standalone viewer so the action never depends on a popup lifecycle.
 *
 * @returns {Promise<void>}
 */
async function openViewerPage() {
  try {
    await chrome.tabs.create({ url: chrome.runtime.getURL(VIEWER_PAGE_PATH) });
  } catch (error) {
    console.error("JSON Viewer Pro could not open the viewer page.", error);
  }
}

chrome.action.onClicked.addListener(() => {
  void openViewerPage();
});
