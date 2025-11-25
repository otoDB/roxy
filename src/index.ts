import { Hono } from "hono";
import * as v from "valibot";
import { XMLBuilder, XMLParser } from "fast-xml-parser";

const app = new Hono();
const xmlBuilder = new XMLBuilder({});
const xmlParser = new XMLParser({});

function esitmateQuery(q: string): {
	platform: "Niconico" | "YouTube" | "Bilibili" | "SoundCloud";
	id: string;
} | null {
	const url = URL.parse(q);
	if (!url) {
		if (q.match(/^sm\d+$/)) {
			// Nicovideo
			return { platform: "Niconico", id: q };
		} else if (q.match(/^[\w-]{11}$/)) {
			// Youtube
			return { platform: "YouTube", id: q };
		} else if (q.match(/^BV[a-zA-Z0-9]{10}$/)) {
			// Bilibili
			return { platform: "Bilibili", id: q };
		}
		return null;
	}

	switch (url.hostname) {
		case "www.nicovideo.jp":
		case "nicovideo.jp":
			return {
				platform: "Niconico",
				id: url.pathname.split("/watch/")[1] || "",
			};
		case "www.youtube.com":
		case "youtube.com":
			if (url.pathname === "/watch") {
				const v = url.searchParams.get("v");
				if (v)
					return {
						platform: "YouTube",
						id: v,
					};
			}
			return null;
		case "youtu.be":
			return {
				platform: "YouTube",
				id: url.pathname.slice(1),
			};
		case "www.bilibili.com":
		case "bilibili.com":
			if (url.pathname.startsWith("/video/")) {
				return {
					platform: "Bilibili",
					id: url.pathname.split("/video/")[1] || "",
				};
			}
			return null;
		case "soundcloud.com":
			if (url.pathname.split("/").length == 3) {
				return {
					platform: "SoundCloud",
					id: url.pathname.slice(1),
				};
			}
			return null;
		default:
			return null;
	}
}

async function fallbackNicovideo(sourceId: string): Promise<{
	title: string;
	thumbnail: string;
} | null> {
	const url = new URL(
		"https://snapshot.search.nicovideo.jp/api/v2/snapshot/video/contents/search"
	);
	url.searchParams.set("q", "");
	url.searchParams.set("targets", "title");
	url.searchParams.set("fields", "contentId,title,thumbnailUrl");
	url.searchParams.set("filters[contentId][0]", sourceId);
	url.searchParams.set("_sort", "-viewCounter");
	url.searchParams.set("_limit", "1");
	const result = await fetch(url.toString())
		.then((res) => res.json())
		.then((data) =>
			v.safeParse(
				v.object({
					meta: v.object({
						status: v.literal(200),
						totalCount: v.literal(1),
					}),
					data: v.array(
						v.object({
							contentId: v.literal(sourceId),
							title: v.string(),
							thumbnailUrl: v.string(),
						})
					),
				}),
				data
			)
		);
	if (!result.success) return null;
	else
		return {
			title: result.output.data[0].title,
			thumbnail: result.output.data[0].thumbnailUrl,
		};
}

async function searchOtoDBSource({
	platform,
	id,
}: Exclude<ReturnType<typeof esitmateQuery>, null>) {
	const urlExternalQuery = new URL("https://otodb.net/api/work/query_external");
	urlExternalQuery.searchParams.set("platform", platform);
	urlExternalQuery.searchParams.set("id", id);

	const res = await fetch(urlExternalQuery.toString())
		.then((res) => res.json())
		.then((data) => v.safeParse(v.object({ work_id: v.number() }), data))
		.catch(() => null);

	if (!res || !res.success) return null;
	return res.output.work_id;
}

async function fetchOtodbData(otodbId: number) {
	const urlWork = new URL("https://otodb.net/api/work/work");
	urlWork.searchParams.set("work_id", otodbId.toString());

	const resWork = await fetch(urlWork.toString())
		.then((res) => res.json())
		.then((data) =>
			v.safeParse(
				v.object({
					id: v.number(),
					thumbnail: v.string(),
					title: v.string(),
				}),
				data
			)
		);

	if (!resWork.success) return null;
	return resWork.output;
}

function buildUrl(q: Exclude<ReturnType<typeof esitmateQuery>, null>) {
	switch (q.platform) {
		case "Niconico":
			return new URL(`watch/${q.id}`, `https://www.nicovideo.jp`).toString();
		case "YouTube":
			const url = new URL("https://www.youtube.com/watch");
			url.searchParams.set("v", q.id);
			return url.toString();
		case "Bilibili":
			return new URL(`video/${q.id}`, `https://www.bilibili.com`).toString();
		case "SoundCloud":
			return new URL(q.id, `https://soundcloud.com`).toString();
	}
}

app.get("/xml", async (c) => {
	const rawQuery = c.req.query("q");
	if (!rawQuery) return c.text("No query", 400);

	const parsedQuery = esitmateQuery(rawQuery);
	if (!parsedQuery) return c.text("Invalid query", 400);

	const otodbId = await searchOtoDBSource(parsedQuery);
	if (!otodbId) {
		switch (parsedQuery.platform) {
			case "Niconico": {
				const fallback = await fallbackNicovideo(parsedQuery.id);
				if (!fallback) return c.text("Cannot fallback", 404);

				return c.text(
					xmlBuilder.build({
						data: {
							query: parsedQuery,
							url: buildUrl(parsedQuery),
							title: fallback.title,
							thumbnail: fallback.thumbnail,
						},
					}),
					200,
					{ "Content-Type": "application/xml" }
				);
			}
			default:
				return c.text("Cannot fallback", 404);
		}
	}

	const data = await fetchOtodbData(otodbId);
	if (!data) return c.text("Cannot fetch otoDB data", 500);

	return c.text(
		xmlBuilder.build({
			data: {
				query: parsedQuery,
				url: buildUrl(parsedQuery),
				title: data.title,
				thumbnail: data.thumbnail,
				otodb: {
					id: data.id,
				},
			},
		}),
		200,
		{ "Content-Type": "application/xml" }
	);
});

export default app;
