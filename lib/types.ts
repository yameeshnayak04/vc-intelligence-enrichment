export type SignalDirection = "positive" | "neutral" | "negative";

export type SignalStrength = "high" | "medium" | "low";

export type CompanyStage = "Pre-Seed" | "Seed" | "Series A" | "Series B+";

export interface Company {
	id: string;
	name: string;
	website: string;
	sector: string;
	location: string;
	stage: CompanyStage;
	domain?: string;
	hq?: string;
	description?: string;
	employees?: number;
	lastRound?: string;
}

export interface InvestmentSignal {
	label: string;
	direction: SignalDirection;
	strength: SignalStrength;
	rationale: string;
}

export interface EnrichmentDerivedSignal {
	label: string;
	value: "High" | "Medium" | "Low";
	rationale: string;
}

export interface EnrichmentSource {
	title: string;
	url: string;
	timestamp: string;
}

export interface EnrichmentResult {
	companyId: string;
	website: string;
	summary: string;
	whatTheyDo: string[];
	keywords: string[];
	derivedSignals: EnrichmentDerivedSignal[];
	sources: EnrichmentSource[];
	generatedAt: string;
	thesis?: string;
	signals?: InvestmentSignal[];
	risks?: string[];
}

export interface EnrichmentRequest {
	website: string;
	companyId?: string;
	name?: string;
	sector?: string;
	stage?: CompanyStage;
	location?: string;
}

export interface SavedSearch {
	id: string;
	name: string;
	filters: {
		query: string;
		sector: string;
		stage: string;
	};
	createdAt: string;
}

export interface CompanyList {
	id: string;
	name: string;
	companyIds: string[];
}

export type EnrichmentResponse = EnrichmentResult;

export interface SavedProfile {
	company: Company;
	enrichment?: EnrichmentResult;
	savedAt: string;
}

export type VCList = CompanyList & {
	createdAt: string;
	updatedAt: string;
};
