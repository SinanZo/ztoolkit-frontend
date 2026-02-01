import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import useSubscription from "../hooks/useSubscription";
import {
  Search,
  SlidersHorizontal,
  Sparkles,
  Lock,
  ArrowRight,
  FileText,
  ShieldCheck,
  QrCode,
  Code2,
  Image,
  Wand2,
  Zap,
  Tag,
} from "lucide-react";

import { tools as staticTools } from "../data/tools";

const CATEGORY_META = {
  "File Converters": { icon: FileText },
  "PDF Tools": { icon: ShieldCheck },
  "Generators": { icon: QrCode },
  "Developer Tools": { icon: Code2 },
  "Image Tools": { icon: Image },
  "Automation": { icon: Zap },
  "AI Tools": { icon: Wand2 },
};

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

function Badge({ children, tone = "neutral" }) {
  const toneClass =
    tone === "pro"
      ? "bg-primary/10 text-primary border-primary/20"
      : tone === "free"
      ? "bg-grey-light text-black border-grey-light"
      : tone === "new"
      ? "bg-black/5 text-black border-black/10"
      : tone === "popular"
      ? "bg-primary/10 text-primary border-primary/20"
      : "bg-black/5 text-black border-black/10";

  return (
    <span
      className={cx(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold",
        toneClass
      )}
    >
      {children}
    </span>
  );
}

function Pill({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        "inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold transition",
        "border",
        active
          ? "bg-black text-white border-black"
          : "bg-white text-black border-black/10 hover:border-black/20 hover:bg-offwhite-light"
      )}
    >
      {children}
    </button>
  );
}

