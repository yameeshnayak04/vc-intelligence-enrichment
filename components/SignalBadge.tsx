interface SignalBadgeProps {
	label: string;
	tone?: "neutral" | "positive" | "attention";
}

function getToneClasses(tone: NonNullable<SignalBadgeProps["tone"]>): string {
	if (tone === "positive") {
		return "bg-emerald-100 text-emerald-800";
	}

	if (tone === "attention") {
		return "bg-amber-100 text-amber-800";
	}

	return "bg-zinc-100 text-zinc-700";
}

export default function SignalBadge({ label, tone = "neutral" }: SignalBadgeProps) {
	return (
		<span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${getToneClasses(tone)}`}>
			{label}
		</span>
	);
}
