"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
	{ href: "/companies", label: "Discover", icon: "◦" },
	{ href: "/lists", label: "Lists", icon: "◦" },
	{ href: "/saved", label: "Saved", icon: "◦" },
];

export default function Sidebar() {
	const pathname = usePathname();

	return (
		<aside className="h-full border-r border-zinc-200 bg-white px-4 py-6">
			<div className="mb-8 px-2">
				<p className="text-xs font-medium uppercase tracking-wide text-zinc-500">VC Intelligence</p>
				<h1 className="mt-1 text-lg font-semibold text-zinc-900">Workflow</h1>
			</div>

			<nav className="space-y-1" aria-label="Primary">
				{links.map((link) => {
					const isActive = pathname.startsWith(link.href);
					return (
						<Link
							key={link.href}
							href={link.href}
							className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition ${
								isActive
									? "bg-zinc-900 text-white"
									: "text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900"
							}`}
						>
							<span className="text-xs opacity-80" aria-hidden="true">
								{link.icon}
							</span>
							{link.label}
						</Link>
					);
				})}
			</nav>
		</aside>
	);
}
