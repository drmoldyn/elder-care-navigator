#!/usr/bin/env tsx
/**
 * Process Minnesota Assisted Living Report Card facilities into the unified ALF schema.
 *
 * Data source: https://alreportcard.dhs.mn.gov/
 * The public site exposes a search interface that renders facility details server-side.
 * This script simulates the user interaction sequence:
 *   1. Fetch the main search page to collect the facility id list and anti-forgery token.
 *   2. For each facility id, post to the Facilities handler to stage the selected facility.
 *   3. Post to the ResultsList handler to render the facility detail tab.
 *   4. Parse the resulting HTML to extract address, phone, license status, capacity, and map coordinates.
 *
 * Output: data/state/mn/alf-processed_YYYYMMDD.csv
 */

import fs from "fs";
import path from "path";
import { load, CheerioAPI } from "cheerio";
import { stringify } from "csv-stringify/sync";

const BASE_URL = "https://alreportcard.dhs.mn.gov";
const HEADERS = {
  "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
};

type CookieJar = Map<string, string>;

const REQUEST_DELAY_MS_RAW = Number.parseInt(process.env.MN_DELAY_MS ?? "100", 10);
const REQUEST_DELAY_MS = Number.isNaN(REQUEST_DELAY_MS_RAW) ? 100 : REQUEST_DELAY_MS_RAW;
const MAX_ATTEMPTS_RAW = Number.parseInt(process.env.MN_MAX_ATTEMPTS ?? "3", 10);
const MAX_ATTEMPTS = Number.isNaN(MAX_ATTEMPTS_RAW) ? 3 : Math.max(1, MAX_ATTEMPTS_RAW);
const CONCURRENCY_RAW = Number.parseInt(process.env.MN_CONCURRENCY ?? "3", 10);
const CONCURRENCY = Number.isNaN(CONCURRENCY_RAW)
  ? 3
  : Math.min(8, Math.max(1, CONCURRENCY_RAW));

interface FacilityRecord {
  state: string;
  state_license_number: string;
  facility_name: string;
  address: string;
  city: string;
  zip_code: string;
  county: string;
  phone: string;
  license_status: string;
  licensed_capacity: string;
  license_issue_date: string;
  license_expiration_date: string;
  facility_type: string;
  facility_type_detail: string;
  facility_type_code: string;
  provider_type: string;
  memory_care_certified: string;
  medicare_accepted: string;
  medicaid_accepted: string;
  description: string;
  source: string;
  latitude: string;
  longitude: string;
  last_updated_date: string;
  report_date: string;
}

interface FacilitySummary {
  id: string;
  name: string;
}

interface SessionState {
  jar: CookieJar;
  searchHtml: string;
}

async function createSession(): Promise<SessionState> {
  const jar: CookieJar = new Map();
  const resp = await fetchWithCookies(
    `${BASE_URL}/Search`,
    { method: "GET", headers: HEADERS },
    jar
  );

  if (!resp.ok) {
    throw new Error(`Failed to load initial Search page: ${resp.status}`);
  }

  const searchHtml = await resp.text();
  return { jar, searchHtml };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseSetCookie(header: string): [string, string] | null {
  const [pair] = header.split(";");
  const idx = pair.indexOf("=");
  if (idx === -1) return null;
  const name = pair.slice(0, idx).trim();
  const value = pair.slice(idx + 1).trim();
  return [name, value];
}

async function fetchWithCookies(
  url: string,
  options: RequestInit,
  jar: CookieJar
): Promise<Response> {
  const headers = new Headers(options.headers as HeadersInit | undefined);
  if (jar.size > 0) {
    const cookieHeader = Array.from(jar.entries())
      .map(([name, value]) => `${name}=${value}`)
      .join("; ");
    headers.set("Cookie", cookieHeader);
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const headersAny = response.headers as any;
  let setCookies: string[] = [];

  if (typeof headersAny.raw === "function") {
    const raw = headersAny.raw();
    setCookies = raw?.["set-cookie"] ?? [];
  } else if (typeof headersAny.getSetCookie === "function") {
    setCookies = headersAny.getSetCookie();
  } else {
    const single = response.headers.get("set-cookie");
    if (single) setCookies = [single];
  }
  for (const cookie of setCookies) {
    const parsed = parseSetCookie(cookie);
    if (!parsed) continue;
    const [name, value] = parsed;
    jar.set(name, value);
  }

  return response;
}

function extractFacilityList(html: string): FacilitySummary[] {
  const $ = load(html);
  const options = $("select#selFacs option")
    .map((_, el) => {
      const value = $(el).attr("value")?.trim();
      const name = $(el).text().trim();
      return value && value !== "0" && name ? { id: value, name } : null;
    })
    .get()
    .filter((item): item is FacilitySummary => item !== null);

  const unique = new Map<string, FacilitySummary>();
  for (const item of options) {
    if (!unique.has(item.id)) {
      unique.set(item.id, item);
    }
  }
  return Array.from(unique.values()).sort((a, b) => Number(a.id) - Number(b.id));
}

function toFormBody(data: Record<string, string | string[]>): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(data)) {
    if (Array.isArray(value)) {
      for (const v of value) params.append(key, v);
    } else {
      params.append(key, value);
    }
  }
  return params.toString();
}

