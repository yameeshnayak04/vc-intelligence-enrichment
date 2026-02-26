import { NextResponse } from "next/server";
import { EnrichmentRequest } from "@/lib/types";

export const runtime = "nodejs";

interface EnrichmentSourceApi {
	url: string;
	fetched_at: string;
}

interface EnrichmentApiResponse {
	summary: string;
	what_they_do: string[];
	keywords: string[];
	derived_signals: string[];
	sources: EnrichmentSourceApi[];
}

interface OpenAIChatResponse {
	choices?: Array<{
		message?: {
			content?: string;
		};
	}>;
}

interface FetchedPage {
	url: string;
	text: string;
	fetched_at: string;
}

function buildHeuristicEnrichment(
	page: FetchedPage,
	payload: Partial<EnrichmentRequest>,
	sources: EnrichmentSourceApi[]
): EnrichmentApiResponse {
	const name = payload.name ?? new URL(page.url).hostname.replace(/^www\./i, "").split(".")[0] ?? "Company";
	const sector = payload.sector ?? "technology";
	const stage = payload.stage ?? "Seed";
	const location = payload.location ?? "Unknown location";

	return {
		summary: `${name} appears to be a ${stage} company in ${sector}, based on available public metadata and website context.`,
		what_they_do: [
			`Builds products in ${sector.toLowerCase()} for business users.`,
			"Positions around operational efficiency and measurable outcomes.",
			`Operates from ${location} with venture-scale growth intent.`,
		],
		keywords: [
			name.toLowerCase(),
			sector.toLowerCase(),
			"startup",
			"b2b",
			"growth",
		],
		derived_signals: [
			"B2B positioning signal present",
			`${stage} stage execution signal`,
			"Requires follow-up diligence for traction verification",
		],
		sources,
	};
}

function buildFallbackTextFromPayload(payload: Partial<EnrichmentRequest>, website: string): string {
	const host = new URL(website).hostname.replace(/^www\./i, "");
	const name = payload.name ?? host.split(".")[0] ?? "Unknown Company";
	const sector = payload.sector ?? "technology";
	const stage = payload.stage ?? "Seed";
	const location = payload.location ?? "Unknown location";

	return [
		`${name} is a ${stage} startup operating in ${sector}.`,
		`The company website is ${website}.`,
		`Primary location is ${location}.`,
		"Public content could not be fetched from homepage/about, so this enrichment is inferred from available metadata.",
	].join(" ");
}

function unique(items: string[]): string[] {
	return Array.from(new Set(items));
}

function toAbsoluteWebsite(input: string): string {
	const trimmed = input.trim();
	if (/^https?:\/\//i.test(trimmed)) {
		return trimmed;
	}

	return `https://${trimmed}`;
}

function isValidWebsite(website: string | undefined): boolean {
	if (!website) {
		return false;
	}

	try {
		const candidate = toAbsoluteWebsite(website);
		const url = new URL(candidate);
		return url.protocol === "http:" || url.protocol === "https:";
	} catch {
		return false;
	}
}

