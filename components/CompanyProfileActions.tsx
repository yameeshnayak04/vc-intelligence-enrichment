"use client";

import { useState, useSyncExternalStore } from "react";
import {
	addCompanyToList,
	createList,
	getCompanyNote,
	getLists,
	removeCompanyFromList,
	saveCompanyNote,
} from "@/lib/storage";
import { Company } from "@/lib/types";

interface CompanyProfileActionsProps {
	company: Company;
}

export default function CompanyProfileActions({ company }: CompanyProfileActionsProps) {
	const [storageRevision, setStorageRevision] = useState(0);
	const isClient = useSyncExternalStore(
		() => () => undefined,
		() => true,
		() => false
	);

	void storageRevision;
	const lists = isClient ? getLists() : [];

	const containingLists = lists.filter((list) => list.companyIds.includes(company.id));
	const isInAnyList = containingLists.length > 0;

	const handleNotesChange = (value: string) => {
		saveCompanyNote(company.id, value);
	};

	const handleToggleLists = () => {
		if (isInAnyList) {
			containingLists.forEach((list) => {
				removeCompanyFromList(list.id, company.id);
			});
			setStorageRevision((current) => current + 1);
			return;
		}

		const targetList = lists[0] ?? createList("My Pipeline")[0];
		addCompanyToList(targetList.id, company.id);
		setStorageRevision((current) => current + 1);
	};

	return (
		<div className="space-y-4">
			<section className="rounded-xl border border-zinc-200 bg-white p-5">
				<h3 className="text-sm font-semibold text-zinc-900">Notes</h3>
				<p className="mb-2 text-xs text-zinc-500">Notes are saved locally for this company profile.</p>
				<textarea
					key={company.id}
					defaultValue={isClient ? getCompanyNote(company.id) : ""}
					onChange={(event) => handleNotesChange(event.target.value)}
					placeholder="Write your diligence notes..."
					rows={6}
					className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-700 outline-none ring-zinc-900 placeholder:text-zinc-400 focus:ring"
				/>
			</section>

			<section className="rounded-xl border border-zinc-200 bg-white p-5">
				<h3 className="text-sm font-semibold text-zinc-900">Lists</h3>
				<p className="mb-3 text-xs text-zinc-500">
					{!isClient
						? "Loading lists..."
						: isInAnyList
						? `In lists: ${containingLists.map((list) => list.name).join(", ")}`
						: "Not currently in any list."}
				</p>
				<button
					onClick={handleToggleLists}
					className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
				>
					{isInAnyList ? "Remove from Lists" : "Save to Lists"}
				</button>
			</section>
		</div>
	);
}