function parseAddress(fullAddress: string): { address: string; city: string; zip: string } {
  const normalized = fullAddress.replace(/\s+/g, " ").trim();
  const parts = normalized.split(",");
  const street = parts[0]?.trim() ?? "";
  let city = "";
  let zip = "";
  if (parts.length >= 2) {
    city = parts[1]?.replace(/MN$/i, "").trim();
  }
  if (parts.length >= 3) {
    const stateZip = parts[2].trim();
    const match = stateZip.match(/MN\s*(\d{5})/i);
    if (match) {
      zip = match[1];
      city = city || parts[1].trim();
    } else {
      const zipMatch = stateZip.match(/(\d{5})/);
      if (zipMatch) zip = zipMatch[1];
    }
  }
  return { address: street, city, zip };
}

function extractLatLng(detailHtml: string, facilityName: string): { lat: string; lng: string } {
  const markerRegex = /point\s*=\s*new google\.maps\.LatLng\(([^)]+)\);\s*contentString\s*=\s*"<b>([^<]+)<\/b>/g;
  let match: RegExpExecArray | null;
  while ((match = markerRegex.exec(detailHtml)) !== null) {
    const coords = match[1].split(",");
    const markerName = match[2].trim();
    if (markerName === facilityName) {
      const lat = coords[0]?.trim() ?? "";
      const lng = coords[1]?.trim() ?? "";
      return { lat, lng };
    }
  }
  return { lat: "", lng: "" };
}

function extractReportDate(detail$: CheerioAPI, facId: string): string {
  const rows = detail$(`#pre-${facId}-tab table tr`).toArray();
  for (const row of rows) {
    const cols = detail$(row).find("td");
    if (cols.length === 0) continue;
    const dateText = detail$(cols[0]).text().trim();
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateText)) {
      const [month, day, year] = dateText.split("/");
      return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
    }
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateText)) {
      return dateText;
    }
  }
  return "";
}

