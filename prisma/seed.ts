/**
 * Seeds an admin user (from ADMIN_* env vars) plus a little sample content so
 * the site isn't empty on first run. Safe to re-run: it upserts by unique keys.
 *
 *   npm run db:seed
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

function academicYear(date = new Date()) {
  const y = date.getFullYear();
  return date.getMonth() >= 6 ? `${y}-${y + 1}` : `${y - 1}-${y}`;
}

async function main() {
  const email = (process.env.ADMIN_EMAIL ?? "admin@davidson.edu").toLowerCase();
  const name = process.env.ADMIN_NAME ?? "ACM Admin";
  const password = process.env.ADMIN_PASSWORD ?? "change-me-now";

  const passwordHash = await bcrypt.hash(password, 12);
  await db.user.upsert({
    where: { email },
    update: { name },
    create: { email, name, passwordHash },
  });
  console.log(`Admin user ready: ${email}`);

  if (process.env.SEED_SAMPLE_CONTENT === "false") return;

  // Builds a Date n days from now at the given wall-clock time in US Eastern.
  const inDays = (n: number, hour = 18, minute = 0) => {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() + n);
    const ymd = d.toISOString().slice(0, 10);
    const guess = new Date(`${ymd}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00Z`);
    const eastern = new Date(guess.toLocaleString("en-US", { timeZone: "America/New_York" }));
    const utcLike = new Date(guess.toLocaleString("en-US", { timeZone: "UTC" }));
    return new Date(guess.getTime() + (utcLike.getTime() - eastern.getTime()));
  };

  await db.event.upsert({
    where: { slug: "welcome-meeting" },
    update: {},
    create: {
      slug: "welcome-meeting",
      title: "Welcome Meeting & Pizza",
      description:
        "Kick off the semester with ACM Davidson! Meet the officers, hear what we have planned, and grab some pizza.\n\nAll majors and experience levels welcome. No need to RSVP, just show up.",
      startsAt: inDays(7),
      endsAt: inDays(7, 19),
      location: "Chambers 1027",
    },
  });
  await db.event.upsert({
    where: { slug: "intro-to-git-workshop" },
    update: {},
    create: {
      slug: "intro-to-git-workshop",
      title: "Intro to Git & GitHub Workshop",
      description:
        "Never used Git, or only ever hit `git push` and hoped for the best? This hands-on workshop covers:\n\n- What version control is and why everyone uses it\n- Commits, branches, and merges\n- Pull requests and collaborating on GitHub\n\nBring a laptop. We'll help you install everything.",
      startsAt: inDays(14),
      endsAt: inDays(14, 19, 30),
      location: "Chambers 1027",
      rsvpUrl: "https://wildcatsync.davidson.edu/organization/acm",
    },
  });
  await db.event.upsert({
    where: { slug: "spring-hackathon-recap" },
    update: {},
    create: {
      slug: "spring-hackathon-recap",
      title: "Spring Hackathon",
      description: "24 hours, 40 students, way too much caffeine. Thanks to everyone who came out!",
      startsAt: inDays(-90, 10),
      endsAt: inDays(-89, 10),
      location: "Wall Center",
    },
  });

  await db.post.upsert({
    where: { slug: "welcome-to-the-new-acm-davidson-website" },
    update: {},
    create: {
      slug: "welcome-to-the-new-acm-davidson-website",
      title: "Welcome to the new ACM Davidson website",
      excerpt: "A new home for events, recaps, and everything the chapter is up to.",
      content:
        "We finally have a website! Here's what you'll find:\n\n- **Events**: every workshop, talk, and social, with add-to-calendar links\n- **Posts**: recaps, announcements, and the occasional tutorial\n- **Team**: who's running things this year\n\nIf you spot a bug or have an idea, [send us a message](/contact). Pull requests welcome too.",
      tags: "News",
      published: true,
      publishedAt: new Date(),
      authorName: "ACM Davidson",
    },
  });

  const year = academicYear();
  const existing = await db.officer.count({ where: { academicYear: year } });
  if (existing === 0) {
    await db.officer.createMany({
      data: [
        { name: "Sample President", role: "President", academicYear: year, sortOrder: 0, bio: "Replace me in the admin dashboard." },
        { name: "Sample Vice President", role: "Vice President", academicYear: year, sortOrder: 1 },
        { name: "Sample Treasurer", role: "Treasurer", academicYear: year, sortOrder: 2 },
      ],
    });
  }
  console.log("Sample content seeded.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
