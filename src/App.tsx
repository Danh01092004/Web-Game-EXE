import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useMotionTemplate, useScroll, useTransform } from "motion/react";

type Page = "HOME" | "ABOUT" | "CONTACT";

const navItems: { label: Page }[] = [
  { label: "HOME" },
  { label: "ABOUT" },
  { label: "CONTACT" },
];

const teamMembers = [
  "Phan Thiên Bảo",
  "Huỳnh Đức Anh",
  "Trần Tấn Phát",
  "Vũ Nguyễn Phương",
  "Lê Nguyễn Gia Hưng",
  "Nguyễn Hoàng Dũng",
];

/* ════════════════════════════════════════
   NAVBAR
════════════════════════════════════════ */
interface NavbarProps {
  activePage: Page;
  onNavigate: (page: Page) => void;
  navRef: React.RefObject<HTMLElement | null>;
}

function Navbar({ activePage, onNavigate, navRef }: NavbarProps) {
  const { scrollY } = useScroll();
  const navBlur    = useTransform(scrollY, [0, 200], [12, 20]);
  const navOpacity = useTransform(scrollY, [0, 200], [0.75, 0.92]);
  const navBg      = useMotionTemplate`rgba(8, 12, 18, ${navOpacity})`;
  const navBlurVal = useMotionTemplate`blur(${navBlur}px)`;

  const [hidden, setHidden] = useState(false);
  const lastY = useRef(0);

  useEffect(() => {
    return scrollY.on("change", (y) => {
      setHidden(y > lastY.current && y > 80);
      lastY.current = y;
    });
  }, [scrollY]);

  const [hovered, setHovered] = useState<string | null>(null);
  const listRef    = useRef<HTMLDivElement>(null);
  const itemRefs   = useRef(new Map<string, HTMLButtonElement>());
  const [indicator, setIndicator] = useState({ x: 0, width: 0 });

  const target = hovered ?? activePage;

  const updateIndicator = () => {
    const container = listRef.current;
    const btn = itemRefs.current.get(target);
    if (!container || !btn) return;
    const cr = container.getBoundingClientRect();
    const br = btn.getBoundingClientRect();
    setIndicator({ x: br.left - cr.left, width: br.width });
  };

  useLayoutEffect(() => { updateIndicator(); }, [target]);
  useEffect(() => {
    window.addEventListener("resize", updateIndicator);
    document.fonts?.ready.then(updateIndicator);
    return () => window.removeEventListener("resize", updateIndicator);
  }, []);

  return (
    /* fixed — top-0 left-0 right-0 — never moves */
    <motion.header
      ref={navRef}
      className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-6xl pointer-events-none"
      animate={{ y: hidden ? -120 : 0, opacity: hidden ? 0 : 1 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
    >
      <motion.div
        className="pointer-events-auto w-full max-w-6xl rounded-full px-5 md:px-8 py-3 border border-white/10 shadow-[0_0_40px_rgba(59,130,246,0.08)]"
        style={{ backdropFilter: navBlurVal, backgroundColor: navBg }}
      >
        <div className="relative flex items-center gap-6">
          {/* Logo */}
          <button
            type="button"
            onClick={() => onNavigate("HOME")}
            className="flex items-center gap-3 shrink-0 min-w-[180px]"
          >
            <img src="./Animation.png" alt="Đạo Võ emblem" className="h-8 w-8" />
            <div className="leading-tight text-left">
              <p className="text-sm font-semibold text-white">Tiệm sửa xe Chú 4</p>
            </div>
          </button>

          {/* Nav links */}
          <div className="flex-1 flex justify-center">
            <div
              ref={listRef}
              className="relative flex items-center gap-8 text-[11px] uppercase tracking-[0.35em] text-white/70"
              onPointerLeave={() => setHovered(null)}
            >
              {navItems.map(({ label }) => (
                <button
                  key={label}
                  type="button"
                  className="relative px-4 py-2.5 transition-colors hover:text-white"
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
              {/* Sliding underline indicator */}
              <motion.span
                className="pointer-events-none absolute -bottom-1 left-0 h-[2px] rounded-full bg-white/70 shadow-[0_0_10px_rgba(255,255,255,0.35)]"
                animate={{ x: indicator.x, width: indicator.width }}
                transition={{ type: "spring", stiffness: 900, damping: 45, mass: 0.4 }}
              />
            </div>
          </div>

          <div className="min-w-[180px] shrink-0" aria-hidden />
        </div>

        {/* Glow pulse */}
        <motion.div
          className="pointer-events-none absolute inset-0 rounded-full"
          animate={{ opacity: [0.3, 0.5] }}
          transition={{ duration: 6, ease: "linear", repeat: Infinity, repeatType: "mirror" }}
          style={{ boxShadow: "inset 0 0 20px rgba(255,255,255,0.07), 0 0 28px rgba(59,130,246,0.10)" }}
        />
      </motion.div>
    </motion.header>
  );
}

/* ════════════════════════════════════════
   PAGE CONTAINER
════════════════════════════════════════ */
function PageContainer({ children, topOffset }: { children: React.ReactNode; topOffset: number }) {
  return (
    <main
      className="relative z-10 w-full min-h-screen flex flex-col items-center"
      style={{ paddingTop: topOffset, paddingBottom: "8rem" }}
    >
      <div className="w-[92%] max-w-6xl">
        <AnimatePresence mode="wait">
          {children}
        </AnimatePresence>
      </div>
    </main>
  );
}

/* ════════════════════════════════════════
   SHARED — page fade wrapper
════════════════════════════════════════ */
function PageFade({ id, children }: { id: string; children: React.ReactNode }) {
  useLayoutEffect(() => { window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior }); }, [id]);
  return (
    <motion.div
      key={id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="w-full"
    >
      {children}
    </motion.div>
  );
}

/* ════════════════════════════════════════
   SHARED — section hero header
════════════════════════════════════════ */
function PageHero({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle: string }) {
  return (
    <section className="py-12 flex flex-col items-center text-center">
      <motion.p className="text-sm uppercase tracking-[0.4em] text-white/35" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
        {eyebrow}
      </motion.p>
      <motion.h1
        className="mt-4 text-4xl md:text-6xl font-bold text-white tracking-tight"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.08 }}
      >
        {title}
      </motion.h1>
      <motion.p
        className="mt-4 text-base md:text-lg text-white/55 max-w-md mx-auto text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.18 }}
      >
        {subtitle}
      </motion.p>
      <motion.div
        className="mt-7 flex items-center justify-center gap-3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.28 }}
      >
        <div className="h-px w-20 bg-gradient-to-r from-transparent to-white/20" />
        <div className="w-1.5 h-1.5 rounded-full bg-white/30" />
        <div className="h-px w-20 bg-gradient-to-l from-transparent to-white/20" />
      </motion.div>
    </section>
  );
}

/* ════════════════════════════════════════
   HOME PAGE
════════════════════════════════════════ */
function HomePage({ onNavigate }: { onNavigate: (p: Page) => void }) {
  return (
    <PageFade id="home">
      {/* Hero */}
      <section className="flex flex-col items-center justify-center min-h-[55vh] text-center py-16">
        <motion.h1
          className="text-5xl md:text-8xl font-bold text-white tracking-tight leading-tight"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.1, delay: 0.05, ease: "easeOut" }}
        >
          Tiệm Sửa Xe Chú 4
        </motion.h1>
        <motion.p
          className="mt-5 text-base md:text-lg text-white/60 max-w-lg"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.9, delay: 0.35 }}
        >
          Khám phá thế giới Vovinam đỉnh cao — nơi tình thương kết thúc là lúc bạo lực lên ngôi
        </motion.p>
        <motion.div
          className="mt-8 flex flex-wrap items-center justify-center gap-4"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          <button
            type="button"
            onClick={() => onNavigate("ABOUT")}
            className="inline-flex items-center gap-2 px-8 py-3 rounded-full bg-white/10 text-white text-sm font-medium backdrop-blur-md border border-white/15 hover:bg-white/20 transition-all duration-300"
          >
            Tìm hiểu thêm →
          </button>
        </motion.div>
      </section>

      {/* Below-fold content — stacked with consistent spacing */}
      <div className="flex flex-col gap-y-20">

        {/* Trailer + CTA */}
        <motion.section
          className="flex flex-col lg:flex-row gap-8 items-start"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true, amount: 0.1 }}
        >
          {/* Trailer */}
          <div className="w-full lg:w-1/2 rounded-2xl border border-white/10 bg-black/40 p-5">
            <p className="text-xs uppercase tracking-[0.3em] text-white/40 mb-3">Trailer</p>
            <div className="aspect-video w-full rounded-xl bg-gradient-to-br from-white/15 via-white/5 to-transparent" />
            <div className="mt-4">
              <button className="rounded-full border border-white/20 px-5 py-2 text-xs uppercase tracking-widest text-white/80 hover:text-white transition-colors">Xem trailer</button>
            </div>
          </div>
          {/* CTA */}
          <div className="w-full lg:w-1/2 space-y-4 pt-2">
            <p className="text-xs uppercase tracking-[0.3em] text-white/40">TIỆM SỬA XE CHÚ 4</p>
            <h2 className="text-3xl md:text-4xl font-semibold text-white">Khai mở kỷ nguyên mới cho Vovinam</h2>
            <p className="text-sm md:text-base text-white/60 leading-relaxed">
              Tiệm Sửa Xe Chú 4 sở hữu hệ thống kỹ thuật phong phú với hàng trăm đòn thế, quyền pháp, tự vệ và vũ khí. Người học có thể rèn luyện toàn diện, kết hợp kỹ thuật, thể lực và tinh thần võ đạo để hình thành phong cách chiến đấu riêng.
            </p>
          </div>
        </motion.section>

        {/* Story + Taglines */}
        <motion.section
          className="flex flex-col gap-10"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true, amount: 0.1 }}
        >
          {/* Story text */}
          <div
            className="rounded-3xl border border-white/10 p-8 md:p-12 space-y-5 text-sm md:text-base text-white/70 leading-relaxed"
            style={{ background: "rgba(255,255,255,0.03)", backdropFilter: "blur(8px)" }}
          >
            <p>Một khu phố nhỏ. Một tiệm sửa xe cũ kỹ. Một cuộc sống tưởng chừng bình yên.</p>
            <p>Huỳnh Đức Nam chưa từng nghĩ rằng một vụ xô xát với nhóm côn đồ trong khu phố lại trở thành khởi đầu cho hành trình thay đổi cuộc đời mình. Khi những bí mật bị chôn vùi nhiều năm dần lộ diện, Nam phát hiện cái chết của mẹ anh có thể không phải là một tai nạn như mọi người vẫn tin.</p>
            <p>Bị cuốn vào vòng xoáy của bạo lực, quyền lực và những âm mưu được che giấu sau vẻ ngoài bình thường của thành phố, Nam buộc phải quay trở lại con đường võ thuật mà anh đã bỏ quên từ lâu. Mỗi trận chiến không chỉ là cuộc đối đầu với những kẻ đứng trước mặt, mà còn là cuộc chiến với quá khứ, sự thật và chính bản thân mình.</p>
            <p>Liệu công lý có thể chiến thắng khi đối thủ là những kẻ nắm giữ tiền bạc và quyền lực? Liệu Nam có đủ sức đối mặt với sự thật đau đớn về những người anh từng tin tưởng nhất?</p>
            <p>Hãy bước vào thế giới của Nam, khám phá những bí mật đằng sau vụ tai nạn năm xưa và tự mình quyết định đâu là chính nghĩa.</p>
            <p className="text-white/85 font-semibold">Sự thật đang chờ được phơi bày.</p>
            <p className="text-white/55 italic">Phần còn lại của câu chuyện... bạn sẽ phải tự mình trải nghiệm.</p>
          </div>

          {/* Taglines */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              "Một cú đấm có thể hạ gục kẻ thù. Nhưng chỉ sự thật mới có thể chấm dứt quá khứ.",
              "Khi công lý im lặng, liệu bạn có dám đứng lên?",
              "Hành trình của một người thợ sửa xe. Cuộc chiến chống lại cả một thế lực ngầm.",
            ].map((line, i) => (
              <div
                key={i}
                className="rounded-2xl border border-white/10 p-6 flex items-center"
                style={{ background: "rgba(255,255,255,0.04)" }}
              >
                <p className="text-sm text-white/70 italic leading-relaxed">"{line}"</p>
              </div>
            ))}
          </div>
        </motion.section>

      </div>
    </PageFade>
  );
}

