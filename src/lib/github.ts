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

export type LatestCommit = {
  repo: string;
  message: string;
  sha: string;
  url: string;
  date: string;
};

/** Most recent public push, with its head commit message. */
export async function getLatestCommit(): Promise<LatestCommit | null> {
  try {
    const res = await fetch(`https://api.github.com/users/${GITHUB_USER}/events/public?per_page=30`, {
      headers: { Accept: "application/vnd.github+json" },
      next: { revalidate: 600 },
    });
    if (!res.ok) return null;
    const events = (await res.json()) as {
      type: string;
      repo: { name: string };
      created_at: string;
      payload: { head?: string };
    }[];
    const push = events.find((e) => e.type === "PushEvent" && e.payload.head);
    if (!push?.payload.head) return null;

    const commitRes = await fetch(
      `https://api.github.com/repos/${push.repo.name}/commits/${push.payload.head}`,
      { headers: { Accept: "application/vnd.github+json" }, next: { revalidate: 600 } },
    );
    const commit = commitRes.ok
      ? ((await commitRes.json()) as { commit: { message: string }; html_url: string })
      : null;

    return {
      repo: push.repo.name.split("/")[1],
      message: commit?.commit.message.split("\n")[0] ?? "Pushed new commits",
      sha: push.payload.head.slice(0, 7),
      url: commit?.html_url ?? `https://github.com/${push.repo.name}`,
      date: push.created_at,
    };
  } catch {
    return null;
  }
}
