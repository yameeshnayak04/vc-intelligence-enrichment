"use client";

import { Company } from "@/lib/types";

interface CompanyTableProps {
	companies: Company[];
	onRowClick: (company: Company) => void;
	enrichmentStatusByCompanyId?: Record<string, boolean>;
}

export default function CompanyTable({
	companies,
	onRowClick,
	enrichmentStatusByCompanyId = {},
}: CompanyTableProps) {
	return (
		<section className="rounded-xl border border-zinc-200 bg-white p-4">
			<div className="overflow-x-auto">
				<table className="min-w-full text-left text-sm">
					<thead>
						<tr className="border-b border-zinc-200 text-zinc-500">
							<th className="px-3 py-2 font-medium">Name</th>
							<th className="px-3 py-2 font-medium">Sector</th>
							<th className="px-3 py-2 font-medium">Stage</th>
							<th className="px-3 py-2 font-medium">Location</th>
							<th className="px-3 py-2 font-medium">Enrichment Status</th>
						</tr>
					</thead>
					<tbody>
						{companies.map((company) => {
							const isEnriched = Boolean(enrichmentStatusByCompanyId[company.id]);
							return (
								<tr
									key={company.id}
									onClick={() => onRowClick(company)}
									onKeyDown={(event) => {
										if (event.key === "Enter" || event.key === " ") {
											event.preventDefault();
											onRowClick(company);
										}
									}}
									tabIndex={0}
									role="button"
									className="cursor-pointer border-b border-zinc-100 text-zinc-700 hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-200"
								>
									<td className="px-3 py-3 font-medium text-zinc-900">{company.name}</td>
									<td className="px-3 py-3">{company.sector}</td>
									<td className="px-3 py-3">{company.stage}</td>
									<td className="px-3 py-3">{company.location ?? company.hq ?? "—"}</td>
									<td className="px-3 py-3">
										<span
											className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
												isEnriched ? "bg-emerald-100 text-emerald-800" : "bg-zinc-100 text-zinc-600"
											}`}
										>
											{isEnriched ? "Enriched" : "Not Enriched"}
										</span>
									</td>
								</tr>
							);
						})}
					</tbody>
				</table>
			</div>

			{companies.length === 0 ? (
				<p className="mt-4 text-sm text-zinc-500">No companies to display.</p>
			) : null}
		</section>
	);
}