/* ════════════════════════════════════════
   ABOUT PAGE
════════════════════════════════════════ */
function AboutPage() {
  const initials = (name: string) =>
    name.split(" ").slice(-2).map((w) => w[0]).join("").toUpperCase();

  return (
    <PageFade id="about">
      <PageHero eyebrow="About Us" title="Dragon Tail Team" subtitle="Six students. One dream. One journey." />

      <div className="flex flex-col gap-y-16 pb-40">

        {/* The Team */}
        <section>
          <p className="text-sm uppercase tracking-[0.4em] text-white/35 text-center mb-8">The Team</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {teamMembers.map((member, i) => (
              <div
                key={member}
                className="liquid-glass rounded-2xl border border-white/10 p-5 flex items-center gap-4"
              >
                <div
                  className="flex-shrink-0 w-11 h-11 rounded-full border border-white/15 flex items-center justify-center text-xs font-bold text-white/70 tracking-wide"
                  style={{ background: "linear-gradient(135deg, rgba(59,130,246,0.25), rgba(255,255,255,0.06))" }}
                >
                  {initials(member)}
                </div>
                <div>
                  <p className="text-[9px] uppercase tracking-[0.25em] text-white/35 mb-1">Member {i + 1}</p>
                  <p className="text-sm text-white/85 font-medium leading-snug">{member}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Our Story */}
        <section>
          <p className="text-sm uppercase tracking-[0.4em] text-white/35 text-center mb-8">Our Story</p>
          <div
            className="rounded-3xl border border-white/10 p-6 md:p-10 space-y-5 text-sm md:text-base text-white/70 leading-relaxed"
            style={{ background: "rgba(255,255,255,0.03)", backdropFilter: "blur(8px)" }}
          >
            <p>Dragon Tail là một nhóm gồm sáu sinh viên đến từ Trường Đại học FPT. Nhóm được thành lập vào năm cuối đại học, trong giai đoạn mà mỗi thành viên đều đứng trước những lựa chọn quan trọng của cuộc đời: tìm kiếm công việc ổn định hay theo đuổi đam mê sáng tạo đầy rủi ro.</p>
            <p>Mọi chuyện bắt đầu từ một môn Startup của trường. Sáu con người với sáu tính cách khác nhau được ghép chung vào một đội. Ban đầu, không ai nghĩ họ có thể làm việc cùng nhau. Những cuộc tranh cãi về ý tưởng, những đêm thức trắng sửa lỗi và áp lực từ thời hạn dự án khiến cả nhóm nhiều lần đứng bên bờ vực tan rã.</p>
            <p>Người muốn tập trung vào đồ họa, người theo đuổi gameplay. Có người muốn tạo ra một trò chơi giải trí đơn giản, trong khi người khác lại muốn kể một câu chuyện mang đậm bản sắc Việt Nam. Sự khác biệt ấy từng khiến cả nhóm đối đầu gay gắt.</p>
            <p>Thế nhưng chính trong những ngày tháng khó khăn nhất, họ nhận ra mình có chung một mục tiêu: tạo ra một sản phẩm mà họ có thể tự hào gọi là "đứa con tinh thần" đầu tiên của tuổi trẻ.</p>
            <p>Tên gọi "Dragon Tail" được lựa chọn như một biểu tượng. Nếu rồng là hình ảnh đại diện cho khát vọng vươn cao, thì chiếc đuôi rồng là phần cuối cùng nhưng cũng là phần không bao giờ tách rời khỏi cơ thể. Nó tượng trưng cho sáu thành viên với những xuất phát điểm khác nhau nhưng luôn gắn kết trên cùng một hành trình.</p>
            <p className="text-white/85 font-semibold">Nhưng Dragon Tail vẫn tiếp tục tiến lên.</p>
            <p>Đối với họ, dự án không chỉ là một bài tập tốt nghiệp hay một sản phẩm game. Nó là minh chứng cho tình bạn, sự kiên trì và niềm tin rằng những người trẻ Việt Nam hoàn toàn có thể tạo ra những câu chuyện mang dấu ấn riêng của mình.</p>
            <p>Ngày hôm nay, Dragon Tail không chỉ là tên của một nhóm phát triển game. Đó là biểu tượng của sáu sinh viên đã cùng nhau vượt qua thất bại, áp lực và giới hạn bản thân để biến một ý tưởng nhỏ thành hiện thực.</p>
          </div>
        </section>

        {/* Quote */}
        <blockquote className="rounded-2xl border border-white/10 bg-white/5 px-8 py-7 text-base md:text-lg text-white/65 italic text-center max-w-2xl mx-auto">
          "Sometimes the most meaningful destination is not where we arrive, but the people who walk beside us along the way."
        </blockquote>

      </div>
    </PageFade>
  );
}

/* ════════════════════════════════════════
   CONTACT PAGE
════════════════════════════════════════ */
function ContactPage() {
  const socials = [
    {
      platform: "X (Twitter)", handle: "@dragontails_stu",
      href: "https://x.com/dragontails_stu/status/2061987750522531885",
      description: "Follow us on X for the latest updates, dev logs, and game announcements.",
      accent: "from-white/8 to-white/4", glow: "rgba(255,255,255,0.07)",
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.91-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      ),
    },
    {
      platform: "Facebook", handle: "dragontails.stu",
      href: "https://www.facebook.com/dragontails.stu",
      description: "Join our Facebook community for behind-the-scenes content, team updates, and fan discussions.",
      accent: "from-blue-500/12 to-blue-600/4", glow: "rgba(59,130,246,0.12)",
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      ),
    },
  ];

  return (
    <PageFade id="contact">
      <PageHero eyebrow="Get in Touch" title="Contact Us" subtitle="Follow Dragon Tail Team across our social channels." />

      <motion.section
        className="mb-20 grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.12 }}
      >
        {socials.map((s, i) => (
          <motion.a
            key={s.platform}
            href={s.href}
            target="_blank"
            rel="noopener noreferrer"
            className={`group relative flex flex-col gap-5 rounded-3xl border border-white/12 p-7 bg-gradient-to-br ${s.accent} overflow-hidden`}
            style={{ backdropFilter: "blur(20px)", boxShadow: `0 0 40px ${s.glow}, inset 0 1px 0 rgba(255,255,255,0.08)` }}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.18 + i * 0.1 }}
            whileHover={{ scale: 1.025, y: -4 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="pointer-events-none absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ boxShadow: `inset 0 0 60px ${s.glow}` }} />
            <div className="flex items-start justify-between gap-4">
              <div className="text-white/70 group-hover:text-white transition-colors duration-300">{s.icon}</div>
              <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4 text-white/30 group-hover:text-white/70 transition-colors duration-300 mt-1">
                <path d="M3 13L13 3M13 3H6M13 3V10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.3em] text-white/35 mb-1">{s.platform}</p>
              <p className="text-xl font-semibold text-white mb-3">{s.handle}</p>
              <p className="text-sm text-white/55 leading-relaxed group-hover:text-white/70 transition-colors duration-300">{s.description}</p>
            </div>
            <div className="flex items-center gap-2 text-white/40 group-hover:text-white/70 transition-colors duration-300">
              <span className="text-xs uppercase tracking-widest">Visit</span>
              <svg viewBox="0 0 16 16" fill="none" className="w-3 h-3">
                <path d="M1 8h14M9 2l6 6-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </motion.a>
        ))}
      </motion.section>
      <div className="h-24" />
    </PageFade>
  );
}

