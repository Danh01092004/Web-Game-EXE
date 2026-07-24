import { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  useMotionTemplate,
  useScroll,
  useTransform,
} from "motion/react";
import { getComments, createComment, type ItchComment } from "./services/commentService";

export type { ItchComment };

/* ─── Types ─── */
type Page = "HOME" | "ABOUT" | "CONTACT";

/* ─── Data ─── */
const navItems: { label: Page }[] = [
  { label: "HOME" },
  { label: "ABOUT" },
  { label: "CONTACT" },
];

const teamMembers = [
  { name: "Phan Thiên Bảo", role: "Game Designer" },
  { name: "Huỳnh Đức Anh", role: "Lead Developer" },
  { name: "Trần Tấn Phát", role: "Programmer" },
  { name: "Vũ Nguyễn Phương", role: "Artist" },
  { name: "Lê Nguyễn Gia Hưng", role: "Programmer" },
  { name: "Nguyễn Hoàng Dũng", role: "QA & Story" },
];

const screenshots = [
  {
    src: "./GameImg/1.jpg",
    caption: "Khu Phố Đường tàu",
    tag: "Thế Giới",
    description: "Con hẻm quen thuộc, những mái nhà cũ kỹ và tiếng rao hàng — bối cảnh ngoài Bắc được tái hiện chân thực trong từng góc phố.",
  },
  {
    src: "./GameImg/2.jpg",
    caption: "Bưu điên Việt Nam",
    tag: "Địa Điểm",
    description: "Nơi mọi người thường ghé. Bưu điện nơi góc phố — điểm xuất phát của nhiều cuộc trò chuyện, nhiều manh mối bị bỏ lỡ.",
  },
  {
    src: "./GameImg/3.jpg",
    caption: "Tiệm Sửa Xe Chú 4",
    tag: "Trung Tâm",
    description: "Căn cứ chính của Nam. Mỗi chiếc xe được sửa là một câu chuyện. Mỗi vị khách có thể là một manh mối — hoặc một mối nguy.",
  },
  {
    src: "./GameImg/4.png",
    caption: "Đối Thoại & Cốt Truyện",
    tag: "Gameplay",
    description: "Từng câu thoại sẽ thấy được mối quan hệ và hướng đi của câu chuyện. Sự thật chỉ lộ diện với người biết cách hỏi đúng câu.",
  },
];

/* ════════════════════════════════════════════════
   ITCH STATS
════════════════════════════════════════════════ */

interface GameStats {
  views_count: number;
  downloads_count: number;
  ratings_count: number;
}

