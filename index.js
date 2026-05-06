// ═══════════════════════════════════════════════════════════════════════
//  SoulReaper — 分布式调研 + 思维模式蒸馏引擎
// ═══════════════════════════════════════════════════════════════════════

import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { Type } from "typebox";
import { execSync } from "node:child_process";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ─── Utilities ────────────────────────────────────────────────────────

function runScript(query, count, extract) {
  const script = path.join(__dirname, "scripts", "search.sh");
  let cmd = `bash "${script}" "${query}" -n ${count || 10}`;
  if (extract > 0) cmd += ` --extract ${extract}`;
  try {
    const out = execSync(cmd, { encoding: "utf-8", timeout: 30000 });
    return JSON.parse(out);
  } catch (err) {
    return { error: String(err.message || err).slice(0, 500) };
  }
}

function extractUrl(url) {
  const script = path.join(__dirname, "scripts", "search.sh");
  const cmd = `bash "${script}" --extract "${url}"`;
  try {
    const out = execSync(cmd, { encoding: "utf-8", timeout: 30000 });
    return JSON.parse(out);
  } catch (err) {
    return { error: String(err.message || err).slice(0, 500) };
  }
}

function uid() {
  return crypto.randomUUID().slice(0, 8);
}

function jsonResult(data) {
  return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
}

// ─── 6-Dimension Research Framework ───────────────────────────────────

const DIMENSIONS = [
  {
    id: "background",
    label: "背景与生平",
    prompt: `你是一名深度调研专员。请深入研究 "{target}" 的背景信息。
调研方向：
1. 家庭背景、教育经历、早期职业生涯
2. 关键人生转折点
3. 重要事件时间线
4. 所处时代与行业背景

请使用 sr_search 和 sr_extract 工具进行调研。输出格式：每个方向用 ### 标题分隔，包含具体事实、数据和时间节点。`,
  },
  {
    id: "decision",
    label: "核心决策方法",
    prompt: `你是一名决策科学研究员。请深入研究 "{target}" 的决策方法。
调研方向：
1. 做重大决策时的具体思考过程
2. 使用过的分析框架或方法
3. 风险判断与权衡策略
4. 信息收集与处理方式
5. 经典决策案例分析（至少3个）

请使用 sr_search 和 sr_extract 工具进行调研。输出格式：包含具体案例和可验证的决策方法描述。`,
  },
  {
    id: "mental_models",
    label: "思维模型与框架",
    prompt: `你是一名认知科学专家。请深入研究 "{target}" 使用的思维模型和框架。
调研方向：
1. 最常使用的思维模型
2. 独特的分析框架
3. 问题拆解与重构方式
4. 第一性原理或类比推理的运用
5. 跨学科知识的融合方式

请使用 sr_search 和 sr_extract 工具进行调研。输出格式：每个思维模型用 ### 标题分隔。`,
  },
  {
    id: "philosophy",
    label: "独特见解与哲学",
    prompt: `你是一名哲学研究者。请深入研究 "{target}" 的核心理念和哲学思考。
调研方向：
1. 核心价值观和信仰
2. 对行业/世界的独特见解
3. 哲学观点和思想体系
4. 名言警句及其背景
5. 世界观、人生观、方法论

请使用 sr_search 和 sr_extract 工具进行调研。输出格式：包含原始引文出处和解读。`,
  },
  {
    id: "leadership",
    label: "领导力与影响力",
    prompt: `你是一名组织行为学专家。请深入研究 "{target}" 的领导风格和影响力。
调研方向：
1. 领导风格（教练型、愿景型、民主型等）
2. 团队管理与人才培养方法
3. 沟通与说服技巧
4. 冲突处理与危机管理
5. 文化塑造与组织建设

请使用 sr_search 和 sr_extract 工具进行调研。输出格式：包含可观察的领导行为和管理案例。`,
  },
  {
    id: "failures",
    label: "失败与反思",
    prompt: `你是一名经验萃取专家。请深入研究 "{target}" 的失败经历和反思。
调研方向：
1. 重大失败和挫折经历
2. 失败中的关键教训
3. 应对逆境的具体策略
4. 失败后的转型与调整
5. 对失败的态度和哲学

请使用 sr_search 和 sr_extract 工具进行调研。输出格式：每个失败案例包含背景、经过、反思和后续行动。`,
  },
];

