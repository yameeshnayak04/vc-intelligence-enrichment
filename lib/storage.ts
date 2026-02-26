import { v4 as uuidv4 } from "uuid";
import {
	Company,
	CompanyList,
	EnrichmentResponse,
	EnrichmentResult,
	SavedProfile,
	SavedSearch,
	VCList,
} from "@/lib/types";

const SAVED_PROFILES_KEY = "vc:savedProfiles";
const VC_LISTS_KEY = "vc:lists";
const COMPANY_NOTES_KEY = "vc:companyNotes";
const ENRICHMENT_RESULTS_KEY = "vc:enrichmentResults";
const SAVED_SEARCHES_KEY = "vc:savedSearches";

const isBrowser = () => typeof window !== "undefined";

function readFromStorage<T>(key: string, fallback: T): T {
	if (!isBrowser()) {
		return fallback;
	}

	const raw = window.localStorage.getItem(key);
	if (!raw) {
		return fallback;
	}

	try {
		return JSON.parse(raw) as T;
	} catch {
		return fallback;
	}
}

function writeToStorage<T>(key: string, value: T) {
	if (!isBrowser()) {
		return;
	}

	window.localStorage.setItem(key, JSON.stringify(value));
}

export function getCompanyNotes(): Record<string, string> {
	return readFromStorage<Record<string, string>>(COMPANY_NOTES_KEY, {});
}

export function getCompanyNote(companyId: string): string {
	return getCompanyNotes()[companyId] ?? "";
}

export function saveCompanyNote(companyId: string, note: string): Record<string, string> {
	const notes = getCompanyNotes();
	const nextNotes = {
		...notes,
		[companyId]: note,
	};

	writeToStorage(COMPANY_NOTES_KEY, nextNotes);
	return nextNotes;
}

export function removeCompanyNote(companyId: string): Record<string, string> {
	const notes = getCompanyNotes();
	const nextNotes = { ...notes };
	delete nextNotes[companyId];
	writeToStorage(COMPANY_NOTES_KEY, nextNotes);
	return nextNotes;
}

export function getEnrichmentResults(): Record<string, EnrichmentResult> {
	return readFromStorage<Record<string, EnrichmentResult>>(ENRICHMENT_RESULTS_KEY, {});
}

export function getEnrichmentResult(companyId: string): EnrichmentResult | undefined {
	return getEnrichmentResults()[companyId];
}

export function saveEnrichmentResult(
	companyId: string,
	enrichmentResult: EnrichmentResult
): Record<string, EnrichmentResult> {
	const currentResults = getEnrichmentResults();
	const nextResults = {
		...currentResults,
		[companyId]: enrichmentResult,
	};

	writeToStorage(ENRICHMENT_RESULTS_KEY, nextResults);
	return nextResults;
}

export function removeEnrichmentResult(companyId: string): Record<string, EnrichmentResult> {
	const currentResults = getEnrichmentResults();
	const nextResults = { ...currentResults };
	delete nextResults[companyId];
	writeToStorage(ENRICHMENT_RESULTS_KEY, nextResults);
	return nextResults;
}

export function getSavedProfiles(): SavedProfile[] {
	return readFromStorage<SavedProfile[]>(SAVED_PROFILES_KEY, []);
}

export function getSavedProfile(companyId: string): SavedProfile | undefined {
	return getSavedProfiles().find((profile) => profile.company.id === companyId);
}

export function isSaved(companyId: string): boolean {
	return getSavedProfiles().some((profile) => profile.company.id === companyId);
}

export function saveProfile(company: Company, enrichment?: EnrichmentResponse): SavedProfile[] {
	const profiles = getSavedProfiles();
	const existingIndex = profiles.findIndex((profile) => profile.company.id === company.id);

	const updatedProfile: SavedProfile = {
		company,
		enrichment: enrichment ?? profiles[existingIndex]?.enrichment,
		savedAt: new Date().toISOString(),
	};

	if (existingIndex >= 0) {
		profiles[existingIndex] = updatedProfile;
	} else {
		profiles.unshift(updatedProfile);
	}

	writeToStorage(SAVED_PROFILES_KEY, profiles);
	return profiles;
}

export function removeSavedProfile(companyId: string): SavedProfile[] {
	const nextProfiles = getSavedProfiles().filter((profile) => profile.company.id !== companyId);
	writeToStorage(SAVED_PROFILES_KEY, nextProfiles);
	return nextProfiles;
}