function useItchStats() {
  const [stats, setStats] = useState<GameStats>({ views_count: 152, downloads_count: 32, ratings_count: 0 });

  useEffect(() => {
    fetch(`./stats.json?t=${Date.now()}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((data: GameStats) => {
        if (data && typeof data.views_count === "number") {
          setStats(data);
        }
      })
      .catch(() => {/* keep fallback */ });
  }, []);

  return stats;
}

/* ════════════════════════════════════════════════
   ITCH COMMENTS
════════════════════════════════════════════════ */

function useItchComments() {
  const [comments, setComments] = useState<ItchComment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchComments = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getComments();
      setComments(data);
    } catch (err: any) {
      setError(err?.message || "Lỗi khi tải bình luận.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, []);

  const addComment = async (authorName: string, textContent: string) => {
    await createComment(authorName, textContent);
    await fetchComments();
  };

  return { comments, loading, error, addComment, refreshComments: fetchComments };
}

function VideoBackground() {
  return (
    <>
      <video
        style={{
          position: "fixed", top: 0, left: 0,
          width: "100%", height: "100%",
          objectFit: "cover", zIndex: -2,
          filter: "brightness(0.32) saturate(0.8)",
          pointerEvents: "none",
        }}
        src="./Movie_001.mp4"
        autoPlay loop muted playsInline
      />
      {/* Multi-stop overlay for cinematic depth */}
      <div
        style={{
          position: "fixed", top: 0, left: 0,
          width: "100%", height: "100%", zIndex: -1,
          background:
            "linear-gradient(to bottom," +
            "rgba(6,8,16,0.5) 0%," +
            "rgba(6,8,16,0.15) 35%," +
            "rgba(6,8,16,0.25) 65%," +
            "rgba(6,8,16,0.85) 100%)",
          pointerEvents: "none",
        }}
      />
    </>
  );
}

/* ════════════════════════════════════════════════
   NAVBAR
════════════════════════════════════════════════ */
interface NavbarProps {
  activePage: Page;
  onNavigate: (page: Page) => void;
  navRef: React.RefObject<HTMLElement | null>;
}

function Navbar({ activePage, onNavigate, navRef }: NavbarProps) {
  const { scrollY } = useScroll();
  const bgOpacity = useTransform(scrollY, [0, 120], [0, 0.92]);
  const navBg = useMotionTemplate`rgba(6,8,16,${bgOpacity})`;

  const [hidden, setHidden] = useState(false);
  const lastY = useRef(0);
  useEffect(() => {
    return scrollY.on("change", (y) => {
      setHidden(y > lastY.current && y > 120);
      lastY.current = y;
    });
  }, [scrollY]);

  const [hovered, setHovered] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef(new Map<string, HTMLButtonElement>());
  const [indicator, setIndicator] = useState({ x: 0, width: 0 });
  const target = hovered ?? activePage;

  const updateIndicator = () => {
    const c = listRef.current;
    const b = itemRefs.current.get(target);
    if (!c || !b) return;
    const cr = c.getBoundingClientRect();
    const br = b.getBoundingClientRect();
    setIndicator({ x: br.left - cr.left, width: br.width });
  };
  useLayoutEffect(() => { updateIndicator(); }, [target]);
  useEffect(() => {
    window.addEventListener("resize", updateIndicator);
    document.fonts?.ready.then(updateIndicator);
    return () => window.removeEventListener("resize", updateIndicator);
  }, []);

  return (
    <motion.header
      ref={navRef}
      className="fixed top-0 left-0 right-0 z-50"
      animate={{ y: hidden ? -80 : 0, opacity: hidden ? 0 : 1 }}
      transition={{ duration: 0.22, ease: "easeInOut" }}
    >
      <motion.div
        className="w-full flex items-center justify-between px-8 md:px-12 lg:px-16"
        style={{
          height: "68px",
          backgroundColor: navBg,
          backdropFilter: "blur(16px)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        {/* Logo */}
        <button
          type="button"
          onClick={() => onNavigate("HOME")}
          className="flex items-center gap-3 shrink-0"
        >
          <img src="./Animation.png" alt="logo" style={{ height: 30, width: 30 }} />
          <span
            className="font-display font-semibold text-white tracking-widest uppercase"
            style={{ fontSize: "0.95rem", letterSpacing: "0.12em" }}
          >
            Tiệm Sửa Xe Chú 4
          </span>
        </button>

        {/* Nav links */}
        <div
          ref={listRef}
          className="relative hidden md:flex items-center"
          style={{ gap: "4px" }}
          onPointerLeave={() => setHovered(null)}
        >
          {navItems.map(({ label }) => (
            <button
              key={label}
              type="button"
              className="font-display font-medium uppercase transition-colors duration-200"
              style={{
                fontSize: "0.7rem",
                letterSpacing: "0.2em",
                padding: "8px 20px",
                color: activePage === label ? "#e8c87d" : "rgba(255,255,255,0.55)",
              }}
              onPointerEnter={() => setHovered(label)}
              onPointerMove={() => setHovered(label)}
              onFocus={() => setHovered(label)}
              onBlur={() => setHovered(null)}
              onClick={() => onNavigate(label)}
              ref={(node) => {
                if (node) itemRefs.current.set(label, node);
                else itemRefs.current.delete(label);
              }}
            >
              {label}
            </button>
          ))}
          {/* Animated underline */}
          <motion.span
            className="pointer-events-none absolute"
            style={{ bottom: -1, left: 0, height: "1px", background: "#e8c87d" }}
            animate={{ x: indicator.x, width: indicator.width }}
            transition={{ type: "spring", stiffness: 800, damping: 40, mass: 0.4 }}
          />
        </div>

        {/* CTA */}
        <button
          type="button"
          onClick={() => onNavigate("CONTACT")}
          className="btn-ghost hidden md:block"
          style={{ padding: "9px 22px", fontSize: "0.68rem" }}
        >
          Follow Us
        </button>
      </motion.div>
    </motion.header>
  );
}

/* ════════════════════════════════════════════════
   PAGE CONTAINER
════════════════════════════════════════════════ */
function PageContainer({
  children,
  topOffset,
}: {
  children: React.ReactNode;
  topOffset: number;
}) {
  return (
    <main className="w-full" style={{ paddingTop: topOffset }}>
      <AnimatePresence mode="wait">{children}</AnimatePresence>
    </main>
  );
}

/* ════════════════════════════════════════════════
   PAGE FADE
════════════════════════════════════════════════ */
function PageFade({ id, children }: { id: string; children: React.ReactNode }) {
  useLayoutEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, [id]);
  return (
    <motion.div
      key={id}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="w-full"
    >
      {children}
    </motion.div>
  );
}

/* ════════════════════════════════════════════════
   SECTION LABEL — reusable eyebrow
════════════════════════════════════════════════ */
function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="label-eyebrow mb-4">{children}</p>
  );
}

/* ════════════════════════════════════════════════
   LIGHTBOX
════════════════════════════════════════════════ */
interface LightboxItem {
  src: string;
  caption: string;
  tag: string;
  description: string;
}

function Lightbox({ item, onClose }: { item: LightboxItem; onClose: () => void }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        onClick={onClose}
      >
        {/* Backdrop */}
        <div className="absolute inset-0" style={{ background: "rgba(4,6,12,0.92)", backdropFilter: "blur(16px)" }} />

        {/* Card */}
        <motion.div
          className="relative z-10 w-full flex flex-col overflow-hidden"
          style={{ maxWidth: "900px", maxHeight: "90vh", background: "#0a0d16", border: "1px solid rgba(232,200,125,0.2)" }}
          initial={{ opacity: 0, scale: 0.94, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 16 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="absolute top-4 right-4 z-20 flex items-center justify-center transition-colors duration-200"
            style={{
              width: 36, height: 36,
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.12)",
              color: "rgba(255,255,255,0.6)",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "rgba(232,200,125,0.15)";
              (e.currentTarget as HTMLButtonElement).style.color = "#e8c87d";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.06)";
              (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.6)";
            }}
          >
            <svg viewBox="0 0 14 14" fill="none" style={{ width: 14, height: 14 }}>
              <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </button>

          {/* Image */}
          <div className="relative overflow-hidden" style={{ aspectRatio: "16/9", flexShrink: 0 }}>
            <img src={item.src} alt={item.caption} className="w-full h-full object-cover" />
            {/* Bottom gradient */}
            <div
              className="absolute bottom-0 left-0 right-0 pointer-events-none"
              style={{ height: "40%", background: "linear-gradient(to top, #0a0d16, transparent)" }}
            />
          </div>

          {/* Info */}
          <div style={{ padding: "2rem 2.5rem 2.5rem" }}>
            <span className="label-eyebrow mb-3 inline-block" style={{ opacity: 0.6 }}>{item.tag}</span>
            <h2
              className="font-display font-bold text-white uppercase"
              style={{ fontSize: "clamp(1.4rem, 3vw, 2rem)", letterSpacing: "0.04em", lineHeight: 1.15, marginBottom: "1rem" }}
            >
              {item.caption}
            </h2>
            {/* Accent line */}
            <div style={{ width: 40, height: 2, background: "#e8c87d", opacity: 0.6, marginBottom: "1.25rem" }} />
            <p style={{ color: "rgba(255,255,255,0.55)", lineHeight: 1.8, fontSize: "0.92rem", maxWidth: "600px" }}>
              {item.description}
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
/* ════════════════════════════════════════════════
   TRAILER MODAL
════════════════════════════════════════════════ */
function TrailerModal({ onClose }: { onClose: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === " ") { e.preventDefault(); togglePlay(); }
      if (e.key === "m") toggleMute();
    };
    window.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) { v.play(); setPlaying(true); }
    else { v.pause(); setPlaying(false); }
  };

  const toggleMute = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
  };

  const handleTimeUpdate = () => {
    const v = videoRef.current;
    if (!v) return;
    setCurrentTime(v.currentTime);
    setProgress(v.duration ? (v.currentTime / v.duration) * 100 : 0);
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const v = videoRef.current;
    if (!v) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    v.currentTime = ratio * v.duration;
  };

  const handleMouseMove = () => {
    setShowControls(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    if (playing) {
      hideTimer.current = setTimeout(() => setShowControls(false), 2500);
    }
  };

  const fmt = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[200] flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        onClick={onClose}
      >
        {/* Backdrop */}
        <div className="absolute inset-0" style={{ background: "rgba(3,4,10,0.96)", backdropFilter: "blur(20px)" }} />

        {/* Container */}
        <motion.div
          className="relative z-10 w-full"
          style={{ maxWidth: "1000px", padding: "0 1.5rem" }}
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="label-eyebrow" style={{ opacity: 0.5 }}>Official Trailer</span>
              <h2 className="font-display font-bold text-white uppercase mt-1"
                style={{ fontSize: "1.1rem", letterSpacing: "0.08em" }}>
                Tiệm Sửa Xe Chú 4
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex items-center justify-center transition-colors duration-200"
              style={{ width: 36, height: 36, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(232,200,125,0.15)"; e.currentTarget.style.color = "#e8c87d"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; e.currentTarget.style.color = "rgba(255,255,255,0.5)"; }}
            >
              <svg viewBox="0 0 14 14" fill="none" style={{ width: 13, height: 13 }}>
                <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          {/* Video wrapper */}
          <div
            className="relative overflow-hidden"
            style={{ aspectRatio: "16/9", background: "#000", border: "1px solid rgba(232,200,125,0.15)", cursor: playing ? "none" : "pointer" }}
            onMouseMove={handleMouseMove}
            onMouseLeave={() => { if (playing) setShowControls(false); }}
          >
            <video
              ref={videoRef}
              src="./Trailer_ne.mp4"
              className="w-full h-full object-cover"
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={() => setDuration(videoRef.current?.duration ?? 0)}
              onEnded={() => setPlaying(false)}
              onClick={togglePlay}
            />

            {/* Big play button overlay — show when paused */}
            {!playing && (
              <motion.div
                className="absolute inset-0 flex items-center justify-center cursor-pointer"
                style={{ background: "rgba(0,0,0,0.35)" }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={togglePlay}
              >
                <div
                  className="flex items-center justify-center"
                  style={{
                    width: 72, height: 72,
                    background: "rgba(232,200,125,0.15)",
                    border: "2px solid rgba(232,200,125,0.5)",
                    backdropFilter: "blur(8px)",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = "rgba(232,200,125,0.3)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = "rgba(232,200,125,0.15)"; }}
                >
                  <svg viewBox="0 0 24 24" fill="#e8c87d" style={{ width: 28, height: 28, marginLeft: 4 }}>
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </motion.div>
            )}

            {/* Controls bar — show on hover or paused */}
            <motion.div
              className="absolute bottom-0 left-0 right-0"
              style={{ background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 100%)", padding: "1.5rem 1.25rem 1rem" }}
              animate={{ opacity: showControls || !playing ? 1 : 0 }}
              transition={{ duration: 0.3 }}
            >
              {/* Progress bar */}
              <div
                className="w-full cursor-pointer mb-3"
                style={{ height: 3, background: "rgba(255,255,255,0.15)", position: "relative" }}
                onClick={handleSeek}
              >
                <div style={{ width: `${progress}%`, height: "100%", background: "#e8c87d", transition: "width 0.1s" }} />
                {/* Thumb */}
                <div style={{
                  position: "absolute", top: "50%", left: `${progress}%`,
                  transform: "translate(-50%, -50%)",
                  width: 10, height: 10, borderRadius: "50%",
                  background: "#e8c87d",
                  boxShadow: "0 0 6px rgba(232,200,125,0.6)",
                }} />
              </div>

              {/* Controls row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {/* Play/Pause */}
                  <button
                    type="button"
                    onClick={togglePlay}
                    style={{ color: "rgba(255,255,255,0.85)", background: "none", border: "none", cursor: "pointer", padding: 0 }}
                  >
                    {playing ? (
                      <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 20, height: 20 }}>
                        <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 20, height: 20 }}>
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    )}
                  </button>

                  {/* Mute */}
                  <button
                    type="button"
                    onClick={toggleMute}
                    style={{ color: muted ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.85)", background: "none", border: "none", cursor: "pointer", padding: 0 }}
                  >
                    {muted ? (
                      <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 18, height: 18 }}>
                        <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 18, height: 18 }}>
                        <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z" />
                      </svg>
                    )}
                  </button>

                  {/* Time */}
                  <span className="font-display" style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.5)", letterSpacing: "0.05em" }}>
                    {fmt(currentTime)} / {fmt(duration)}
                  </span>
                </div>

                {/* Keyboard hints */}
                <div className="flex items-center gap-3">
                  {[["Space", "Play/Pause"], ["M", "Mute"], ["Esc", "Close"]].map(([key, hint]) => (
                    <span key={key} style={{ fontSize: "0.58rem", color: "rgba(255,255,255,0.25)", letterSpacing: "0.05em" }}>
                      <span style={{ color: "rgba(255,255,255,0.45)", fontFamily: "monospace" }}>{key}</span> {hint}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

/* ════════════════════════════════════════════════
   INLINE TRAILER PLAYER
════════════════════════════════════════════════ */
function InlineTrailerPlayer() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) { v.play(); setPlaying(true); }
    else { v.pause(); setPlaying(false); }
  };

  const toggleMute = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const v = videoRef.current;
    if (!v || !v.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    v.currentTime = ((e.clientX - rect.left) / rect.width) * v.duration;
  };

  const fmt = (s: number) => `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, "0")}`;

  return (
    <div
      className="relative overflow-hidden group"
      style={{ background: "#000", border: "1px solid rgba(232,200,125,0.2)" }}
    >
      <video
        ref={videoRef}
        src="./Trailer_ne.mp4"
        className="w-full block"
        style={{ aspectRatio: "16/9", objectFit: "cover", cursor: "pointer" }}
        onTimeUpdate={() => {
          const v = videoRef.current;
          if (!v) return;
          setCurrentTime(v.currentTime);
          setProgress(v.duration ? (v.currentTime / v.duration) * 100 : 0);
        }}
        onLoadedMetadata={() => setDuration(videoRef.current?.duration ?? 0)}
        onEnded={() => setPlaying(false)}
        onClick={togglePlay}
      />

      {/* Big play overlay */}
      {!playing && (
        <div
          className="absolute inset-0 flex items-center justify-center cursor-pointer"
          style={{ background: "rgba(0,0,0,0.45)" }}
          onClick={togglePlay}
        >
          <div
            style={{
              width: 64, height: 64,
              background: "rgba(232,200,125,0.15)",
              border: "2px solid rgba(232,200,125,0.6)",
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = "rgba(232,200,125,0.3)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = "rgba(232,200,125,0.15)"; }}
          >
            <svg viewBox="0 0 24 24" fill="#e8c87d" style={{ width: 26, height: 26, marginLeft: 4 }}>
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
      )}

      {/* Controls */}
      <div
        className="absolute bottom-0 left-0 right-0"
        style={{
          background: "linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 100%)",
          padding: "1.5rem 1rem 0.75rem",
          opacity: playing ? 0 : 1,
          transition: "opacity 0.3s",
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.opacity = "1"; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.opacity = playing ? "0" : "1"; }}
      >
        {/* Progress */}
        <div
          style={{ height: 3, background: "rgba(255,255,255,0.15)", marginBottom: "0.6rem", cursor: "pointer", position: "relative" }}
          onClick={handleSeek}
        >
          <div style={{ width: `${progress}%`, height: "100%", background: "#e8c87d" }} />
          <div style={{
            position: "absolute", top: "50%", left: `${progress}%`,
            transform: "translate(-50%,-50%)",
            width: 9, height: 9, borderRadius: "50%", background: "#e8c87d",
          }} />
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-4">
          <button type="button" onClick={togglePlay} style={{ color: "white", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
            {playing
              ? <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 18, height: 18 }}><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
              : <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 18, height: 18 }}><path d="M8 5v14l11-7z" /></svg>
            }
          </button>
          <button type="button" onClick={toggleMute} style={{ color: muted ? "rgba(255,255,255,0.35)" : "white", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
            {muted
              ? <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 16, height: 16 }}><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" /></svg>
              : <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 16, height: 16 }}><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z" /></svg>
            }
          </button>
          <span className="font-display" style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.45)", letterSpacing: "0.05em" }}>
            {fmt(currentTime)} / {fmt(duration)}
          </span>
          <span className="font-display uppercase ml-auto" style={{ fontSize: "0.6rem", color: "rgba(232,200,125,0.5)", letterSpacing: "0.15em" }}>
            Official Trailer
          </span>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════
   COMMENT SECTION
════════════════════════════════════════════════ */
function CommentSection() {
  const { comments, loading, error, addComment, refreshComments } = useItchComments();
  const [author, setAuthor] = useState("");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setSuccessMsg("");

    const nameVal = author.trim();
    const contentVal = content.trim();

    if (!nameVal) {
      setFormError("Vui lòng nhập tên của bạn.");
      return;
    }
    if (!contentVal) {
      setFormError("Vui lòng nhập nội dung bình luận.");
      return;
    }

    setSubmitting(true);
    try {
      console.log("Submit clicked");
      console.log("author =", nameVal);
      console.log("content =", contentVal);
      await addComment(nameVal, contentVal);
      setContent("");
      setSuccessMsg("Gửi bình luận thành công!");
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (error: any) {
      console.error("Submit comment error:", error);
      setFormError(error?.message || "Không thể gửi bình luận. Vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  };

  const formatRelativeTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      const now = new Date();
      const diffSec = Math.floor((now.getTime() - d.getTime()) / 1000);
      if (diffSec < 45) return "Vừa xong";
      const diffMin = Math.floor(diffSec / 60);
      if (diffMin < 60) return `${diffMin} phút trước`;
      const diffHour = Math.floor(diffMin / 60);
      if (diffHour < 24) return `${diffHour} giờ trước`;
      const diffDay = Math.floor(diffHour / 24);
      if (diffDay < 7) return `${diffDay} ngày trước`;
      return d.toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const getInitials = (name: string) => {
    const words = name.trim().split(" ");
    if (words.length >= 2) {
      return (words[0][0] + words[words.length - 1][0]).toUpperCase();
    }
    return (name[0] || "U").toUpperCase();
  };

  return (
    <section id="comments" style={{ padding: "0 0 7rem 0" }}>
      <div className="container">
        <div className="text-center mb-12">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
            <Eyebrow>Cộng Đồng & Bình Luận</Eyebrow>
          </motion.div>
          <motion.h2
            className="font-display font-bold text-white uppercase"
            style={{ fontSize: "clamp(2rem, 4vw, 3rem)", letterSpacing: "0.04em", marginTop: "0.75rem" }}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            Ý Kiến Người Chơi
          </motion.h2>
        </div>

        <div className="grid md:grid-cols-12 gap-8 items-start">
          {/* Form */}
          <motion.div
            className="md:col-span-5 p-6 md:p-8 rounded-none border border-white/10 relative overflow-hidden"
            style={{ background: "rgba(6,8,16,0.85)", backdropFilter: "blur(16px)" }}
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-semibold text-white uppercase text-lg tracking-wider">
                Để Lại Bình Luận
              </h3>
              <span className="label-eyebrow" style={{ opacity: 0.5, fontSize: "0.55rem" }}>
                Feedback
              </span>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="flex justify-between items-center label-eyebrow mb-2" style={{ opacity: 0.7 }}>
                  <span>Tên của bạn <span className="text-[#e8c87d]">*</span></span>
                  <span className="text-[0.6rem] text-white/30 lowercase">{author.length}/50</span>
                </label>
                <input
                  type="text"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder="Nhập tên của bạn..."
                  className="w-full px-4 py-3 bg-white/5 border border-white/15 text-white placeholder-white/30 text-sm focus:outline-none focus:border-[#e8c87d] transition-colors"
                  maxLength={50}
                />
              </div>

              <div>
                <label className="flex justify-between items-center label-eyebrow mb-2" style={{ opacity: 0.7 }}>
                  <span>Nội dung bình luận <span className="text-[#e8c87d]">*</span></span>
                  <span className="text-[0.6rem] text-white/30 lowercase">{content.length}/500</span>
                </label>
                <textarea
                  rows={4}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Chia sẻ suy nghĩ của bạn về Tiệm Sửa Xe Chú 4..."
                  className="w-full px-4 py-3 bg-white/5 border border-white/15 text-white placeholder-white/30 text-sm focus:outline-none focus:border-[#e8c87d] transition-colors resize-none"
                  maxLength={500}
                />
              </div>

              {formError && (
                <motion.p
                  className="text-red-400 text-xs font-sans mt-1 p-2 border border-red-500/20 bg-red-500/10"
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  {formError}
                </motion.p>
              )}

              {successMsg && (
                <motion.p
                  className="text-[#e8c87d] text-xs font-sans mt-1 p-2 border border-[#e8c87d]/30 bg-[#e8c87d]/10"
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  {successMsg}
                </motion.p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="btn-primary w-full mt-2 flex items-center justify-center gap-2"
                style={{ opacity: submitting ? 0.7 : 1 }}
              >
                {submitting ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-black" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    <span>ĐANG GỬI...</span>
                  </>
                ) : (
                  <span>GỬI BÌNH LUẬN</span>
                )}
              </button>
            </form>
          </motion.div>

          {/* List */}
          <motion.div
            className="md:col-span-7 flex flex-col gap-4"
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <span className="font-display font-medium uppercase text-xs text-white/50 tracking-widest">
                Danh sách ({comments.length})
              </span>
              <button
                type="button"
                onClick={refreshComments}
                className="text-xs font-display uppercase tracking-widest text-[#e8c87d] hover:underline flex items-center gap-1"
              >
                <span>Làm mới</span>
              </button>
            </div>

            {loading ? (
              <div className="flex flex-col gap-3">
                {[1, 2, 3].map((n) => (
                  <div
                    key={n}
                    className="p-5 border border-white/10 flex gap-4 items-start animate-pulse"
                    style={{ background: "rgba(6,8,16,0.85)" }}
                  >
                    <div className="w-10 h-10 bg-white/10 shrink-0" />
                    <div className="flex-1 flex flex-col gap-2">
                      <div className="h-4 bg-white/10 w-1/3" />
                      <div className="h-3 bg-white/10 w-full" />
                      <div className="h-3 bg-white/10 w-2/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="p-8 text-center border border-red-500/20" style={{ background: "rgba(6,8,16,0.85)" }}>
                <p className="text-red-400 font-sans text-sm mb-3">{error}</p>
                <button
                  type="button"
                  onClick={refreshComments}
                  className="btn-ghost py-2 px-4 text-xs"
                >
                  Thử lại
                </button>
              </div>
            ) : comments.length === 0 ? (
              <div className="p-10 text-center border border-white/10 flex flex-col items-center gap-3" style={{ background: "rgba(6,8,16,0.85)" }}>
                <svg className="w-10 h-10 text-white/20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                <p className="text-white/50 font-sans text-sm">
                  Chưa có bình luận nào. Hãy là người đầu tiên để lại ý kiến!
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-3 max-h-[540px] overflow-y-auto pr-1">
                <AnimatePresence initial={false}>
                  {comments.map((item) => (
                    <motion.div
                      key={item.id}
                      className="p-5 border border-white/10 hover:border-[#e8c87d]/40 transition-all duration-300 flex gap-4 items-start group"
                      style={{ background: "rgba(6,8,16,0.85)", backdropFilter: "blur(8px)" }}
                      initial={{ opacity: 0, y: 14 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.96 }}
                      transition={{ duration: 0.35 }}
                    >
                      <div
                        className="w-10 h-10 shrink-0 font-display font-bold text-[#e8c87d] flex items-center justify-center text-xs group-hover:scale-105 transition-transform"
                        style={{
                          background: "linear-gradient(135deg, rgba(232,200,125,0.2) 0%, rgba(184,150,61,0.08) 100%)",
                          border: "1px solid rgba(232,200,125,0.4)",
                          boxShadow: "0 0 12px rgba(232,200,125,0.05)",
                        }}
                      >
                        {getInitials(item.author)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <span className="font-display font-semibold text-white text-sm tracking-wide group-hover:text-[#e8c87d] transition-colors">
                            {item.author}
                          </span>
                          <span className="text-[0.68rem] text-white/40 font-mono shrink-0">
                            {formatRelativeTime(item.createdAt)}
                          </span>
                        </div>
                        <p className="text-white/70 text-sm leading-relaxed break-words">
                          {item.content}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function HomePage({ onNavigate }: { onNavigate: (p: Page) => void }) {
  const [lightbox, setLightbox] = useState<typeof screenshots[0] | null>(null);
  const trailerRef = useRef<HTMLDivElement>(null);
  const stats = useItchStats();
  const heroStatItems = [
    { value: stats.views_count, label: "LƯỢT XEM" },
    { value: stats.downloads_count, label: "TẢI XUỐNG" },
    { value: stats.ratings_count, label: "ĐÁNH GIÁ" },
  ];

  return (
    <PageFade id="home">

      {/* ══ HERO ══ */}
      <section
        className="relative flex flex-col items-center justify-center text-center overflow-hidden"
        style={{ minHeight: "100vh", padding: "0 1.5rem" }}
      >
        {/* Bottom fade */}
        <div
          className="absolute bottom-0 left-0 right-0 pointer-events-none"
          style={{ height: "220px", background: "linear-gradient(to top, #060810 0%, transparent 100%)" }}
        />

        {/* Subtle horizontal light ray */}
        <div
          className="absolute pointer-events-none"
          style={{
            top: "38%", left: "50%", transform: "translateX(-50%)",
            width: "600px", height: "1px",
            background: "linear-gradient(90deg, transparent, rgba(232,200,125,0.18), transparent)",
            filter: "blur(2px)",
          }}
        />

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="mb-6"
        >
          <span className="label-eyebrow" style={{ opacity: 0.6 }}>Dragon Tail Team &nbsp;·&nbsp; 2026</span>
        </motion.div>

        <motion.h1
          className="font-display font-bold text-white uppercase"
          style={{
            fontSize: "clamp(2.6rem, 8.5vw, 6.5rem)",
            lineHeight: 1.25,
            letterSpacing: "0.04em",
            textShadow: "0 0 120px rgba(232,200,125,0.12), 0 2px 40px rgba(0,0,0,0.6)",
          }}
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
        >
          <span className="block">Tiệm Sửa Xe</span>
          <span className="block mt-3" style={{ color: "#e8c87d" }}>Chú 4</span>
        </motion.h1>

        <motion.p
          className="mt-8 text-white/55"
          style={{ fontSize: "1.05rem", maxWidth: "480px", lineHeight: 1.7 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.9, delay: 0.55 }}
        >
          Khi công lý im lặng, liệu bạn có dám đứng lên?
        </motion.p>

        <motion.div
          className="flex flex-wrap gap-4 justify-center mt-10"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.75 }}
        >
          <button type="button" className="btn-primary" onClick={() => trailerRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })}>Xem Trailer</button>
          <button
            type="button"
            className="btn-ghost"
            onClick={() => onNavigate("ABOUT")}
          >
            Tìm Hiểu Thêm
          </button>
        </motion.div>

        {/* ── Hero Stats Row ── */}
        <motion.div
          className="mt-16 w-full flex justify-center"
          style={{ maxWidth: "480px" }}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 1.0 }}
        >
          <div
            className="w-full"
            style={{ borderTop: "1px solid rgba(232,200,125,0.18)", paddingTop: "1.5rem" }}
          >
            <div className="flex items-stretch justify-center" style={{ gap: 0 }}>
              {heroStatItems.map((item, i) => (
                <motion.div
                  key={item.label}
                  className="flex flex-col items-center justify-center"
                  style={{
                    flex: 1,
                    padding: "0.25rem 0",
                    borderRight: i < heroStatItems.length - 1
                      ? "1px solid rgba(255,255,255,0.1)"
                      : "none",
                  }}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 1.1 + i * 0.1 }}
                >
                  <p
                    className="font-display font-bold"
                    style={{ fontSize: "2.5rem", color: "#e8c87d", lineHeight: 1, letterSpacing: "0.02em" }}
                  >
                    {item.value != null
                      ? item.value.toLocaleString()
                      : <span style={{ color: "rgba(255,255,255,0.2)", fontSize: "1.8rem" }}>—</span>
                    }
                  </p>
                  <p
                    className="font-display uppercase mt-2"
                    style={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.35)", letterSpacing: "0.3em" }}
                  >
                    {item.label}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Scroll cue */}
        <motion.div
          className="absolute flex flex-col items-center gap-2"
          style={{ bottom: "2.5rem" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4, duration: 0.8 }}
        >
          <span className="label-eyebrow" style={{ opacity: 0.3, fontSize: "0.6rem" }}>Scroll</span>
          <motion.div
            style={{ width: "1px", height: "36px", background: "linear-gradient(to bottom, rgba(232,200,125,0.5), transparent)" }}
            animate={{ scaleY: [0.4, 1, 0.4] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
        </motion.div>
      </section>

      {/* ══ FEATURE SHOWCASE ══ */}
      <section style={{ padding: "7rem 0" }}>
        <div className="container">
          <div className="text-center mb-16">
            <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
              <Eyebrow>Feature Showcase</Eyebrow>
            </motion.div>
            <motion.h2
              className="font-display font-bold text-white uppercase"
              style={{ fontSize: "clamp(2rem, 4vw, 3rem)", letterSpacing: "0.04em", marginTop: "0.75rem" }}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              Thế Giới Game
            </motion.h2>
          </div>

          {/* Big card — first image full width */}
          <motion.div
            className="relative overflow-hidden group cursor-pointer mb-3"
            style={{ aspectRatio: "21/8" }}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.65 }}
            onClick={() => setLightbox(screenshots[0])}
          >
            <img
              src={screenshots[0].src}
              alt={screenshots[0].caption}
              className="w-full h-full object-cover"
              style={{ transition: "transform 0.8s cubic-bezier(0.25,0.8,0.25,1)", objectPosition: "center 30%" }}
              onMouseEnter={(e) => ((e.target as HTMLImageElement).style.transform = "scale(1.04)")}
              onMouseLeave={(e) => ((e.target as HTMLImageElement).style.transform = "scale(1)")}
            />
            {/* Overlay */}
            <div
              className="absolute inset-0"
              style={{ background: "linear-gradient(to right, rgba(6,8,16,0.85) 0%, rgba(6,8,16,0.3) 40%, rgba(6,8,16,0.1) 100%)" }}
            />
            {/* Content */}
            <div className="absolute inset-0 flex flex-col justify-end p-8 md:p-12">
              <span className="label-eyebrow mb-3" style={{ opacity: 0.7 }}>{screenshots[0].tag}</span>
              <h3
                className="font-display font-bold text-white uppercase mb-3"
                style={{ fontSize: "clamp(1.4rem, 3vw, 2.2rem)", letterSpacing: "0.04em", lineHeight: 1.1 }}
              >
                {screenshots[0].caption}
              </h3>
              <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "0.9rem", lineHeight: 1.75, maxWidth: "480px" }}>
                {screenshots[0].description}
              </p>
            </div>
            {/* Accent border */}
            <div className="absolute inset-0 pointer-events-none border border-transparent group-hover:border-[#e8c87d]/25 transition-colors duration-500" />
          </motion.div>

          {/* 3 smaller cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {screenshots.slice(1).map((img, i) => (
              <motion.div
                key={i}
                className="relative overflow-hidden group cursor-pointer flex flex-col"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.55, delay: i * 0.1 }}
                onClick={() => setLightbox(img)}
              >
                {/* Image */}
                <div className="relative overflow-hidden" style={{ aspectRatio: "16/9" }}>
                  <img
                    src={img.src}
                    alt={img.caption}
                    className="w-full h-full object-cover"
                    style={{ transition: "transform 0.7s cubic-bezier(0.25,0.8,0.25,1)" }}
                    onMouseEnter={(e) => ((e.target as HTMLImageElement).style.transform = "scale(1.06)")}
                    onMouseLeave={(e) => ((e.target as HTMLImageElement).style.transform = "scale(1)")}
                  />
                  {/* Tag badge */}
                  <div
                    className="absolute top-3 left-3"
                    style={{
                      background: "rgba(6,8,16,0.75)",
                      backdropFilter: "blur(8px)",
                      border: "1px solid rgba(232,200,125,0.3)",
                      padding: "3px 10px",
                    }}
                  >
                    <span className="label-eyebrow" style={{ opacity: 0.8, fontSize: "0.55rem" }}>{img.tag}</span>
                  </div>
                  <div className="absolute inset-0 pointer-events-none border border-transparent group-hover:border-[#e8c87d]/25 transition-colors duration-400" />
                </div>

                {/* Text below image */}
                <div
                  style={{
                    background: "rgba(6,8,16,0.7)",
                    backdropFilter: "blur(12px)",
                    border: "1px solid rgba(255,255,255,0.07)",
                    borderTop: "1px solid rgba(232,200,125,0.15)",
                    padding: "1.2rem 1.4rem",
                    flex: 1,
                    transition: "border-color 0.3s",
                  }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLDivElement).style.borderTopColor = "rgba(232,200,125,0.4)")}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLDivElement).style.borderTopColor = "rgba(232,200,125,0.15)")}
                >
                  <h3
                    className="font-display font-bold text-white uppercase mb-2"
                    style={{ fontSize: "0.95rem", letterSpacing: "0.06em", lineHeight: 1.2 }}
                  >
                    {img.caption}
                  </h3>
                  <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "0.78rem", lineHeight: 1.7 }}>
                    {img.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="container"><div className="section-divider" /></div>

      {/* Lightbox */}
      {lightbox && <Lightbox item={lightbox} onClose={() => setLightbox(null)} />}

      {/* ══ STORY ══ */}
      <section style={{ padding: "7rem 0" }}>
        <div className="container">
          <div
            className="grid gap-16 items-center"
            style={{ gridTemplateColumns: "1fr 1fr" }}
          >
            {/* Trailer Video Player */}
            <motion.div
              ref={trailerRef}
              className="relative overflow-hidden"
              initial={{ opacity: 0, x: -24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.75 }}
            >
              <InlineTrailerPlayer />
              {/* Accent border */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{ border: "1px solid rgba(232,200,125,0.15)" }}
              />
            </motion.div>

            {/* Text */}
            <motion.div
              className="flex flex-col gap-6"
              initial={{ opacity: 0, x: 24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.75, delay: 0.1 }}
            >
              <Eyebrow>Cốt Truyện</Eyebrow>
              <h2
                className="font-display font-bold text-white uppercase"
                style={{ fontSize: "clamp(2rem, 3.5vw, 2.8rem)", lineHeight: 1.1, letterSpacing: "0.03em" }}
              >
                Hành Trình<br />Tìm Sự Thật
              </h2>

              {/* Accent line */}
              <div style={{ width: "48px", height: "2px", background: "#e8c87d", opacity: 0.7 }} />

              <p style={{ color: "rgba(255,255,255,0.6)", lineHeight: 1.8, fontSize: "0.95rem" }}>
                Một tiệm sửa xe nhỏ. Một vụ xô xát bất ngờ. Một bí mật bị chôn vùi nhiều năm.
              </p>
              <p style={{ color: "rgba(255,255,255,0.5)", lineHeight: 1.8, fontSize: "0.95rem" }}>
                Huỳnh Đức Nam buộc phải quay trở lại con đường võ thuật để đối mặt với sự thật đằng sau cái chết của mẹ mình — và những kẻ nắm giữ quyền lực trong bóng tối.
              </p>

              {/* Stats */}
              <div
                className="grid grid-cols-3 mt-4 pt-6"
                style={{ borderTop: "1px solid rgba(255,255,255,0.1)", gap: "1.5rem" }}
              >
                {[
                  { num: "3", label: "Giai đoạn" },
                  { num: "6", label: "Thành viên" },
                  { num: "2026", label: "Ra mắt" },
                ].map((s) => (
                  <div key={s.label} className="text-center">
                    <p
                      className="font-display font-bold text-white"
                      style={{ fontSize: "2rem", lineHeight: 1, color: "#e8c87d" }}
                    >
                      {s.num}
                    </p>
                    <p className="label-eyebrow mt-2" style={{ opacity: 0.45, fontSize: "0.6rem" }}>
                      {s.label}
                    </p>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ══ TAGLINES ══ */}
      <section style={{ padding: "0 0 7rem 0" }}>
        <div className="container">
          <div className="section-divider mb-0" />
          <div className="grid" style={{ gridTemplateColumns: "repeat(3, 1fr)", gap: "1px", background: "rgba(255,255,255,0.06)" }}>
            {[
              { num: "01", text: "Một cú đấm hạ gục kẻ thù. Chỉ sự thật chấm dứt quá khứ." },
              { num: "02", text: "Khi công lý im lặng, liệu bạn có dám đứng lên?" },
              { num: "03", text: "Hành trình người thợ sửa xe. Cuộc chiến với thế lực ngầm." },
            ].map((t, i) => (
              <motion.div
                key={t.num}
                className="flex flex-col gap-5"
                style={{
                  background: "rgba(6,8,16,0.8)",
                  padding: "2.5rem 2rem",
                  backdropFilter: "blur(8px)",
                }}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
              >
                <span className="label-eyebrow" style={{ opacity: 0.3 }}>{t.num}</span>
                <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.9rem", fontStyle: "italic", lineHeight: 1.75 }}>
                  "{t.text}"
                </p>
              </motion.div>
            ))}
          </div>
          <div className="section-divider mt-0" />
        </div>
      </section>

      {/* ══ COMMENTS ══ */}
      <CommentSection />

    </PageFade>
  );
}

/* ════════════════════════════════════════════════
   ABOUT PAGE
════════════════════════════════════════════════ */
function AboutPage() {
  const initials = (name: string) =>
    name.split(" ").slice(-2).map((w) => w[0]).join("").toUpperCase();

  return (
    <PageFade id="about">

      {/* Hero Banner */}
      <section className="relative overflow-hidden flex items-end" style={{ height: "52vh", minHeight: "360px" }}>
        <img
          src="./GameImg/2.jpg"
          alt="About banner"
          className="absolute inset-0 w-full h-full object-cover"
          style={{ filter: "brightness(0.35) saturate(0.7)" }}
        />
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(to top, #060810 0%, rgba(6,8,16,0.4) 50%, transparent 100%)" }}
        />
        <div className="relative container pb-14">
          <Eyebrow>About Us</Eyebrow>
          <h1
            className="font-display font-bold text-white uppercase"
            style={{ fontSize: "clamp(2.5rem, 6vw, 5rem)", lineHeight: 1.05, letterSpacing: "0.04em" }}
          >
            Dragon Tail Team
          </h1>
        </div>
      </section>

      <div className="container" style={{ paddingTop: "5rem", paddingBottom: "8rem", display: "flex", flexDirection: "column", gap: "5rem" }}>

        {/* Lead */}
        <motion.p
          style={{ color: "rgba(255,255,255,0.55)", fontSize: "1.15rem", lineHeight: 1.75, maxWidth: "640px" }}
          initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
        >
          Sáu sinh viên. Một ước mơ. Một hành trình từ giảng đường FPT đến sản phẩm game đầu tay.
        </motion.p>

        {/* Team */}
        <section>
          <Eyebrow>The Team</Eyebrow>
          <div
            className="grid"
            style={{ gridTemplateColumns: "repeat(3, 1fr)", gap: "1px", background: "rgba(255,255,255,0.07)" }}
          >
            {teamMembers.map((member, i) => (
              <motion.div
                key={member.name}
                className="group flex items-center gap-4"
                style={{
                  background: "rgba(6,8,16,0.85)",
                  padding: "1.4rem 1.5rem",
                  transition: "background 0.25s",
                }}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(232,200,125,0.05)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(6,8,16,0.85)")}
              >
                <div
                  className="font-display font-bold text-white/60 shrink-0 flex items-center justify-center"
                  style={{
                    width: 44, height: 44, fontSize: "0.8rem", letterSpacing: "0.05em",
                    background: "rgba(232,200,125,0.08)",
                    border: "1px solid rgba(232,200,125,0.2)",
                  }}
                >
                  {initials(member.name)}
                </div>
                <div>
                  <p className="text-white/85 font-medium" style={{ fontSize: "0.9rem" }}>{member.name}</p>
                  <p className="label-eyebrow mt-1" style={{ opacity: 0.4, fontSize: "0.58rem" }}>{member.role}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Story */}
        <section
          className="grid items-start"
          style={{ gridTemplateColumns: "1fr 1fr", gap: "4rem" }}
        >
          <div className="flex flex-col gap-5">
            <Eyebrow>Our Story</Eyebrow>
            <h2
              className="font-display font-bold text-white uppercase"
              style={{ fontSize: "clamp(1.8rem, 3vw, 2.5rem)", lineHeight: 1.1, letterSpacing: "0.03em" }}
            >
              Từ Lớp Học<br />Đến Sản Phẩm Thật
            </h2>
            <div style={{ width: 40, height: 2, background: "#e8c87d", opacity: 0.6 }} />
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem", color: "rgba(255,255,255,0.55)", fontSize: "0.92rem", lineHeight: 1.8 }}>
              <p>Dragon Tail ra đời trong một môn Startup tại FPT. Sáu sinh viên, sáu tính cách, một đội — không ai nghĩ họ sẽ làm được điều gì lớn.</p>
              <p>Những đêm thức trắng, tranh cãi về ý tưởng, những lần mất dữ liệu. Nhưng chính trong áp lực đó, cả nhóm tìm thấy mục tiêu chung: tạo ra một game mang đậm bản sắc Việt Nam.</p>
              <p style={{ color: "rgba(255,255,255,0.75)", fontWeight: 500 }}>
                Dragon Tail không chỉ là tên nhóm. Đó là biểu tượng của sự kiên trì — đuôi rồng, phần không bao giờ tách rời.
              </p>
            </div>
          </div>

          <motion.div
            className="relative overflow-hidden"
            initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <img
              src="./GameImg/3.jpg"
              alt="Our story"
              className="w-full object-cover"
            />
            <div className="absolute inset-0 pointer-events-none" style={{ border: "1px solid rgba(232,200,125,0.15)" }} />
          </motion.div>
        </section>

        {/* Quote */}
        <blockquote
          style={{
            borderLeft: "2px solid rgba(232,200,125,0.4)",
            paddingLeft: "2rem",
            color: "rgba(255,255,255,0.5)",
            fontStyle: "italic",
            fontSize: "1.15rem",
            lineHeight: 1.75,
            maxWidth: "700px",
          }}
        >
          "Sometimes the most meaningful destination is not where we arrive, but the people who walk beside us along the way."
        </blockquote>

      </div>
    </PageFade>
  );
}

/* ════════════════════════════════════════════════
   CONTACT PAGE
════════════════════════════════════════════════ */
function ContactPage() {
  const socials = [
    {
      platform: "X (Twitter)", handle: "@dragontails_stu",
      href: "https://x.com/dragontails_stu/status/2061987750522531885",
      description: "Latest updates, dev logs, and game announcements.",
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 22, height: 22 }}>
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.91-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      ),
    },
    {
      platform: "Facebook", handle: "dragontails.stu",
      href: "https://www.facebook.com/dragontails.stu",
      description: "Behind-the-scenes content, team updates, and fan discussions.",
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 22, height: 22 }}>
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      ),
    },
  ];

  return (
    <PageFade id="contact">

      {/* Banner */}
      <section className="relative overflow-hidden flex items-end" style={{ height: "44vh", minHeight: "300px" }}>
        <img
          src="./GameImg/1.jpg"
          alt="Contact banner"
          className="absolute inset-0 w-full h-full object-cover"
          style={{ filter: "brightness(0.3) saturate(0.6)" }}
        />
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(to top, #060810 0%, rgba(6,8,16,0.35) 50%, transparent 100%)" }}
        />
        <div className="relative container pb-12">
          <Eyebrow>Get in Touch</Eyebrow>
          <h1
            className="font-display font-bold text-white uppercase"
            style={{ fontSize: "clamp(2.5rem, 6vw, 5rem)", lineHeight: 1.05, letterSpacing: "0.04em" }}
          >
            Follow Us
          </h1>
        </div>
      </section>

      <div className="container" style={{ paddingTop: "5rem", paddingBottom: "8rem" }}>
        <p style={{ color: "rgba(255,255,255,0.45)", marginBottom: "3.5rem", maxWidth: "480px", lineHeight: 1.75 }}>
          Follow Dragon Tail Team để cập nhật tin tức mới nhất về game.
        </p>

        <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(280px, 400px))", gap: "1px", background: "rgba(255,255,255,0.07)", maxWidth: "820px" }}>
          {socials.map((s) => (
            <motion.a
              key={s.platform}
              href={s.href}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex flex-col gap-5"
              style={{
                background: "rgba(6,8,16,0.85)",
                padding: "2.5rem",
                transition: "background 0.25s",
                textDecoration: "none",
              }}
              whileHover={{ y: -2 }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(232,200,125,0.04)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(6,8,16,0.85)")}
            >
              <div className="flex items-center justify-between">
                <div style={{ color: "rgba(255,255,255,0.5)", transition: "color 0.2s" }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "#e8c87d")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.5)")}
                >
                  {s.icon}
                </div>
                <svg viewBox="0 0 16 16" fill="none" style={{ width: 14, height: 14, color: "rgba(255,255,255,0.2)" }}>
                  <path d="M3 13L13 3M13 3H6M13 3V10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div>
                <p className="label-eyebrow mb-2" style={{ opacity: 0.35, fontSize: "0.58rem" }}>{s.platform}</p>
                <p className="font-display font-semibold text-white" style={{ fontSize: "1.15rem", marginBottom: "0.5rem" }}>{s.handle}</p>
                <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.82rem", lineHeight: 1.7 }}>{s.description}</p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "rgba(232,200,125,0.5)", fontSize: "0.68rem" }}>
                <span className="font-display font-medium uppercase tracking-widest">Visit</span>
                <span>→</span>
              </div>
            </motion.a>
          ))}
        </div>
      </div>
    </PageFade>
  );
}

/* ════════════════════════════════════════════════
   ROOT APP
════════════════════════════════════════════════ */
export default function App() {
  const [activePage, setActivePage] = useState<Page>("HOME");
  const [navHeight, setNavHeight] = useState(68);
  const navRef = useRef<HTMLElement>(null);

  const navigate = (page: Page) => {
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
    setActivePage(page);
  };

  useLayoutEffect(() => {
    const el = navRef.current;
    if (!el) return;
    const update = () => setNavHeight(el.getBoundingClientRect().height);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const totalOffset = navHeight;

  return (
    <>
      <VideoBackground />
      <div style={{ width: "100%", overflowX: "hidden" }} className="selection:bg-white/10 selection:text-white">
        <Navbar activePage={activePage} onNavigate={navigate} navRef={navRef} />
        <PageContainer topOffset={totalOffset}>
          {activePage === "HOME" && <HomePage key="home" onNavigate={navigate} />}
          {activePage === "ABOUT" && <AboutPage key="about" />}
          {activePage === "CONTACT" && <ContactPage key="contact" />}
        </PageContainer>
      </div>
    </>
  );
}