function buildPrompts(target) {
  return DIMENSIONS.map((d) => ({
    id: d.id,
    label: d.label,
    text: d.prompt.replace(/\{target\}/g, target),
  }));
}

// ─── Distillation Templates ───────────────────────────────────────────

const DISTILL = {
  "thinking-pattern": {
    label: "思维模式",
    system_prompt: `你是一位认知科学家。请基于下列调研数据，提取目标人物的核心思维模式。

输出格式（JSON）：
{
  "person": "目标人物名",
  "summary": "一句话总结其思维模式特征",
  "core_patterns": [
    {
      "name": "模式名称",
      "principle": "核心原理",
      "how_it_works": "运作方式",
      "example": "应用案例",
      "applicability": "适用场景"
    }
  ],
  "thinking_flow": {
    "description": "典型思考流程",
    "steps": [{ "step": 1, "action": "步骤描述" }]
  },
  "caveats": ["注意事项"],
  "related_models": ["关联思维模型"]
}`,
  },
  "decision-framework": {
    label: "决策框架",
    system_prompt: `你是一位决策科学专家。请基于下列调研数据，提取目标人物的核心决策方法论。

输出格式（JSON）：
{
  "person": "目标人物名",
  "decision_philosophy": "核心决策哲学",
  "frameworks": [
    {
      "name": "框架名称",
      "type": "决策类型（战略/战术/日常）",
      "steps": ["步骤1", "步骤2"],
      "criteria": ["判断标准"],
      "example_case": "应用案例"
    }
  ],
  "decision_biases_awareness": ["已知的认知偏误应对"],
  "tradeoff_approach": "权衡取舍的方式",
  "rapid_decision_method": "快速决策方法（若有）"
}`,
  },
  "mental-model": {
    label: "心智模型",
    system_prompt: `你是一位认知模型构建专家。请基于下列调研数据，提取目标人物使用的心智模型。

输出格式（JSON）：
{
  "person": "目标人物名",
  "primary_models": [
    {
      "name": "模型名称",
      "category": "类别（系统思维/商业/心理/物理等）",
      "description": "模型描述",
      "how_applied": "如何应用",
      "origin": "可能来源",
      "example": "实际应用例"
    }
  ],
  "cross_domain_thinking": {
    "description": "跨学科思维特征",
    "domains_used": ["涉及的领域"]
  },
  "first_principles": ["第一性原理思维的应用"],
  "inversion_thinking": ["逆向思维的案例"],
  "system_map": "整体思维系统的关联描述"
}`,
  },
  "key-insights": {
    label: "关键洞见",
    system_prompt: `你是一位知识管理专家。请基于下列调研数据，提取目标人物的关键洞见。

输出格式（JSON）：
{
  "person": "目标人物名",
  "top_insights": [
    {
      "insight": "洞见内容",
      "context": "提出背景",
      "why_powerful": "为何重要",
      "application": "可应用场景"
    }
  ],
  "quotable_wisdom": [
    { "quote": "原始引文", "meaning": "深层含义", "when_to_use": "适用时机" }
  ],
  "principles": [
    { "principle": "原则", "origin_story": "来源故事", "actionable": "行动指南" }
  ],
  "mental_shortcuts": ["快速判断法则"],
  "blind_spots": ["认知盲区（若有）"]
}`,
  },
  "full-analysis": {
    label: "完整分析",
    system_prompt: `你是一位综合战略分析师。请基于下列所有调研数据，生成完整的人物思维分析。

输出格式（JSON）：
{
  "person": "目标人物名",
  "profile": {
    "field": "领域",
    "era": "活跃时期",
    "archetype": "思维类型（战略家/执行者/创新者等）"
  },
  "thinking_framework": {
    "core_logic": "核心逻辑",
    "mental_models": ["关键思维模型"],
    "decision_process": "决策流程"
  },
  "cognitive_traits": {
    "strengths": ["思维优势"],
    "weaknesses": ["思维局限"],
    "uniqueness": "最独特之处"
  },
  "practical_methods": [
    { "method": "方法名", "how_to_use": "如何使用", "best_for": "最佳适用场景" }
  ],
  "reusable_playbook": {
    "step_by_step": ["可复用步骤"],
    "common_pitfalls": ["常见陷阱"],
    "success_patterns": ["成功模式"]
  },
  "learning_path": {
    "recommended_readings": ["推荐阅读"],
    "key_concepts_to_master": ["需要掌握的概念"],
    "practice_exercises": ["练习方法"]
  }
}`,
  },
};

