"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import CompanyTable from "@/components/CompanyTable";
import companies from "@/data/companies.json";
import { getEnrichmentResults, saveSearch } from "@/lib/storage";
import { Company } from "@/lib/types";

const companyUniverse = companies as Company[];
const PAGE_SIZE = 5;

function getInitialFilters() {
	if (typeof window === "undefined") {
		return { query: "", sector: "all", stage: "all" };
	}

	const params = new URLSearchParams(window.location.search);
	return {
		query: params.get("query") ?? "",
		sector: params.get("sector") ?? "all",
		stage: params.get("stage") ?? "all",
	};
}

export default function CompaniesPage() {
	const router = useRouter();
	const [initialFilters] = useState(getInitialFilters);
	const [query, setQuery] = useState(initialFilters.query);
	const [selectedSector, setSelectedSector] = useState(initialFilters.sector);
	const [selectedStage, setSelectedStage] = useState(initialFilters.stage);
	const [page, setPage] = useState(1);

	const enrichmentResults = getEnrichmentResults();

	const sectorOptions = useMemo(() => {
		return ["all", ...Array.from(new Set(companyUniverse.map((company) => company.sector)))];
	}, []);

	const stageOptions = useMemo(() => {
		return ["all", ...Array.from(new Set(companyUniverse.map((company) => company.stage)))];
	}, []);

	const filteredCompanies = useMemo(() => {
		const normalizedQuery = query.toLowerCase().trim();

		return companyUniverse.filter((company) => {
			const matchesName = !normalizedQuery || company.name.toLowerCase().includes(normalizedQuery);
			const matchesSector = selectedSector === "all" || company.sector === selectedSector;
			const matchesStage = selectedStage === "all" || company.stage === selectedStage;

			return matchesName && matchesSector && matchesStage;
		});
	}, [query, selectedSector, selectedStage]);

	const pageCount = Math.max(1, Math.ceil(filteredCompanies.length / PAGE_SIZE));
	const currentPage = Math.min(page, pageCount);

	const paginatedCompanies = useMemo(() => {
		const start = (currentPage - 1) * PAGE_SIZE;
		return filteredCompanies.slice(start, start + PAGE_SIZE);
	}, [currentPage, filteredCompanies]);

	const onQueryChange = (value: string) => {
		setQuery(value);
		setPage(1);
	};

	const onSectorChange = (value: string) => {
		setSelectedSector(value);
		setPage(1);
	};

	const onStageChange = (value: string) => {
		setSelectedStage(value);
		setPage(1);
	};

	const handleSaveCurrentFilters = () => {
		saveSearch({
			filters: {
				query,
				sector: selectedSector,
				stage: selectedStage,
			},
		});
	};

	return (
		<div className="space-y-4">
			<div className="rounded-xl border border-zinc-200 bg-white p-4">
				<div className="mb-4 flex flex-wrap items-center gap-3">
					<input
						value={query}
						onChange={(event) => onQueryChange(event.target.value)}
						placeholder="Search company name"
						className="w-64 rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-700 outline-none ring-zinc-900 placeholder:text-zinc-400 focus:ring"
					/>

					<select
						value={selectedSector}
						onChange={(event) => onSectorChange(event.target.value)}
						className="rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-700 outline-none ring-zinc-900 focus:ring"
					>
						{sectorOptions.map((sector) => (
							<option key={sector} value={sector}>
								{sector === "all" ? "All sectors" : sector}
							</option>
						))}
					</select>

					<select
						value={selectedStage}
						onChange={(event) => onStageChange(event.target.value)}
						className="rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-700 outline-none ring-zinc-900 focus:ring"
					>
						{stageOptions.map((stage) => (
							<option key={stage} value={stage}>
								{stage === "all" ? "All stages" : stage}
							</option>
						))}
					</select>

					<button
						onClick={handleSaveCurrentFilters}
						className="rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-100"
					>
						Save Current Filters
					</button>

				</div>

				<CompanyTable
					companies={paginatedCompanies}
					onRowClick={(company) => router.push(`/companies/${company.id}`)}
					enrichmentStatusByCompanyId={Object.fromEntries(
						Object.keys(enrichmentResults).map((companyId) => [companyId, true])
					)}
				/>

				{filteredCompanies.length === 0 ? (
					<p className="mt-4 text-sm text-zinc-500">No companies match your current filters.</p>
				) : null}

				<div className="mt-4 flex items-center justify-between">
					<p className="text-xs text-zinc-500">
						Showing {paginatedCompanies.length} of {filteredCompanies.length}
					</p>
					<div className="flex items-center gap-2">
						<button
							onClick={() => setPage((current) => Math.max(1, Math.min(current, pageCount) - 1))}
							disabled={currentPage <= 1}
							className="rounded-md border border-zinc-300 px-3 py-1.5 text-xs text-zinc-700 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50"
						>
							Previous
						</button>
						<span className="text-xs text-zinc-600">
							Page {currentPage} of {pageCount}
						</span>
						<button
							onClick={() => setPage((current) => Math.min(pageCount, Math.min(current, pageCount) + 1))}
							disabled={currentPage >= pageCount}
							className="rounded-md border border-zinc-300 px-3 py-1.5 text-xs text-zinc-700 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50"
						>
							Next
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}
