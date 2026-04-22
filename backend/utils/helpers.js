const NUMBER_WORDS = {
	one: 1,
	two: 2,
	three: 3,
	four: 4,
	five: 5,
	six: 6,
	seven: 7,
	eight: 8,
	nine: 9,
	ten: 10,
	couple: 2,
	few: 3,
};

function toNumber(text) {
	const lowered = String(text || "").toLowerCase().trim();
	const numeric = Number(lowered);
	if (!Number.isNaN(numeric)) return numeric;
	return NUMBER_WORDS[lowered] ?? null;
}

export function normalizeDurationText(value) {
	if (value === null || value === undefined) return null;

	const raw = String(value).toLowerCase().trim();
	if (!raw) return null;

	if (raw.includes("since yesterday") || raw === "yesterday" || raw.includes("last night")) {
		return "1 day";
	}

	if (raw.includes("today") || raw.includes("since this morning")) {
		return "1 day";
	}

	const explicitMatch = raw.match(/(\d+|one|two|three|four|five|six|seven|eight|nine|ten|couple|few)\s*(minute|minutes|min|mins|hour|hours|day|days|week|weeks|month|months)/);
	if (explicitMatch) {
		const amount = toNumber(explicitMatch[1]);
		const unit = explicitMatch[2];

		if (amount === null) return null;

		if (unit.startsWith("min")) {
			return `${amount} ${amount === 1 ? "minute" : "minutes"}`;
		}

		if (unit.startsWith("hour")) {
			return `${amount} ${amount === 1 ? "hour" : "hours"}`;
		}

		let days = amount;
		if (unit.startsWith("week")) days = amount * 7;
		if (unit.startsWith("month")) days = amount * 30;

		return `${days} ${days === 1 ? "day" : "days"}`;
	}

	if (raw.includes("few days")) return "3 days";
	if (raw.includes("couple of days")) return "2 days";

	return null;
}