// ─── Schema Definitions ──────────────────────────────────────────────

const SearchSchema = Type.Object({
  query: Type.String({ description: "搜索查询词" }),
  count: Type.Optional(Type.Number({ description: "返回结果数量 (1-20)", minimum: 1, maximum: 20 })),
  extract: Type.Optional(Type.Number({ description: "提取前N个结果的正文 (0=不提取)", minimum: 0, maximum: 5 })),
});

const ExtractSchema = Type.Object({
  url: Type.String({ description: "要提取正文的网页URL" }),
});

const ResearchSchema = Type.Object({
  target: Type.String({ description: "调研目标（人物/产品/话题）" }),
  dimensions: Type.Optional(Type.Number({ description: "并行Agent数量（默认6）", minimum: 2, maximum: 12 })),
  timeout_seconds: Type.Optional(Type.Number({ description: "每Agent超时（秒，默认120）", minimum: 30, maximum: 600 })),
});

const DistillSchema = Type.Object({
  source_text: Type.String({ description: "要蒸馏的原始调研文本" }),
  target: Type.Optional(Type.String({ description: "目标人物名" })),
  mode: Type.Optional(Type.Union([
    Type.Literal("thinking-pattern"),
    Type.Literal("decision-framework"),
    Type.Literal("mental-model"),
    Type.Literal("key-insights"),
    Type.Literal("full-analysis"),
  ], { description: "蒸馏模式（默认 full-analysis）" })),
});

const AnalyzeSchema = Type.Object({
  target: Type.String({ description: "要分析的目标名称" }),
  dimensions: Type.Optional(Type.Number({ description: "调研维度数量（默认6）", minimum: 1, maximum: 12 })),
  distill_mode: Type.Optional(Type.Union([
    Type.Literal("thinking-pattern"),
    Type.Literal("decision-framework"),
    Type.Literal("mental-model"),
    Type.Literal("key-insights"),
    Type.Literal("full-analysis"),
  ], { description: "蒸馏模式（默认 full-analysis）" })),
});

// ─── Plugin Registration ─────────────────────────────────────────────