async function processFacility(
  facility: FacilitySummary,
  session: SessionState
): Promise<{ record: FacilityRecord | null; session: SessionState; success: boolean }> {
  let currentSession = session;

  if (!currentSession.searchHtml) {
    if (process.env.DEBUG_MN === "1") {
      console.warn("DEBUG session missing search HTML; forcing refresh");
    }
    return { record: null, session: currentSession, success: false };
  }

  const search$ = load(currentSession.searchHtml);
  const facilitiesForm = search$("#selFacs").closest("form");
  const facilitiesToken = facilitiesForm
    .find('input[name="__RequestVerificationToken"]')
    .attr("value")
    ?.trim();

  if (!facilitiesToken) {
    console.warn(`⚠️  Missing facilities token for ${facility.id}`);
    return { record: null, session: currentSession, success: false };
  }

  const facilitiesBody = toFormBody({
    SelectedFromFacilityList: [facility.id],
    __RequestVerificationToken: facilitiesToken,
  });

  if (process.env.DEBUG_MN === "1") {
    console.log("DEBUG facilities payload", facilitiesBody);
  }

  const facilitiesResp = await fetchWithCookies(
    `${BASE_URL}/Search?handler=Facilities`,
    {
      method: "POST",
      headers: {
        ...HEADERS,
        Referer: `${BASE_URL}/Search`,
        Origin: BASE_URL,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: facilitiesBody,
    },
    currentSession.jar
  );

  if (!facilitiesResp.ok) {
    const body = process.env.DEBUG_MN === "1" ? await facilitiesResp.text() : "";
    if (process.env.DEBUG_MN === "1") {
      console.warn(`DEBUG facilities response body: ${body.slice(0, 200)}`);
    }
    console.warn(`⚠️  Facilities handler failed for ${facility.id}: ${facilitiesResp.status}`);
    return { record: null, session: currentSession, success: false };
  }

  const facilitiesHtml = await facilitiesResp.text();
  const facilities$ = load(facilitiesHtml);

  currentSession = {
    jar: currentSession.jar,
    searchHtml: facilitiesHtml,
  };

  const resultFormInput = facilities$(`form[action="/Search?handler=ResultsList"] input[name="FacIdNum"][value="${facility.id}"]`).first();
  if (!resultFormInput.length) {
    console.warn(`⚠️  Result form not found for ${facility.id}`);
    return { record: null, session: currentSession, success: false };
  }

  const resultForm = resultFormInput.closest("form");
  const resultToken = resultForm.find('input[name="__RequestVerificationToken"]').attr("value")?.trim();
  if (!resultToken) {
    console.warn(`⚠️  Missing results token for ${facility.id}`);
    return { record: null, session: currentSession, success: false };
  }

  const resultsBody = toFormBody({
    FacIdNum: facility.id,
    __RequestVerificationToken: resultToken,
  });

  if (process.env.DEBUG_MN === "1") {
    console.log("DEBUG results payload", resultsBody.slice(0, 80) + "...");
  }

  const resultsResp = await fetchWithCookies(
    `${BASE_URL}/Search?handler=ResultsList`,
    {
      method: "POST",
      headers: {
        ...HEADERS,
        Referer: `${BASE_URL}/Search?handler=Facilities`,
        Origin: BASE_URL,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: resultsBody,
    },
    currentSession.jar
  );

  if (!resultsResp.ok) {
    console.warn(`⚠️  Results handler failed for ${facility.id}: ${resultsResp.status}`);
    return { record: null, session: currentSession, success: false };
  }

  const detailHtml = await resultsResp.text();
  const detail$ = load(detailHtml);

  const headingSelector = `#pre-${facility.id}-tab #divFacHeading`;
  const heading = detail$(headingSelector);
  const name = heading.find("h3").first().text().trim() || facility.name;
  const h5s = heading.find("h5");
  const addressLine = h5s.eq(0).text().replace(/\s+/g, " ").trim();
  const phone = h5s.eq(1).text().trim();
  const { address, city: cityFromAddress, zip } = parseAddress(addressLine);

  const listInput = detail$(`form[action="/Search?handler=ResultsList"] input[name="FacIdNum"][value="${facility.id}"]`).first();
  const listRow = listInput.closest("tr");
  const listCols = listRow.find("td");
  const city = listCols.eq(1).text().trim() || cityFromAddress;
  const licenseStatus = listCols.eq(2).text().trim();
  const capacityText = listCols.eq(3).text().trim();

  const capacity = capacityText && !Number.isNaN(Number(capacityText)) ? String(Number(capacityText)) : "";

  const { lat, lng } = extractLatLng(detailHtml, name);
  const reportDate = extractReportDate(detail$, facility.id);

  const record: FacilityRecord = {
    state: "MN",
    state_license_number: facility.id,
    facility_name: name,
    address,
    city,
    zip_code: zip,
    county: "",
    phone,
    license_status: licenseStatus || "",
    licensed_capacity: capacity,
    license_issue_date: "",
    license_expiration_date: "",
    facility_type: "Assisted Living Facility",
    facility_type_detail: "",
    facility_type_code: "ALF",
    provider_type: "assisted_living",
    memory_care_certified: "",
    medicare_accepted: "",
    medicaid_accepted: "",
    description: `${name} is an assisted living facility in ${city || "Minnesota"}.`,
    source: "MN_DHS_ASSISTED_LIVING_REPORT_CARD",
    latitude: lat,
    longitude: lng,
    last_updated_date: reportDate,
    report_date: reportDate,
  };

  return { record, session: currentSession, success: true };
}

async function main() {
  console.log("📥 Fetching Minnesota Assisted Living facility roster...");
  let session = await createSession();
  const facilityList = extractFacilityList(session.searchHtml);
  console.log(`📑 Found ${facilityList.length} facility entries`);

  const rawDir = path.join("data", "state", "mn", "raw");
  fs.mkdirSync(rawDir, { recursive: true });
  fs.writeFileSync(path.join(rawDir, "facility-list.json"), JSON.stringify(facilityList, null, 2));

  const limit = process.env.MN_LIMIT
    ? Math.min(facilityList.length, Number(process.env.MN_LIMIT))
    : facilityList.length;

  const records: Array<FacilityRecord | null> = Array(limit).fill(null);
  const skippedFacilities: FacilitySummary[] = [];
  let processedCount = 0;
  let nextIndex = 0;

  const workerCount = Math.min(CONCURRENCY, limit);
  if (workerCount > 1) {
    console.log(`⚙️  Using ${workerCount} concurrent sessions`);
  }

  const workers = Array.from({ length: workerCount }, async (_, workerIdx) => {
    let workerSession = workerIdx === 0 ? session : await createSession();

    while (true) {
      const idx = nextIndex;
      if (idx >= limit) {
        break;
      }
      nextIndex += 1;

      const facility = facilityList[idx];
      let attempts = 0;
      let success = false;

      while (attempts < MAX_ATTEMPTS && !success) {
        try {
          const result = await processFacility(facility, workerSession);
          workerSession = result.session;

          if (result.success && result.record) {
            records[idx] = result.record;
            success = true;
          } else {
            attempts += 1;
            if (attempts < MAX_ATTEMPTS) {
              workerSession = await createSession();
            }
          }
        } catch (error) {
          attempts += 1;
          console.warn(`⚠️  Error processing facility ${facility.id}:`, error);
          if (attempts < MAX_ATTEMPTS) {
            workerSession = await createSession();
          }
        }
      }

      if (!success) {
        skippedFacilities.push(facility);
      }

      const processedSoFar = ++processedCount;
      if (processedSoFar % 100 === 0 || processedSoFar === limit) {
        console.log(`   → Processed ${processedSoFar} / ${limit}`);
      }

      if (REQUEST_DELAY_MS > 0 && processedSoFar < limit) {
        await sleep(Math.max(0, REQUEST_DELAY_MS));
      }
    }
  });

  await Promise.all(workers);

  const outputRecords = records.filter((record): record is FacilityRecord => record !== null);

  if (skippedFacilities.length > 0) {
    console.warn(
      `⚠️  Skipped ${skippedFacilities.length} facilities due to repeated failures: ${skippedFacilities
        .slice(0, 10)
        .map((fac) => fac.id)
        .join(", ")}${skippedFacilities.length > 10 ? " ..." : ""}`
    );
  }

  const dateStamp = new Date().toISOString().split("T")[0].replace(/-/g, "");
  const outputDir = path.join("data", "state", "mn");
  fs.mkdirSync(outputDir, { recursive: true });
  const outputPath = path.join(outputDir, `alf-processed_${dateStamp}.csv`);

  const columnSource = outputRecords[0] ?? records.find((record): record is FacilityRecord => record !== null);
  if (!columnSource) {
    throw new Error("No facility records were processed successfully.");
  }

  const columns = Object.keys(columnSource);
  const csv = stringify(outputRecords, { header: true, columns });
  fs.writeFileSync(outputPath, csv);

  console.log(`✅ MN facilities processed: ${outputRecords.length}`);
  console.log(`📝 Output written to ${outputPath}`);
}

main().catch((error) => {
  console.error("❌ Failed to process Minnesota Assisted Living data:", error);
  process.exit(1);
});
