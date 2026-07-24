export interface ItchComment {
  id: string;
  author: string;
  avatarUrl?: string;
  content: string;
  createdAt: string;
}

const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL || "").trim();
const SUPABASE_ANON_KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY || "").trim();

const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

export async function getComments(): Promise<ItchComment[]> {
  console.log("getComments called, isSupabaseConfigured =", isSupabaseConfigured, "SUPABASE_URL =", SUPABASE_URL);
  if (isSupabaseConfigured) {
    try {
      console.log("Fetching comments from Supabase...");
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
      } else {
        console.error(`Supabase GET error (${res.status}):`, await res.text().catch(() => ""));
      }
    } catch (e) {
      console.error("Network error connecting to Supabase comments API:", e);
    }
  }

  console.warn("Supabase not configured or GET failed, reading comments.json...");
  try {
    const res = await fetch("./comments.json");
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) return data;
    }
  } catch (e) {
    console.warn("Could not load comments.json fallback:", e);
  }

  return [];
}

export async function createComment(
  authorName: string,
  textContent: string
): Promise<ItchComment> {
  console.log("Calling createComment");
  console.log("author =", authorName);
  console.log("content =", textContent);
  console.log("SUPABASE_URL =", SUPABASE_URL);
  console.log("SUPABASE_KEY exists =", !!SUPABASE_ANON_KEY);

  const author = authorName.trim();
  const content = textContent.trim();
  if (!author || !content) {
    throw new Error("Tên và nội dung bình luận không được để trống.");
  }

  if (isSupabaseConfigured) {
    console.log("Before fetch POST to Supabase...");
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

    console.log("After fetch POST, status =", res.status);
    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      console.error("Supabase POST error:", res.status, errText);
      throw new Error(`Lỗi máy chủ (${res.status}): ${errText || "Không thể kết nối CSDL Supabase"}`);
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

  console.warn("isSupabaseConfigured is FALSE! SUPABASE_URL or KEY is missing!");
  if (import.meta.env.DEV) {
    return {
      id: `local-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      author,
      content,
      createdAt: new Date().toISOString(),
    };
  }

  throw new Error("Cấu hình máy chủ CSDL (VITE_SUPABASE_URL) chưa được thiết lập trên GitHub Secrets.");
}