/* ════════════════════════════════════════
   VIDEO BACKGROUND
════════════════════════════════════════ */
function VideoBackground() {
  return (
    <>
      {/* Video */}
      <video
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          zIndex: -2,
          filter: "brightness(0.4)",
          pointerEvents: "none",
        }}
        src="./Movie_001.mp4"
        autoPlay
        loop
        muted
        playsInline
      />
      {/* Dark overlay */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          zIndex: -1,
          background: "linear-gradient(to bottom, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.35) 50%, rgba(0,0,0,0.6) 100%)",
          pointerEvents: "none",
        }}
      />
    </>
  );
}

/* ════════════════════════════════════════
   ROOT APP
════════════════════════════════════════ */
export default function App() {
  const [activePage, setActivePage] = useState<Page>("HOME");
  const [navBottom, setNavBottom] = useState(100);
  const navRef = useRef<HTMLElement>(null);

  const navigate = (page: Page) => {
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
    setActivePage(page);
  };

  useLayoutEffect(() => {
    const el = navRef.current;
    if (!el) return;
    const update = () => setNavBottom(el.getBoundingClientRect().bottom + 20);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div className="relative w-full overflow-x-hidden font-sans selection:bg-white/20 selection:text-white">

      {/* ── Video Background ── */}
      <VideoBackground />

      {/* ── Persistent Navbar — always on top, never moves ── */}
      <Navbar activePage={activePage} onNavigate={navigate} navRef={navRef} />

      {/* ── Page Container — padded below navbar ── */}
      <PageContainer topOffset={navBottom}>
        {activePage === "HOME"    && <HomePage key="home" onNavigate={navigate} />}
        {activePage === "ABOUT"   && <AboutPage key="about" />}
        {activePage === "CONTACT" && <ContactPage key="contact" />}
      </PageContainer>
    </div>
  );
}
