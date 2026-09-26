import Link from "next/link";
import { SectionTitle } from "@/components/ui";
import { PostForm } from "@/components/admin/post-form";

export const metadata = { title: "New post" };

export default function NewPostPage() {
  return (
    <div className="max-w-4xl">
      <Link href="/admin/posts" className="text-sm text-muted hover:underline">
        ← Posts
      </Link>
      <div className="mt-2">
        <SectionTitle as="h1" title="New post" />
      </div>
      <PostForm />
    </div>
  );
}
