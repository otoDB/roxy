import { Hono } from "hono";
import * as v from "valibot";

function esitmateQuery(q: string): {
  platform: "Niconico" | "YouTube";
  id: string;
} | null {
  const niconicoUrl = q.match(
    /https:\/\/www.nicovideo.jp\/watch\/((sm|nm)\d+)/
  );
  if (niconicoUrl) return { platform: "Niconico", id: niconicoUrl[1] };

  const niconicoId = q.match(/^(sm|nm)\d+$/);
  if (niconicoId) return { platform: "Niconico", id: niconicoId[0] };

  return null;
}

async function fallbackNicovideo(sourceId: string) {
  const url = new URL(
    `/api/watch/v3_guest/${sourceId}`,
    "https://www.nicovideo.jp"
  );
  url.searchParams.set("_frontendId", "6");
  url.searchParams.set("_frontendVersion", "0");
  url.searchParams.set("skips", "harmful");
  url.searchParams.set(
    "actionTrackId",
    `${Math.random().toString(36).substring(2)}_${Date.now()}`
  );

  const result = await fetch(url.toString(), {
    headers: {
      "user-agent": "Mozilla/5.0", // TODO: fix
    },
  })
    .then((res) => res.json())
    .then((data) =>
      v.safeParse(
        v.object({
          meta: v.object({
            status: v.number(),
          }),
          data: v.object({
            video: v.object({
              id: v.string(),
              title: v.string(),
              thumbnail: v.object({
                ogp: v.string(),
              }),
            }),
          }),
        }),
        data
      )
    );
  if (!result.success) return null;
  else
    return {
      title: result.output.data.video.title,
      thumbnail: result.output.data.video.thumbnail.ogp,
    };
}

const app = new Hono();

app.get(
  "/",
  async (
    c
  ): Promise<
    ReturnType<
      typeof c.json<{
        message:
          | "SUCCESS"
          | "NO_QUERY"
          | "INVALID_QUERY"
          | "CANNOT_FALLBACK"
          | "UNKNOWN";
        originalQuery: null | string;
        parsedQuery: null | ReturnType<typeof esitmateQuery>;
        data: null | {
          title: string;
          thumbnail: string;
          otodb_id: number | null;
        };
      }>
    >
  > => {
    const rawQuery = c.req.query("q");
    if (!rawQuery)
      return c.json({
        message: "NO_QUERY",
        originalQuery: null,
        parsedQuery: null,
        data: null,
      });

    const parsedQuery = esitmateQuery(rawQuery);
    if (!parsedQuery)
      return c.json({
        message: "INVALID_QUERY",
        originalQuery: rawQuery,
        parsedQuery: null,
        data: null,
      });

    const urlExternalQuery = new URL(
      "https://otodb.net/api/work/query_external"
    );
    urlExternalQuery.searchParams.set("platform", parsedQuery.platform);
    urlExternalQuery.searchParams.set("id", parsedQuery.id);

    const resExQuery = await fetch(urlExternalQuery.toString())
      .then((res) => res.json())
      .then((data) => v.safeParse(v.object({ work_id: v.number() }), data));

    if (!resExQuery.success) {
      switch (parsedQuery.platform) {
        case "Niconico": {
          const fallback = await fallbackNicovideo(parsedQuery.id);
          if (!fallback)
            return c.json({
              message: "CANNOT_FALLBACK",
              originalQuery: rawQuery,
              parsedQuery: parsedQuery,
              data: null,
            });
          return c.json({
            message: "SUCCESS",
            originalQuery: rawQuery,
            parsedQuery: parsedQuery,
            data: {
              title: fallback.title,
              thumbnail: fallback.thumbnail,
              otodb_id: null,
            },
          });
        }
        default:
          return c.json({
            message: "CANNOT_FALLBACK",
            originalQuery: rawQuery,
            parsedQuery: parsedQuery,
            data: null,
          });
      }
    }

    const urlWork = new URL("https://otodb.net/api/work/work");
    urlWork.searchParams.set("work_id", resExQuery.output.work_id.toString());

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
    if (!resWork.success)
      return c.json({
        message: "UNKNOWN",
        originalQuery: rawQuery,
        parsedQuery: parsedQuery,
        data: null,
      });

    return c.json({
      message: "SUCCESS",
      originalQuery: rawQuery,
      parsedQuery: parsedQuery,
      data: {
        title: resWork.output.title,
        thumbnail: resWork.output.thumbnail,
        otodb_id: resWork.output.id,
      },
    });
  }
);

export default app;
