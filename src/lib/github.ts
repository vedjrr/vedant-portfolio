import { GITHUB_USER } from "@/data/site";

export type Contribution = { date: string; count: number; level: 0 | 1 | 2 | 3 | 4 };

export async function getContributions(): Promise<{ total: number; days: Contribution[] } | null> {
  try {
    const res = await fetch(
      `https://github-contributions-api.jogruber.de/v4/${GITHUB_USER}?y=last`,
      { next: { revalidate: 3600 } },
    );
    if (!res.ok) return null;
    const data = (await res.json()) as {
      total: { lastYear: number };
      contributions: Contribution[];
    };
    return { total: data.total.lastYear, days: data.contributions };
  } catch {
    return null;
  }
}

export async function getGitHubProfile(): Promise<{ repos: number; followers: number } | null> {
  try {
    const res = await fetch(`https://api.github.com/users/${GITHUB_USER}`, {
      headers: { Accept: "application/vnd.github+json" },
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { public_repos: number; followers: number };
    return { repos: data.public_repos, followers: data.followers };
  } catch {
    return null;
  }
}
