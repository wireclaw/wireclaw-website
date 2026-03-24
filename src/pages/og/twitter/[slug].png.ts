import type { APIContext, InferGetStaticPropsType } from "astro";
import { getCollection } from "astro:content";
import satori from "satori";
import sharp from "sharp";
import { html } from "satori-html";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const seriesLabels: Record<string, string> = {
  "build-this": "Build This",
  "under-the-hood": "Under the Hood",
  "agent-patterns": "Agent Patterns",
  versus: "Versus",
  toolbox: "Toolbox",
  "ship-log": "Ship Log",
};

const fontsDir = join(process.cwd(), "src/assets/fonts");
const jetBrainsMono = readFileSync(join(fontsDir, "JetBrainsMono-Bold.ttf"));
const dmSans = readFileSync(join(fontsDir, "DMSans-Regular.ttf"));

export async function getStaticPaths() {
  const posts = await getCollection("blog", ({ data }) => !data.draft);
  return posts.map((post) => ({
    params: { slug: post.id },
    props: { post },
  }));
}

type Props = InferGetStaticPropsType<typeof getStaticPaths>;

export async function GET({ props }: APIContext) {
  const { post } = props as Props;
  const seriesBadge = post.data.series
    ? seriesLabels[post.data.series] || ""
    : "";

  // Twitter card: 1200x675 (slightly different from OG 1200x630)
  const markup = html`<div
    style="display: flex; flex-direction: column; justify-content: space-between; width: 1200px; height: 675px; background: #020617; padding: 60px; font-family: 'DM Sans';"
  >
    <!-- Grid -->
    <div
      style="display: flex; position: absolute; top: 0; left: 0; right: 0; bottom: 0; background-image: linear-gradient(rgba(59,130,246,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.03) 1px, transparent 1px); background-size: 40px 40px;"
    ></div>

    <!-- Glow -->
    <div
      style="display: flex; position: absolute; top: -80px; right: -80px; width: 500px; height: 500px; background: radial-gradient(circle, rgba(59,130,246,0.15), transparent 70%); border-radius: 9999px;"
    ></div>

    <!-- Top: badge -->
    <div style="display: flex; align-items: center; gap: 16px;">
      ${seriesBadge
        ? `<div style="display: flex; font-family: 'JetBrains Mono'; font-size: 14px; color: #A78BFA; background: rgba(139,92,246,0.1); border: 1px solid rgba(139,92,246,0.2); border-radius: 9999px; padding: 6px 16px;">
            ${seriesBadge}
          </div>`
        : ""}
      <div
        style="display: flex; font-family: 'JetBrains Mono'; font-size: 14px; color: #64748B;"
      >
        wireclaw.ai/blog
      </div>
    </div>

    <!-- Center: title -->
    <div style="display: flex; flex-direction: column; gap: 20px;">
      <div
        style="display: flex; font-family: 'JetBrains Mono'; font-size: 44px; font-weight: 700; color: #F1F5F9; line-height: 1.2; max-width: 900px;"
      >
        ${post.data.title}
      </div>
      <div
        style="display: flex; font-size: 20px; color: #94A3B8; line-height: 1.5; max-width: 800px;"
      >
        ${post.data.description}
      </div>
    </div>

    <!-- Bottom: branding -->
    <div
      style="display: flex; align-items: center; gap: 12px; font-family: 'JetBrains Mono'; font-size: 18px; font-weight: 700; color: #3B82F6;"
    >
      <div
        style="display: flex; width: 10px; height: 10px; background: #3B82F6; border-radius: 9999px; box-shadow: 0 0 12px rgba(59,130,246,0.5);"
      ></div>
      Wireclaw
    </div>
  </div>`;

  const svg = await satori(markup, {
    width: 1200,
    height: 675,
    fonts: [
      { name: "JetBrains Mono", data: jetBrainsMono, weight: 700, style: "normal" as const },
      { name: "DM Sans", data: dmSans, weight: 400, style: "normal" as const },
    ],
  });

  const png = await sharp(Buffer.from(svg)).png().toBuffer();
  return new Response(png, { headers: { "Content-Type": "image/png" } });
}
