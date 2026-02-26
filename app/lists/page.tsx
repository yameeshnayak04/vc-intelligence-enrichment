"use client";

import Link from "next/link";
import { FormEvent, useState, useSyncExternalStore } from "react";
import Topbar from "@/components/Topbar";
import {
	addCompanyToList,
	createList,
	deleteList,
	getLists,
	getSavedProfiles,
	removeCompanyFromList,
} from "@/lib/storage";

export default function ListsPage() {
	const [storageRevision, setStorageRevision] = useState(0);
	const [listName, setListName] = useState("");
	const [selectedCompanyByList, setSelectedCompanyByList] = useState<Record<string, string>>({});
	const isClient = useSyncExternalStore(
		() => () => undefined,
		() => true,
		() => false
	);

	void storageRevision;
	const lists = isClient ? getLists() : [];
	const savedProfiles = isClient ? getSavedProfiles() : [];
	const companyMap = new Map(savedProfiles.map((profile) => [profile.company.id, profile.company]));

	const handleCreateList = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		createList(listName);
		setListName("");
		setStorageRevision((current) => current + 1);
	};

	const handleAddCompany = (listId: string) => {
		const companyId = selectedCompanyByList[listId];
		if (!companyId) {
			return;
		}

		addCompanyToList(listId, companyId);
		setStorageRevision((current) => current + 1);
	};

	const handleRemoveCompany = (listId: string, companyId: string) => {
		removeCompanyFromList(listId, companyId);
		setStorageRevision((current) => current + 1);
	};

	const handleDeleteList = (listId: string) => {
		deleteList(listId);
		setStorageRevision((current) => current + 1);
	};

	const handleExportList = (listId: string) => {
		const list = lists.find((item) => item.id === listId);
		if (!list) {
			return;
		}

		const companiesForList = list.companyIds
			.map((companyId) => companyMap.get(companyId))
			.filter(Boolean);

		const payload = {
			id: list.id,
			name: list.name,
			createdAt: list.createdAt,
			updatedAt: list.updatedAt,
			companies: companiesForList,
			exportedAt: new Date().toISOString(),
		};

		const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
		const objectUrl = URL.createObjectURL(blob);
		const anchor = document.createElement("a");
		anchor.href = objectUrl;
		anchor.download = `${list.name.toLowerCase().replace(/\s+/g, "-") || "list"}.json`;
		document.body.appendChild(anchor);
		anchor.click();
		anchor.remove();
		URL.revokeObjectURL(objectUrl);
	};

	return (
		<div>
			<Topbar
				title="Lists"
				subtitle="Group saved companies into lightweight diligence lists."
			/>

			<form onSubmit={handleCreateList} className="mb-5 flex flex-wrap gap-2">
				<input
					value={listName}
					onChange={(event) => setListName(event.target.value)}
					placeholder="New list name"
					className="w-72 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none ring-zinc-900 focus:ring"
				/>
				<button
					type="submit"
					className="rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800"
				>
					Create List
				</button>
			</form>

			{!isClient ? (
				<section className="rounded-xl border border-zinc-200 bg-white p-5 text-sm text-zinc-600">
					Loading lists...
				</section>
			) : lists.length === 0 ? (
				<section className="rounded-xl border border-zinc-200 bg-white p-5 text-sm text-zinc-600">
					No lists yet. Create your first named list to start organizing target companies.
				</section>
			) : (
				<section className="space-y-4">
					{lists.map((list) => {
						const listCompanies = list.companyIds.map((id) => companyMap.get(id)).filter(Boolean);
						return (
							<article key={list.id} className="rounded-xl border border-zinc-200 bg-white p-4">
								<div className="mb-3 flex flex-wrap items-center justify-between gap-2">
									<div>
										<h3 className="font-semibold text-zinc-900">{list.name}</h3>
										<p className="text-xs text-zinc-500">
											Updated {new Date(list.updatedAt).toLocaleString()} · {list.companyIds.length} companies
										</p>
									</div>
									<div className="flex items-center gap-2">
										<button
											onClick={() => handleExportList(list.id)}
											className="rounded-md border border-zinc-300 px-2 py-1 text-sm text-zinc-700 hover:bg-zinc-100"
										>
											Export JSON
										</button>
										<button
											onClick={() => handleDeleteList(list.id)}
											className="rounded-md border border-zinc-300 px-2 py-1 text-sm text-zinc-700 hover:bg-zinc-100"
										>
											Delete List
										</button>
									</div>
								</div>

								{savedProfiles.length === 0 ? (
									<div className="mb-3 rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-600">
										No saved companies available. Save companies from Discover to add them to lists.
									</div>
								) : (
									<div className="mb-3 flex flex-wrap items-center gap-2">
										<select
											value={selectedCompanyByList[list.id] ?? ""}
											onChange={(event) =>
												setSelectedCompanyByList((current) => ({
													...current,
													[list.id]: event.target.value,
												}))
											}
											className="rounded-md border border-zinc-300 px-2 py-1 text-sm"
										>
											<option value="">Select saved company</option>
											{savedProfiles.map((profile) => (
												<option key={profile.company.id} value={profile.company.id}>
													{profile.company.name}
												</option>
											))}
										</select>

										<button
											onClick={() => handleAddCompany(list.id)}
											className="rounded-md border border-zinc-300 px-2 py-1 text-sm text-zinc-700 hover:bg-zinc-100"
										>
											Add
										</button>
									</div>
								)}

								{listCompanies.length === 0 ? (
									<p className="text-sm text-zinc-500">No companies in this list yet.</p>
								) : (
									<ul className="space-y-2">
										{listCompanies.map((company) => {
											if (!company) {
												return null;
											}

											return (
												<li
													key={`${list.id}:${company.id}`}
													className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-zinc-200 px-3 py-2"
												>
													<div>
														<p className="text-sm font-medium text-zinc-900">{company.name}</p>
														<p className="text-xs text-zinc-500">
															{company.sector} · {company.stage}
														</p>
													</div>
													<div className="flex items-center gap-2">
														<Link
															href={`/companies/${company.id}`}
															className="rounded-md border border-zinc-300 px-2 py-1 text-xs text-zinc-700 hover:bg-zinc-100"
														>
															Open
														</Link>
														<button
															onClick={() => handleRemoveCompany(list.id, company.id)}
															className="rounded-md border border-zinc-300 px-2 py-1 text-xs text-zinc-700 hover:bg-zinc-100"
														>
															Remove
														</button>
													</div>
												</li>
											);
										})}
									</ul>
								)}
							</article>
						);
					})}
				</section>
			)}
		</div>
	);
}
