"use client";

import Link from "next/link";
import { useState } from "react";
import Topbar from "@/components/Topbar";
import { getSavedSearches, removeSavedSearch } from "@/lib/storage";

export default function SavedPage() {
	const [, setSavedRevision] = useState(0);
	const savedSearches = getSavedSearches();

	const handleRemove = (searchId: string) => {
		removeSavedSearch(searchId);
		setSavedRevision((current) => current + 1);
	};

	return (
		<div>
			<Topbar
				title="Saved"
				subtitle="Saved search filters for quickly restoring company discovery views."
			/>

			{savedSearches.length === 0 ? (
				<section className="rounded-xl border border-zinc-200 bg-white p-5 text-sm text-zinc-600">
					No saved searches yet. Save current filters from Discover to restore them here.
				</section>
			) : (
				<section className="space-y-3">
					{savedSearches.map((savedSearch) => (
						<article key={savedSearch.id} className="rounded-xl border border-zinc-200 bg-white p-4">
							<div className="flex flex-wrap items-start justify-between gap-3">
								<div>
									<h3 className="font-semibold text-zinc-900">{savedSearch.name}</h3>
									<p className="text-sm text-zinc-600">
										Query: {savedSearch.filters.query || "(none)"} · Sector: {savedSearch.filters.sector} · Stage: {savedSearch.filters.stage}
									</p>
									<p className="mt-1 text-xs text-zinc-500">
										Saved {new Date(savedSearch.createdAt).toLocaleString()}
									</p>
								</div>

								<div className="flex items-center gap-2">
									<Link
										href={`/companies?query=${encodeURIComponent(savedSearch.filters.query)}&sector=${encodeURIComponent(savedSearch.filters.sector)}&stage=${encodeURIComponent(savedSearch.filters.stage)}`}
										className="rounded-md border border-zinc-300 px-2 py-1 text-sm text-zinc-700 hover:bg-zinc-100"
									>
										Restore
									</Link>
									<button
										onClick={() => handleRemove(savedSearch.id)}
										className="rounded-md border border-zinc-300 px-2 py-1 text-sm text-zinc-700 hover:bg-zinc-100"
									>
										Remove
									</button>
								</div>
							</div>
						</article>
					))}
				</section>
			)}
		</div>
	);
}
