import Link from "next/link";
import CompanyProfileActions from "@/components/CompanyProfileActions";
import EnrichmentPanel from "@/components/EnrichmentPanel";
import companies from "@/data/companies.json";
import { Company } from "@/lib/types";

const companyUniverse = companies as Company[];

interface CompanyProfilePageProps {
	params: { id: string } | Promise<{ id: string }>;
}

export default async function CompanyProfilePage({ params }: CompanyProfilePageProps) {
	const resolvedParams = await Promise.resolve(params);
	const companyId = typeof resolvedParams?.id === "string" ? resolvedParams.id.trim() : "";
	const company = companyUniverse.find((item) => String(item.id) === companyId);

	if (!company) {
		return (
			<div className="space-y-4">
				<h1 className="text-2xl font-semibold text-zinc-900">Company not found</h1>
				<p className="text-sm text-zinc-600">
					No company matches the identifier &quot;{companyId || "(empty)"}&quot;.
				</p>
				<Link
					href="/companies"
					className="inline-flex rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
				>
					Back to Discover
				</Link>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-semibold text-zinc-900">{company.name}</h1>
					<p className="text-sm text-zinc-600">Company profile and diligence workspace</p>
				</div>
				<Link
					href="/companies"
					className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
				>
					Back to Discover
				</Link>
			</div>

			<section className="grid gap-6 lg:grid-cols-5">
				<div className="space-y-6 lg:col-span-2">
					<section className="rounded-xl border border-zinc-200 bg-white p-5">
						<h2 className="text-sm font-semibold text-zinc-900">Overview</h2>
						<dl className="mt-3 space-y-2 text-sm text-zinc-700">
							<div>
								<dt className="text-zinc-500">Name</dt>
								<dd>{company.name}</dd>
							</div>
							<div>
								<dt className="text-zinc-500">Website</dt>
								<dd>
									<a
										href={company.website}
										target="_blank"
										rel="noopener noreferrer"
										className="text-zinc-800 underline decoration-zinc-300 underline-offset-2"
									>
										{company.website}
									</a>
								</dd>
							</div>
							<div>
								<dt className="text-zinc-500">Sector</dt>
								<dd>{company.sector}</dd>
							</div>
							<div>
								<dt className="text-zinc-500">Stage</dt>
								<dd>{company.stage}</dd>
							</div>
							<div>
								<dt className="text-zinc-500">Location</dt>
								<dd>{company.location ?? company.hq ?? "—"}</dd>
							</div>
						</dl>
					</section>

					<CompanyProfileActions company={company} />
				</div>

				<div className="space-y-6 lg:col-span-3">
					<section className="rounded-xl border border-zinc-200 bg-white p-5">
						<h2 className="mb-2 text-sm font-semibold text-zinc-900">Why this company surfaced</h2>
						<ul className="list-disc space-y-1 pl-5 text-sm text-zinc-700">
							<li>{company.name} is operating in {company.sector}, a sector relevant for venture-scale outcomes.</li>
							<li>
								Current stage ({company.stage}) aligns with diligence workflows focused on pre- and growth-scale entry points.
							</li>
							<li>
								Geographic presence in {company.location ?? company.hq ?? "its market"} supports market mapping and sourcing coverage.
							</li>
						</ul>
					</section>

					<EnrichmentPanel company={company} />
				</div>
			</section>
		</div>
	);
}
