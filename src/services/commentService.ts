export interface ItchComment {
  id: string;
  author: string;
  avatarUrl?: string;
  content: string;
  createdAt: string;
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

export async function getComments(): Promise<ItchComment[]> {
  if (SUPABASE_URL && SUPABASE_ANON_KEY) {
    try {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/comments?select=*&order=created_at.desc`,
        {
          headers: {
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          },
        }
      );
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          return data.map((item: any) => ({
            id: String(item.id),
            author: item.author || "Khách",
            content: item.content || "",
            createdAt: item.created_at || item.createdAt || new Date().toISOString(),
          }));
        }
      }
    } catch (e) {
      console.warn("Could not load comments from Supabase, falling back to comments.json:", e);
    }
  }

  // Fallback to static comments.json if Supabase is not configured or fails
  try {
    const res = await fetch("./comments.json");
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) return data;
    }
  } catch (e) {
    console.warn("Could not load comments.json:", e);
  }

  return [];
}

export async function createComment(
  authorName: string,
  textContent: string
): Promise<ItchComment> {
  const author = authorName.trim();
  const content = textContent.trim();
  if (!author || !content) {
    throw new Error("Tên và nội dung bình luận không được để trống.");
  }

  if (SUPABASE_URL && SUPABASE_ANON_KEY) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/comments`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify({ author, content }),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      throw new Error(`Lỗi từ máy chủ: ${res.status} ${errText}`);
    }

    const data = await res.json();
    const createdItem = Array.isArray(data) ? data[0] : data;
    return {
      id: String(createdItem.id),
      author: createdItem.author,
      content: createdItem.content,
      createdAt: createdItem.created_at || createdItem.createdAt || new Date().toISOString(),
    };
  }

  // Fallback for local development if Supabase credentials are missing
  const newComment: ItchComment = {
    id: `local-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    author,
    content,
    createdAt: new Date().toISOString(),
  };

  return newComment;
}