export function toggleSavedProfile(company: Company, enrichment?: EnrichmentResponse): boolean {
	if (isSaved(company.id)) {
		removeSavedProfile(company.id);
		return false;
	}

	saveProfile(company, enrichment);
	return true;
}

export function getLists(): VCList[] {
	return readFromStorage<VCList[]>(VC_LISTS_KEY, []);
}

export function getListById(listId: string): CompanyList | undefined {
	return getLists().find((list) => list.id === listId);
}

export function updateListName(listId: string, name: string): VCList[] {
	const trimmedName = name.trim();
	if (!trimmedName) {
		return getLists();
	}

	const lists = getLists().map((list) => {
		if (list.id !== listId) {
			return list;
		}

		return {
			...list,
			name: trimmedName,
			updatedAt: new Date().toISOString(),
		};
	});

	writeToStorage(VC_LISTS_KEY, lists);
	return lists;
}

export function createList(name: string): VCList[] {
	const trimmedName = name.trim();
	if (!trimmedName) {
		return getLists();
	}

	const now = new Date().toISOString();
	const list: VCList = {
		id: uuidv4(),
		name: trimmedName,
		companyIds: [],
		createdAt: now,
		updatedAt: now,
	};

	const lists = [list, ...getLists()];
	writeToStorage(VC_LISTS_KEY, lists);
	return lists;
}

export function addCompanyToList(listId: string, companyId: string): VCList[] {
	const lists = getLists().map((list) => {
		if (list.id !== listId || list.companyIds.includes(companyId)) {
			return list;
		}

		return {
			...list,
			companyIds: [...list.companyIds, companyId],
			updatedAt: new Date().toISOString(),
		};
	});

	writeToStorage(VC_LISTS_KEY, lists);
	return lists;
}

export function removeCompanyFromList(listId: string, companyId: string): VCList[] {
	const lists = getLists().map((list) => {
		if (list.id !== listId) {
			return list;
		}

		return {
			...list,
			companyIds: list.companyIds.filter((id) => id !== companyId),
			updatedAt: new Date().toISOString(),
		};
	});

	writeToStorage(VC_LISTS_KEY, lists);
	return lists;
}

export function deleteList(listId: string): VCList[] {
	const lists = getLists().filter((list) => list.id !== listId);
	writeToStorage(VC_LISTS_KEY, lists);
	return lists;
}

export function getSavedSearches(): SavedSearch[] {
	return readFromStorage<SavedSearch[]>(SAVED_SEARCHES_KEY, []);
}

interface SaveSearchInput {
	name?: string;
	filters: {
		query: string;
		sector: string;
		stage: string;
	};
}

export function saveSearch(input: SaveSearchInput): SavedSearch[] {
	const normalizedFilters = {
		query: input.filters.query.trim(),
		sector: input.filters.sector || "all",
		stage: input.filters.stage || "all",
	};

	if (!normalizedFilters.query && normalizedFilters.sector === "all" && normalizedFilters.stage === "all") {
		return getSavedSearches();
	}

	const now = new Date().toISOString();
	const searches = getSavedSearches();
	const defaultName = [
		normalizedFilters.query || "All Companies",
		normalizedFilters.sector !== "all" ? normalizedFilters.sector : "All Sectors",
		normalizedFilters.stage !== "all" ? normalizedFilters.stage : "All Stages",
	].join(" · ");

	const name = input.name?.trim() || defaultName;

	const existingIndex = searches.findIndex((search) => {
		return (
			search.filters.query.toLowerCase() === normalizedFilters.query.toLowerCase() &&
			search.filters.sector === normalizedFilters.sector &&
			search.filters.stage === normalizedFilters.stage
		);
	});

	if (existingIndex >= 0) {
		const existing = searches[existingIndex];
		searches[existingIndex] = {
			...existing,
			name,
			filters: normalizedFilters,
			createdAt: now,
		};
		writeToStorage(SAVED_SEARCHES_KEY, searches);
		return searches;
	}

	const nextSearches = [
		{ id: uuidv4(), name, filters: normalizedFilters, createdAt: now },
		...searches,
	];

	writeToStorage(SAVED_SEARCHES_KEY, nextSearches);
	return nextSearches;
}

export function removeSavedSearch(searchId: string): SavedSearch[] {
	const searches = getSavedSearches().filter((search) => search.id !== searchId);
	writeToStorage(SAVED_SEARCHES_KEY, searches);
	return searches;
}

export function clearSavedSearches(): SavedSearch[] {
	writeToStorage(SAVED_SEARCHES_KEY, []);
	return [];
}
