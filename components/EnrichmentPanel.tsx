"use client";

import { useEffect, useState } from "react";
import { Company, EnrichmentResponse } from "@/lib/types";
import {
	getEnrichmentResult,
	isSaved,
	removeSavedProfile,
	saveEnrichmentResult,
	saveProfile,
	toggleSavedProfile,
} from "@/lib/storage";

interface EnrichmentPanelProps {
	company: Company;
}

function normalizeEnrichmentResponse(payload: unknown, company: Company): EnrichmentResponse {
	const data = (payload ?? {}) as Record<string, unknown>;
	const whatTheyDo = Array.isArray(data.whatTheyDo)
		? (data.whatTheyDo as string[])
		: Array.isArray(data.what_they_do)
			? (data.what_they_do as string[])
			: [];

	const keywords = Array.isArray(data.keywords) ? (data.keywords as string[]) : [];

	const derivedSignals = Array.isArray(data.derivedSignals)
		? (data.derivedSignals as EnrichmentResponse["derivedSignals"])
		: Array.isArray(data.derived_signals)
			? (data.derived_signals as string[]).map((label) => ({
					label,
					value: "Medium" as const,
					rationale: label,
				}))
			: [];

	const sources = Array.isArray(data.sources)
		? (data.sources as Array<Record<string, unknown>>).map((source) => ({
				title: typeof source.title === "string" ? source.title : "Source",
				url: typeof source.url === "string" ? source.url : company.website,
				timestamp:
					typeof source.timestamp === "string"
						? source.timestamp
						: typeof source.fetched_at === "string"
							? source.fetched_at
							: new Date().toISOString(),
			}))
		: [];

	return {
		companyId: typeof data.companyId === "string" ? data.companyId : company.id,
		website: typeof data.website === "string" ? data.website : company.website,
		summary:
			typeof data.summary === "string" && data.summary.trim()
				? data.summary
				: "Summary unavailable.",
		whatTheyDo,
		keywords,
		derivedSignals,
		sources,
		generatedAt:
			typeof data.generatedAt === "string"
				? data.generatedAt
				: new Date().toISOString(),
	};
}

export default function EnrichmentPanel({ company }: EnrichmentPanelProps) {
	const [enrichment, setEnrichment] = useState<EnrichmentResponse | null>(null);
	const [loading, setLoading] = useState(false);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const [successMessage, setSuccessMessage] = useState<string | null>(null);
	const [saved, setSaved] = useState(false);

	useEffect(() => {
		setSaved(isSaved(company.id));
		setEnrichment(getEnrichmentResult(company.id) ?? null);
	}, [company.id]);

	const enrichCompany = async () => {
		setLoading(true);
		setErrorMessage(null);
		setSuccessMessage(null);

		try {
			const response = await fetch("/api/enrich", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					website: company.website,
					companyId: company.id,
					name: company.name,
					sector: company.sector,
					stage: company.stage,
					location: company.location,
				}),
			});

			if (!response.ok) {
				const errorPayload = (await response.json().catch(() => null)) as
					| { error?: string }
					| null;
				throw new Error(errorPayload?.error || "Enrichment request failed");
			}

			const raw = await response.json();
			const data = normalizeEnrichmentResponse(raw, company);
			saveEnrichmentResult(company.id, data);
			setEnrichment(data);
			setSuccessMessage("Live enrichment completed.");
		} catch (error) {
			setErrorMessage(error instanceof Error ? error.message : "Unable to enrich this company right now.");
		} finally {
			setLoading(false);
		}
	};

	const saveCurrentProfile = () => {
		saveProfile(company, enrichment ?? undefined);
		setSaved(true);
	};

	const toggleSavedStatus = () => {
		if (saved) {
			removeSavedProfile(company.id);
			setSaved(false);
			return;
		}

		const isNowSaved = toggleSavedProfile(company, enrichment ?? undefined);
		setSaved(isNowSaved);
	};

	return (
		<section className="rounded-xl border border-zinc-200 bg-white p-5">
			<div className="mb-4 flex flex-wrap items-center gap-2">
				<button
					onClick={enrichCompany}
					disabled={loading}
					className="rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
				>
					{loading ? "Running..." : "Run Live Enrichment"}
				</button>

				<button
					onClick={saved ? toggleSavedStatus : enrichment ? saveCurrentProfile : toggleSavedStatus}
					className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
				>
					{saved ? "Unsave Profile" : "Save Profile"}
				</button>
			</div>

			{errorMessage ? <p className="mb-3 text-sm text-red-600">{errorMessage}</p> : null}
			{successMessage ? <p className="mb-3 text-sm text-emerald-700">{successMessage}</p> : null}
			{enrichment?.generatedAt ? (
				<p className="mb-3 text-xs text-zinc-500">
					Last enriched at {new Date(enrichment.generatedAt).toLocaleString()}
				</p>
			) : null}

			{!enrichment ? (
				<p className="text-sm text-zinc-500">
					Run live enrichment to generate summary, positioning bullets, keywords, derived signals, and sources.
				</p>
			) : (
				<div className="space-y-4">
					<div>
						<h3 className="text-sm font-semibold text-zinc-900">Summary</h3>
						<p className="text-sm text-zinc-700">{enrichment.summary}</p>
					</div>

					<div>
						<h3 className="mb-2 text-sm font-semibold text-zinc-900">What they do</h3>
						<ul className="list-disc space-y-1 pl-5 text-sm text-zinc-700">
							{enrichment.whatTheyDo.map((item) => (
								<li key={item}>{item}</li>
							))}
						</ul>
					</div>

					<div>
						<h3 className="mb-2 text-sm font-semibold text-zinc-900">Keywords</h3>
						<div className="flex flex-wrap gap-2">
							{enrichment.keywords.map((keyword) => (
								<span
									key={keyword}
									className="inline-flex rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-700"
								>
									{keyword}
								</span>
							))}
						</div>
					</div>

					<div>
						<h3 className="mb-2 text-sm font-semibold text-zinc-900">Derived signals</h3>
						<ul className="space-y-2">
							{enrichment.derivedSignals.map((signal) => (
								<li key={signal.label} className="rounded-md border border-zinc-200 p-3">
									<div className="mb-1 flex items-center justify-between gap-2">
										<p className="text-sm font-medium text-zinc-900">{signal.label}</p>
										<span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-700">
											{signal.value}
										</span>
									</div>
									<p className="text-sm text-zinc-600">{signal.rationale}</p>
								</li>
							))}
						</ul>
					</div>

					<div>
						<h3 className="mb-2 text-sm font-semibold text-zinc-900">Sources</h3>
						<ul className="space-y-2 text-sm text-zinc-700">
							{enrichment.sources.map((source) => (
								<li key={`${source.title}-${source.timestamp}`} className="rounded-md border border-zinc-200 p-3">
									<a
										href={source.url}
										target="_blank"
										rel="noopener noreferrer"
										className="font-medium text-zinc-900 underline decoration-zinc-300 underline-offset-2"
									>
										{source.title}
									</a>
									<p className="mt-1 text-xs text-zinc-500">{new Date(source.timestamp).toLocaleString()}</p>
								</li>
							))}
						</ul>
					</div>
				</div>
			)}
		</section>
	);
}
