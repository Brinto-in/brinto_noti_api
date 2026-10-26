const JEEMAIN_URL = "https://jeemain.nta.nic.in/";

export interface JeemainNotification {
  title: string;
  url: string;
}

function decodeHtml(value: string): string {
  const namedEntities: Record<string, string> = {
    amp: "&",
    apos: "'",
    gt: ">",
    lt: "<",
    nbsp: " ",
    quot: '"',
  };

  return value.replace(/&(#x[\da-f]+|#\d+|[a-z]+);/gi, (entity, code: string) => {
    if (code.startsWith("#x")) {
      return String.fromCodePoint(Number.parseInt(code.slice(2), 16));
    }

    if (code.startsWith("#")) {
      return String.fromCodePoint(Number.parseInt(code.slice(1), 10));
    }

    return namedEntities[code.toLowerCase()] ?? entity;
  });
}

function getAttribute(attributes: string, name: string): string | undefined {
  const match = attributes.match(
    new RegExp(`\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, "i"),
  );
  const value = match?.[1] ?? match?.[2] ?? match?.[3];

  return value ? decodeHtml(value) : undefined;
}

export function parseJeemainNotifications(html: string): JeemainNotification[] {
  if (/access denied|request blocked|captcha/i.test(html)) {
    throw new Error("JEE Main returned a blocked or access-denied page");
  }

  let panelHtml = "";
  // 1. Try legacy ID or aria-labelledby
  const legacyMatch = html.match(
    /<[^>]+\b(?:id=["']public-notices-content["']|aria-labelledby=["']public-notices-heading["'])[^>]*>[\s\S]*?<\/div>/i,
  );
  if (legacyMatch) {
    panelHtml = legacyMatch[0];
  } else {
    // 2. Try WPBakery / S3WaaS tab panel containing "Public Notices"
    const ttaMatch = html.match(
      /<div[^>]*class="[^"]*vc_tta-panel[^"]*"[^>]*>[\s\S]*?Public Notices[\s\S]*?<div[^>]*class="[^"]*vc_tta-panel-body[^"]*"[^>]*>([\s\S]*?)<\/div>\s*<\/div>/i,
    );
    if (ttaMatch) {
      panelHtml = ttaMatch[1];
    } else {
      // 3. Fallback: find any container after "Public Notices" heading
      const headingMatch = html.match(/(?:Public Notices)[\s\S]*?<ul\b[^>]*>([\s\S]*?)<\/ul>/i);
      if (headingMatch) {
        panelHtml = headingMatch[0];
      }
    }
  }

  if (!panelHtml) {
    throw new Error(
      "JEE Main public notices panel was not found; the homepage markup may have changed",
    );
  }

  const list = panelHtml.match(/<ul\b[^>]*>([\s\S]*?)<\/ul>/i)?.[1];
  if (!list) {
    throw new Error("JEE Main public notices list was not found");
  }

  const notifications: JeemainNotification[] = [];
  const seenUrls = new Set<string>();

  for (const item of list.matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/gi)) {
    const anchor = item[1].match(/<a\b([^>]*)>([\s\S]*?)<\/a>/i);
    if (!anchor) {
      continue;
    }

    const href = getAttribute(anchor[1], "href");
    const title = decodeHtml(anchor[2].replace(/<[^>]*>/g, ""))
      .replace(/\s+/g, " ")
      .trim();
    if (!href || !title) {
      continue;
    }

    const url = new URL(href, JEEMAIN_URL);
    if (!["http:", "https:"].includes(url.protocol) || seenUrls.has(url.href)) {
      continue;
    }

    seenUrls.add(url.href);
    notifications.push({ title, url: url.href });
  }

  return notifications;
}

export async function collectJeemainNotifications(): Promise<JeemainNotification[]> {
  const response = await fetch(JEEMAIN_URL, {
    headers: {
      accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    },
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) {
    throw new Error(`JEE Main website returned HTTP ${response.status}`);
  }

  return parseJeemainNotifications(await response.text());
}
