import { EnrichmentRequest, EnrichmentResponse } from "@/lib/types";

function extractDomain(website: string): string {
	return website.replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0] ?? website;
}

function baseKeywords(sector?: string, stage?: string): string[] {
	const keywords = ["b2b", "growth", "execution"];

	if (sector) {
		keywords.unshift(...sector.toLowerCase().split(/\s+/));
	}

	if (stage) {
		keywords.push(stage.toLowerCase());
	}

	return Array.from(new Set(keywords)).slice(0, 8);
}

export function generateEnrichment(input: EnrichmentRequest): EnrichmentResponse {
	const generatedAt = new Date().toISOString();
	const domain = extractDomain(input.website);
	const companyName = input.name ?? domain.split(".")[0] ?? "Unknown Company";
	const sector = input.sector ?? "Emerging Technology";
	const stage = input.stage ?? "Seed";
	const location = input.location ?? "Unknown location";

	return {
		companyId: input.companyId ?? domain,
		website: input.website,
		summary: `${companyName} appears to be a ${stage} company in ${sector} based in ${location}, with positioning oriented toward venture-scale expansion potential.`,
		whatTheyDo: [
			`Builds products in ${sector.toLowerCase()} for business users.`,
			"Focuses on workflow efficiency and measurable operational outcomes.",
			"Targets repeatable expansion through product-led and enterprise channels.",
		],
		keywords: baseKeywords(sector, stage),
		derivedSignals: [
			{
				label: "Category Momentum",
				value: "High",
				rationale: `${sector} remains active for institutional investors looking for scalable platforms.`,
			},
			{
				label: "Execution Readiness",
				value: stage === "Pre-Seed" ? "Low" : stage === "Seed" ? "Medium" : "High",
				rationale: `${stage} stage indicates current maturity for operational scaling and diligence depth.`,
			},
			{
				label: "Commercial Clarity",
				value: "Medium",
				rationale: "Public positioning suggests a clear buyer problem, but monetization depth needs validation.",
			},
		],
		sources: [
			{ title: "Company Website", url: input.website, timestamp: generatedAt },
			{ title: "Domain Snapshot", url: `https://${domain}`, timestamp: generatedAt },
		],
		generatedAt,
	};
}