export default definePluginEntry({
  id: "soul-reaper",
  name: "SoulReaper",
  description: "分布式并行调研 + 思维模式蒸馏引擎",
  register(api) {
    const { runtime } = api;
    const log = api.logger;

    // ———————————————————————————————————————
    //  1. 搜索引擎
    // ———————————————————————————————————————

    api.registerTool({
      name: "sr_search",
      label: "SoulReaper Search",
      description: "搜索互联网获取信息，支持提取网页正文。用于调研人物、产品、行业、思维模式等。",
      parameters: SearchSchema,
      execute: async (_id, params) =>
        jsonResult(runScript(params.query, params.count || 10, params.extract || 0)),
    });

    // ———————————————————————————————————————
    //  2. 网页提取
    // ———————————————————————————————————————

    api.registerTool({
      name: "sr_extract",
      label: "SoulReaper Extract",
      description: "提取指定URL的网页正文内容，用于深入阅读一篇文章或页面。",
      parameters: ExtractSchema,
      execute: async (_id, params) => jsonResult(extractUrl(params.url)),
    });

    // ———————————————————————————————————————
    //  3. 并行调研
    // ———————————————————————————————————————

    api.registerTool({
      name: "sr_parallel_research",
      label: "SoulReaper Parallel Research",
      description:
        "将调研目标分解为6个维度，并行分配给多个Agent进行研究，聚合结果。",
      parameters: ResearchSchema,
      execute: async (_id, params) => {
        const target = params.target;
        const dimCount = params.dimensions || 6;
        const timeoutSec = params.timeout_seconds || 120;

        log.info(`[soul-reaper] 并行调研: "${target}" (${dimCount} Agent)`);

        const prompts = buildPrompts(target).slice(0, dimCount);
        const tag = `sr-${uid()}`;

        // Spawn all agents in parallel
        const spawns = await Promise.all(
          prompts.map((p) =>
            runtime.subagent.run({
              sessionKey: `${tag}-${p.id}`,
              message: p.text,
              extraSystemPrompt: [
                "你是 SoulReaper 分布式调研系统的一部分。",
                "你的任务是回答分配给你的研究问题。",
                "使用 sr_search 和 sr_extract 工具进行调研。",
                "详细输出研究发现。完成后以 ===DONE=== 结尾。",
              ].join("\n"),
              lightContext: true,
              deliver: false,
            }),
          ),
        );

        log.info(`[soul-reaper] 已启动 ${spawns.length} Agent，等待结果`);

        const waitResults = await Promise.all(
          spawns.map((r) => runtime.subagent.waitForRun({ runId: r.runId, timeoutMs: timeoutSec * 1000 })),
        );

        // Collect results
        const results = [];
        for (let i = 0; i < prompts.length; i++) {
          const sk = `${tag}-${prompts[i].id}`;
          const status = waitResults[i]?.status || "error";
          if (status === "ok") {
            try {
              const msgs = await runtime.subagent.getSessionMessages({ sessionKey: sk });
              const replies = msgs.messages
                .filter((m) => m.role === "assistant")
                .map((m) => m.content)
                .join("\n");
              results.push({ dimension: prompts[i].label, status: "ok", findings: replies });
            } catch (e) {
              results.push({ dimension: prompts[i].label, status: "error", error: String(e).slice(0, 300) });
            }
          } else {
            results.push({ dimension: prompts[i].label, status, error: waitResults[i]?.error || "timeout" });
          }
          try { await runtime.subagent.deleteSession({ sessionKey: sk }); } catch (_) {}
        }

        const ok = results.filter((r) => r.status === "ok").length;
        log.info(`[soul-reaper] 完成: ${ok}/${prompts.length}`);
        return jsonResult({ target, total: prompts.length, success: ok, dimensions: results });
      },
    });

    // ———————————————————————————————————————
    //  4. 蒸馏引擎
    // ———————————————————————————————————————

    api.registerTool({
      name: "sr_distill",
      label: "SoulReaper Distill",
      description:
        "将调研数据蒸馏为结构化的思维模式、决策框架或心智模型。支持5种蒸馏模式。",
      parameters: DistillSchema,
      execute: async (_id, params) => {
        const mode = params.mode || "full-analysis";
        const target = params.target || "未知";
        const tmpl = DISTILL[mode];
        if (!tmpl) return jsonResult({ error: `未知模式: ${mode}` });

        log.info(`[soul-reaper] 蒸馏: "${target}" (${mode})`);

        const sessionId = `sr-distill-${uid()}`;
        const sessionFile = runtime.agent.session.resolveSessionFilePath
          ? runtime.agent.session.resolveSessionFilePath(sessionId)
          : path.join("/tmp", `${sessionId}.jsonl`);
        const workspaceDir = runtime.agent.resolveAgentWorkspaceDir
          ? runtime.agent.resolveAgentWorkspaceDir("default")
          : "/tmp";

        try {
          const result = await runtime.agent.runEmbeddedAgent({
            sessionId,
            sessionFile,
            workspaceDir,
            prompt: [
              tmpl.system_prompt,
              "",
              "=== 调研数据 ===",
              params.source_text,
              "",
              "=== 输出要求 ===",
              "严格按照JSON格式输出，不加代码块标记。数据不足时标注'数据不足'。",
            ].join("\n"),
            timeoutMs: 120_000,
            lightContext: true,
            disableTools: true,
          });

          const raw = (result.content || "").trim().replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "");
          let parsed;
          try { parsed = JSON.parse(raw); } catch (_) { parsed = { raw }; }

          return jsonResult({ target, mode, type: tmpl.label, distilled: parsed });
        } catch (err) {
          return jsonResult({ error: `蒸馏失败: ${String(err).slice(0, 500)}`, target, mode });
        }
      },
    });

    // ———————————————————————————————————————
    //  5. 全流程：调研 → 蒸馏
    // ———————————————————————————————————————

    api.registerTool({
      name: "sr_analyze",
      label: "SoulReaper Full Analysis",
      description:
        "端到端全流程分析：分解目标 → 6 Agent并行调研 → 聚合 → 蒸馏 → 结构化输出。",
      parameters: AnalyzeSchema,
      execute: async (_id, params) => {
        const target = params.target;
        const dimCount = params.dimensions || 6;
        const distillMode = params.distill_mode || "full-analysis";

        log.info(`[soul-reaper] 全流程分析: "${target}"`);

        // ── Phase 1: 并行调研 ──
        const prompts = buildPrompts(target).slice(0, dimCount);
        const tag = `sr-full-${uid()}`;

        const spawns = await Promise.all(
          prompts.map((p) =>
            runtime.subagent.run({
              sessionKey: `${tag}-${p.id}`,
              message: p.text,
              extraSystemPrompt: [
                "你是 SoulReaper 分布式调研系统的一部分。",
                "使用 sr_search 和 sr_extract 进行调研。",
                "详细输出研究发现。完成后以 ===DONE=== 结尾。",
              ].join("\n"),
              lightContext: true,
              deliver: false,
            }),
          ),
        );

        const waitResults = await Promise.all(
          spawns.map((r) => runtime.subagent.waitForRun({ runId: r.runId, timeoutMs: 150_000 })),
        );

        const rawSections = [];
        for (let i = 0; i < prompts.length; i++) {
          const sk = `${tag}-${prompts[i].id}`;
          if (waitResults[i]?.status === "ok") {
            try {
              const msgs = await runtime.subagent.getSessionMessages({ sessionKey: sk });
              const text = msgs.messages
                .filter((m) => m.role === "assistant")
                .map((m) => (typeof m.content === "string" ? m.content : JSON.stringify(m.content)))
                .join("\n\n");
              rawSections.push(`## ${prompts[i].label}\n${text}`);
            } catch (e) {
              rawSections.push(`## ${prompts[i].label}\n(获取失败: ${e})`);
            }
          } else {
            rawSections.push(`## ${prompts[i].label}\n(超时或失败)`);
          }
          try { await runtime.subagent.deleteSession({ sessionKey: sk }); } catch (_) {}
        }

        const researchText = rawSections.join("\n\n---\n\n");
        const successCount = rawSections.filter((r) => !r.includes("失败") && !r.includes("超时")).length;

        // ── Phase 2: 蒸馏 ──
        const tmpl = DISTILL[distillMode];
        let distilled = null;
        let distillError = null;

        if (tmpl) {
          const sessionId = `sr-distill-${uid()}`;
          const sessionFile = runtime.agent.session.resolveSessionFilePath
            ? runtime.agent.session.resolveSessionFilePath(sessionId)
            : path.join("/tmp", `${sessionId}.jsonl`);
          const workspaceDir = runtime.agent.resolveAgentWorkspaceDir
            ? runtime.agent.resolveAgentWorkspaceDir("default")
            : "/tmp";

          try {
            const result = await runtime.agent.runEmbeddedAgent({
              sessionId, sessionFile, workspaceDir,
              prompt: [
                tmpl.system_prompt,
                "",
                "=== 调研数据 ===",
                researchText,
                "",
                "=== 输出要求 ===",
                "严格JSON格式，不加代码块。数据不足标注'数据不足'。",
              ].join("\n"),
              timeoutMs: 120_000,
              lightContext: true,
              disableTools: true,
            });
            const raw = (result.content || "").trim()
              .replace(/^```(?:json)?\s*/, "")
              .replace(/\s*```$/, "");
            try { distilled = JSON.parse(raw); } catch (_) {
              distillError = "JSON解析失败";
              distilled = { raw };
            }
          } catch (err) {
            distillError = `LLM调用失败: ${String(err).slice(0, 300)}`;
          }
        }

        return jsonResult({
          target,
          analysis: { mode: distillMode, type: tmpl?.label },
          research: { agents: prompts.length, success: successCount },
          distilled,
          ...(distillError ? { warning: distillError } : {}),
        });
      },
    });
  },
});
