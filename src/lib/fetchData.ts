export interface Fetched<T> {
  data: T;
  /** When the file last changed on the server (Last-Modified), if known. */
  lastModified: Date | null;
}

export class DataFileError extends Error {}

/**
 * Fetch a synced JSON file. `cache: 'no-cache'` makes the browser revalidate
 * on every poll (cheap 304s) so a display never shows a cached copy.
 */
export async function fetchDataFile<T>(
  url: string,
  parse: (raw: unknown) => T,
): Promise<Fetched<T>> {
  const res = await fetch(url, { cache: 'no-cache' });
  if (!res.ok) {
    throw new DataFileError(`${url} returned HTTP ${res.status}.`);
  }
  const text = await res.text();
  if (/^\s*</.test(text)) {
    // Either the file is missing and the server fell back to the app's page, or
    // the sync saved an upstream error page (e.g. SMHI's 404) as the data file.
    throw new DataFileError(`${url} contains a web page instead of data. The file may be missing, or the sync saved an error page.`);
  }
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new DataFileError(`${url} doesn't contain valid JSON.`);
  }
  const header = res.headers.get('last-modified');
  const lastModified = header ? new Date(header) : null;
  return {
    data: parse(raw),
    lastModified: lastModified && !isNaN(lastModified.getTime()) ? lastModified : null,
  };
}