export default function ToolsGallery({
  tools = staticTools,
  title = "Explore Tools",
  subtitle = "Fast, clean utilities for files, images, dev work, and daily tasks.",
  showHeader = true,
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [planFilter, setPlanFilter] = useState("All"); // All | Free | Pro
  const [sortBy, setSortBy] = useState("Popular"); // Popular | Newest | A-Z

  const { loading: subLoading, isPro: userIsPro } = useSubscription();

  const categories = useMemo(() => {
    const set = new Set(tools.map((t) => t.category).filter(Boolean));
    return ["All", ...Array.from(set).sort()];
  }, [tools]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    let list = tools.slice();

    if (category !== "All") list = list.filter((t) => t.category === category);

    if (planFilter === "Free") list = list.filter((t) => !t.pro);
    if (planFilter === "Pro") list = list.filter((t) => t.pro);

    if (q) {
      list = list.filter((t) => {
        const hay = `${t.name} ${t.description} ${t.category}`.toLowerCase();
        return hay.includes(q);
      });
    }

    // Sorting
    if (sortBy === "A-Z") {
      list.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === "Newest") {
      // if you later add createdAt, we’ll use it; for now favor "new" badge
      list.sort((a, b) => {
        const aNew = (a.badges || []).includes("new") ? 1 : 0;
        const bNew = (b.badges || []).includes("new") ? 1 : 0;
        return bNew - aNew;
      });
    } else {
      // Popular first
      list.sort((a, b) => {
        const aPop = (a.badges || []).includes("popular") ? 1 : 0;
        const bPop = (b.badges || []).includes("popular") ? 1 : 0;
        if (bPop !== aPop) return bPop - aPop;
        // then free before pro (helps onboarding)
        if (a.pro !== b.pro) return a.pro ? 1 : -1;
        return a.name.localeCompare(b.name);
      });
    }

    return list;
  }, [tools, query, category, planFilter, sortBy]);

  return (
    <section className="w-full bg-offwhite py-12">
      <div className="mx-auto max-w-7xl px-4">
        {showHeader && (
          <div className="mb-8 flex flex-col gap-3">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-black/10 bg-white px-4 py-2 shadow-sm">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-black">
                Premium Tool Library
              </span>
            </div>

            <h2 className="text-3xl font-extrabold tracking-tight text-black">
              {title}
            </h2>
            <p className="max-w-2xl text-base font-medium text-grey">
              {subtitle}
            </p>
          </div>
        )}

        {/* Controls */}
        <div className="mb-8 grid grid-cols-1 gap-3 md:grid-cols-12">
          {/* Search */}
          <div className="md:col-span-6">
            <div className="flex items-center gap-2 rounded-2xl border border-black/10 bg-white px-3 py-3 shadow-sm focus-within:border-black/20">
              <Search className="h-5 w-5 text-grey" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search tools (PDF, QR, JSON, image...)"
                className="w-full bg-transparent text-sm font-semibold text-black outline-none placeholder:text-grey"
              />
              {query?.length > 0 && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="rounded-xl px-3 py-1 text-xs font-bold text-grey hover:bg-grey-light"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Plan filter */}
          <div className="md:col-span-4">
            <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-black/10 bg-white px-3 py-2 shadow-sm">
              <Tag className="h-5 w-5 text-grey" />
              <Pill active={planFilter === "All"} onClick={() => setPlanFilter("All")}>All</Pill>
              <Pill active={planFilter === "Free"} onClick={() => setPlanFilter("Free")}>Free</Pill>
              <Pill active={planFilter === "Pro"} onClick={() => setPlanFilter("Pro")}>Pro</Pill>
            </div>
          </div>

          {/* Sort */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 rounded-2xl border border-black/10 bg-white px-3 py-3 shadow-sm">
              <SlidersHorizontal className="h-5 w-5 text-grey" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full bg-transparent text-sm font-bold text-black outline-none"
              >
                <option>Popular</option>
                <option>Newest</option>
                <option>A-Z</option>
              </select>
            </div>
          </div>
        </div>

        {/* Category chips */}
        <div className="mb-8 flex flex-wrap gap-2">
          {categories.map((c) => (
            <Pill key={c} active={category === c} onClick={() => setCategory(c)}>
              {c}
            </Pill>
          ))}
        </div>

        {/* Grid */}
        {filtered.length === 0 ? (
          <div className="rounded-3xl border border-black/10 bg-white p-10 text-center shadow-soft">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-grey-light">
              <Search className="h-6 w-6 text-grey" />
            </div>
            <h3 className="text-lg font-extrabold text-black">No tools found</h3>
            <p className="mt-1 text-sm font-semibold text-grey">
              Try removing filters or searching with a different keyword.
            </p>

            <div className="mt-6 flex flex-wrap justify-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setCategory("All");
                  setPlanFilter("All");
                  setSortBy("Popular");
                }}
                className="rounded-2xl bg-black px-5 py-2.5 text-sm font-extrabold text-white hover:opacity-90"
              >
                Reset Filters
              </button>
              <Link
                to="/pricing"
                className="rounded-2xl bg-primary px-5 py-2.5 text-sm font-extrabold text-white hover:bg-primary-accent"
              >
                See Pro Plans
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((tool) => {
              const Icon = (CATEGORY_META?.[tool.category]?.icon) || Sparkles;
              const isPro = !!tool.pro;
              const badges = tool.badges || [];
              // If the tool is pro-only and the current user does not have a pro subscription,
              // treat it as locked for the UI.
              const isLockedForUser = isPro && !subLoading && !userIsPro;

              return (
                <div
                  key={tool.slug}
                  className={cx(
                    "group relative overflow-hidden rounded-3xl border bg-white p-5 shadow-soft transition",
                    "border-black/10 hover:border-black/20"
                  )}
                >
                  {/* Top row */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={cx(
                          "flex h-12 w-12 items-center justify-center rounded-2xl border",
                          isPro
                            ? "border-primary/20 bg-primary/10"
                            : "border-black/10 bg-grey-light"
                        )}
                      >
                        <Icon
                          className={cx(
                            "h-6 w-6",
                            isPro ? "text-primary" : "text-black"
                          )}
                        />
                      </div>

                      <div className="min-w-0">
                        <h3 className="truncate text-base font-extrabold text-black">
                          {tool.name}
                        </h3>
                        <p className="truncate text-xs font-semibold text-grey">
                          {tool.category || "Tool"}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 justify-end">
                      {isPro ? (
                        <Badge tone="pro">
                          <Lock className="h-3.5 w-3.5" />
                          PRO
                        </Badge>
                      ) : (
                        <Badge tone="free">FREE</Badge>
                      )}

                      {badges.includes("new") && <Badge tone="new">NEW</Badge>}
                      {badges.includes("popular") && (
                        <Badge tone="popular">POPULAR</Badge>
                      )}
                    </div>
                  </div>

                  {/* Description */}
                  <p className="mt-4 line-clamp-2 text-sm font-semibold text-grey">
                    {tool.description}
                  </p>

                  {/* Divider */}
                  <div className="mt-5 h-px w-full bg-grey-light" />

                  {/* Actions */}
                  <div className="mt-4 flex items-center justify-between gap-3">
                    {(!isPro || !isLockedForUser) ? (
                      <Link
                        to={`/tools/${tool.slug}`}
                        className="inline-flex items-center gap-2 rounded-2xl bg-black px-4 py-2.5 text-sm font-extrabold text-white transition hover:opacity-90"
                      >
                        Open Tool <ArrowRight className="h-4 w-4" />
                      </Link>
                    ) : (
                      <div className="inline-flex items-center gap-2 rounded-2xl bg-grey-light px-4 py-2.5 text-sm font-extrabold text-grey cursor-not-allowed">
                        Locked <Lock className="h-4 w-4" />
                      </div>
                    )}

                    {isPro ? (
                      <Link
                        to="/pricing"
                        className="inline-flex items-center gap-2 rounded-2xl bg-primary px-4 py-2.5 text-sm font-extrabold text-white transition hover:bg-primary-accent"
                      >
                        Upgrade <Zap className="h-4 w-4" />
                      </Link>
                    ) : (
                      <Link
                        to="/pricing"
                        className="text-sm font-extrabold text-primary hover:text-primary-accent"
                      >
                        Go Pro →
                      </Link>
                    )}
                  </div>

                  {/* Subtle hover accent */}
                  <div className="pointer-events-none absolute inset-0 opacity-0 transition group-hover:opacity-100">
                    <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-primary/10 blur-2xl" />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer hint */}
        <div className="mt-10 flex flex-col items-start justify-between gap-3 rounded-3xl border border-black/10 bg-white p-6 shadow-soft md:flex-row md:items-center">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-offwhite-light border border-black/10">
              <ShieldCheck className="h-5 w-5 text-black" />
            </div>
            <div>
              <p className="text-sm font-extrabold text-black">
                Built for speed & privacy
              </p>
              <p className="text-sm font-semibold text-grey">
                Simple tools, clean UI, and premium upgrades when you need more.
              </p>
            </div>
          </div>

          <Link
            to="/pricing"
            className="inline-flex items-center gap-2 rounded-2xl bg-primary px-5 py-2.5 text-sm font-extrabold text-white hover:bg-primary-accent"
          >
            View Pricing <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
