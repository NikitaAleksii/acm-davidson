export const site = {
  name: "ACM Davidson",
  fullName: "ACM Davidson College Student Chapter",
  tagline: "Davidson College's home for people who love computing.",
  description:
    "The Davidson College student chapter of the Association for Computing Machinery (ACM). Workshops, talks, socials, and a community for everyone interested in computer science.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  email: process.env.CHAPTER_EMAIL ?? "acm@davidson.edu",
  joinUrl: "https://wildcatsync.davidson.edu/organization/acm",
  social: {
    instagram: "https://www.instagram.com/acm.davidson",
    linkedin: "",
    discord: "",
    groupme: "",
  },
  davidsonUrl: "https://www.davidson.edu",
  acmUrl: "https://www.acm.org",
  timeZone: "America/New_York",
} as const;

export const nav = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/events", label: "Events" },
  { href: "/posts", label: "Posts" },
  { href: "/team", label: "Team" },
  { href: "/get-involved", label: "Get Involved" },
  { href: "/contact", label: "Contact" },
] as const;

export const POST_TAGS = ["Workshop", "Talk", "Social", "News", "Project"] as const;

export const CLASS_YEARS = (() => {
  const now = new Date();
  const year = now.getFullYear() + (now.getMonth() >= 6 ? 1 : 0);
  return [year, year + 1, year + 2, year + 3].map(String);
})();

export function currentAcademicYear(date = new Date()) {
  const y = date.getFullYear();
  // Academic year rolls over in July.
  return date.getMonth() >= 6 ? `${y}-${y + 1}` : `${y - 1}-${y}`;
}
