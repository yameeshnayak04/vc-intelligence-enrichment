import { ReactNode } from "react";

interface TopbarProps {
	title?: string;
	subtitle?: string;
	actionSlot?: ReactNode;
}

export default function Topbar({
	title = "VC Intelligence",
	subtitle = "Discover, profile, and enrich target companies.",
	actionSlot,
}: TopbarProps) {
	return (
		<header className="mb-6 rounded-xl border border-zinc-200 bg-white px-4 py-3">
			<div className="flex flex-wrap items-center justify-between gap-3">
				<div>
					<h2 className="text-lg font-semibold text-zinc-900">{title}</h2>
					<p className="text-sm text-zinc-600">{subtitle}</p>
				</div>

				<div className="flex items-center gap-2">
					<div className="w-72 max-w-full">
						<input
							type="text"
							placeholder="Search companies..."
							className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-700 outline-none ring-zinc-900 placeholder:text-zinc-400 focus:ring"
						/>
					</div>
					{actionSlot ? <div>{actionSlot}</div> : null}
				</div>
			</div>
		</header>
	);
}
