const COPY_FAILURE_MESSAGE = "Could not copy to the clipboard. Please try again.";

/**
 * Copies text through the browser clipboard API without exposing clipboard exceptions.
 *
 * @param {string} text Text to copy.
 * @returns {Promise<{ ok: true, error: null } | { ok: false, error: string }>} Copy result.
 */
export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return { ok: true, error: null };
  } catch (error) {
    console.warn("JSON Viewer Pro could not copy text.", error);
    return { ok: false, error: COPY_FAILURE_MESSAGE };
  }
}