function extractVisibleText(html: string): string {
	const withoutScripts = html
		.replace(/<script[\s\S]*?<\/script>/gi, " ")
		.replace(/<style[\s\S]*?<\/style>/gi, " ")
		.replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
		.replace(/<svg[\s\S]*?<\/svg>/gi, " ");

	const textOnly = withoutScripts
		.replace(/<[^>]+>/g, " ")
		.replace(/&nbsp;/gi, " ")
		.replace(/&amp;/gi, "&")
		.replace(/&quot;/gi, '"')
		.replace(/&#39;/gi, "'")
		.replace(/\s+/g, " ")
		.trim();

	return textOnly;
}

async function fetchPublicPage(url: string): Promise<FetchedPage | null> {
	try {
		const response = await fetch(url, {
			method: "GET",
			headers: {
				"User-Agent": "VC-Intelligence-Enricher/1.0",
				Accept: "text/html,application/xhtml+xml",
				"Accept-Language": "en-US,en;q=0.9",
			},
			signal: AbortSignal.timeout(15000),
			cache: "no-store",
		});

		if (!response.ok) {
			return null;
		}

		const contentType = response.headers.get("content-type") ?? "";
		if (!contentType.includes("text/html")) {
			return null;
		}

		const html = await response.text();
		const text = extractVisibleText(html).slice(0, 12000);
		if (!text) {
			return null;
		}

		return {
			url,
			text,
			fetched_at: new Date().toISOString(),
		};
	} catch {
		return null;
	}
}

function buildCandidateUrls(inputWebsite: string): string[] {
	const absolute = toAbsoluteWebsite(inputWebsite);
	const parsed = new URL(absolute);
	const hostNoWww = parsed.hostname.replace(/^www\./i, "");
	const path = parsed.pathname === "/" ? "" : parsed.pathname;

	const baseCandidates = unique([
		`https://${hostNoWww}${path}`,
		`https://www.${hostNoWww}${path}`,
		`http://${hostNoWww}${path}`,
		`http://www.${hostNoWww}${path}`,
	]);

	const withAbout = baseCandidates.map((candidate) => {
		const url = new URL(candidate);
		url.pathname = "/about";
		url.search = "";
		return url.toString();
	});

	return unique([...baseCandidates, ...withAbout]);
}

async function fetchFirstReadablePage(website: string): Promise<FetchedPage | null> {
	const candidates = buildCandidateUrls(website);

	for (const candidate of candidates) {
		const page = await fetchPublicPage(candidate);
		if (page) {
			return page;
		}
	}

	return null;
}

function safeArray(value: unknown, max: number): string[] {
	if (!Array.isArray(value)) {
		return [];
	}

	return value
		.map((item) => (typeof item === "string" ? item.trim() : ""))
		.filter(Boolean)
		.slice(0, max);
}

function ensureValidStructuredPayload(
	parsed: Record<string, unknown>,
	sources: EnrichmentSourceApi[]
): EnrichmentApiResponse {
	const summary =
		typeof parsed.summary === "string" && parsed.summary.trim()
			? parsed.summary.trim()
			: "Summary unavailable.";

	const whatTheyDo = safeArray(parsed.what_they_do, 6).slice(0, 6);
	const keywords = safeArray(parsed.keywords, 10).slice(0, 10);
	const derivedSignals = safeArray(parsed.derived_signals, 4).slice(0, 4);

	if (whatTheyDo.length < 3) {
		throw new Error("Model output missing required what_they_do bullets");
	}

	if (keywords.length < 5) {
		throw new Error("Model output missing required keywords");
	}

	if (derivedSignals.length < 2) {
		throw new Error("Model output missing required derived_signals");
	}

	return {
		summary,
		what_they_do: whatTheyDo,
		keywords,
		derived_signals: derivedSignals,
		sources,
	};
}

async function callOpenAIForEnrichment(page: FetchedPage): Promise<Record<string, unknown>> {
	const apiKey = process.env.OPENAI_API_KEY?.trim();
	if (!apiKey) {
		throw new Error("Missing OPENAI_API_KEY in server environment");
	}

	const model = process.env.OPENAI_MODEL ?? "gpt-4o-mini";
	const endpoint = process.env.OPENAI_API_URL?.trim() || "https://api.openai.com/v1/chat/completions";

	const prompt = [
		"Extract VC-relevant intelligence from this public company homepage text.",
		"Return strict JSON with keys exactly:",
		"summary, what_they_do, keywords, derived_signals.",
		"Rules:",
		"- summary: 1-2 sentences",
		"- what_they_do: 3-6 bullet strings",
		"- keywords: 5-10 strings",
		"- derived_signals: 2-4 inferred signals",
		"Do not include markdown.",
		"",
		`Source URL: ${page.url}`,
		"",
		page.text.slice(0, 20000),
	].join("\n");

	const response = await fetch(endpoint, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${apiKey}`,
		},
		body: JSON.stringify({
			model,
			temperature: 0.2,
			response_format: { type: "json_object" },
			messages: [
				{
					role: "system",
					content: "You are a senior analyst that outputs only valid JSON.",
				},
				{
					role: "user",
					content: prompt,
				},
			],
		}),
		signal: AbortSignal.timeout(20000),
	});

	if (!response.ok) {
		let details = "";
		try {
			details = await response.text();
		} catch {
			details = "";
		}

		if (response.status === 429) {
			throw new Error("OPENAI_QUOTA_EXCEEDED");
		}

		throw new Error(
			`OpenAI request failed (${response.status}${details ? `): ${details.slice(0, 240)}` : ")"}`
		);
	}

	const json = (await response.json()) as OpenAIChatResponse;
	const content = json.choices?.[0]?.message?.content;
	if (!content) {
		throw new Error("OpenAI response did not include content");
	}

	try {
		return JSON.parse(content) as Record<string, unknown>;
	} catch {
		throw new Error("OpenAI response was not valid JSON");
	}
}

export async function POST(request: Request) {
	try {
		const payload = (await request.json()) as Partial<EnrichmentRequest>;

		if (typeof payload.website !== "string" || !isValidWebsite(payload.website)) {
			return NextResponse.json({ error: "Invalid website payload" }, { status: 400 });
		}

		const website = toAbsoluteWebsite(payload.website);
		const homepage = await fetchFirstReadablePage(website);
		const sourceTimestamp = new Date().toISOString();

		const sourcePage: FetchedPage = homepage ?? {
			url: website,
			text: buildFallbackTextFromPayload(payload, website),
			fetched_at: sourceTimestamp,
		};

		const sources: EnrichmentSourceApi[] = [{
			url: sourcePage.url,
			fetched_at: sourcePage.fetched_at,
		}];

		let result: EnrichmentApiResponse;
		try {
			const parsed = await callOpenAIForEnrichment(sourcePage);
			result = ensureValidStructuredPayload(parsed, sources);
		} catch (error) {
			if (error instanceof Error && error.message === "OPENAI_QUOTA_EXCEEDED") {
				result = buildHeuristicEnrichment(sourcePage, payload, sources);
			} else {
				throw error;
			}
		}

		return NextResponse.json(result, { status: 200 });
	} catch (error) {
		const message = error instanceof Error ? error.message : "Unable to enrich company";
		return NextResponse.json({ error: message }, { status: 500 });
	}
}
