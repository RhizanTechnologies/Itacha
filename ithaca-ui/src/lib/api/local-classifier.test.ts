import { describe, expect, it } from "vitest";
import {
  cleanCitationSentence,
  extractClaimSentence,
  analyzeStance,
  classifyCitationLocally,
  classifyBatchLocally,
  buildLocalMoatProvenance,
  LOCAL_CLASSIFIER_VERSION,
  LOCAL_PROVIDER_NAME,
} from "./local-classifier";
import type { ClassificationInput } from "./citation-classifier";

describe("local-classifier unit tests", () => {
  describe("TC-LOC-01: cleanCitationSentence and claim extraction", () => {
    it("strips bracket citations like [1], [12, 13], [1-3]", () => {
      const raw =
        "As demonstrated by previous work [1, 2], the model converges [14-16].";
      const cleaned = cleanCitationSentence(raw);
      expect(cleaned).toBe(
        "As demonstrated by previous work , the model converges .",
      );
    });

    it("strips parenthetical citations like (Smith et al., 2020)", () => {
      const raw =
        "Our results confirm prior findings (Smith et al., 2020; Johnson, 2019) in full.";
      const cleaned = cleanCitationSentence(raw);
      expect(cleaned).toBe("Our results confirm prior findings in full.");
    });

    it("extracts most salient claim from multiple context sentences", () => {
      const contexts = [
        "We rely on standard dataset formatting.",
        "Crucially, our experiments replicate Smith et al. and confirm their core finding.",
        "Future work will explore broader domains.",
      ];
      const result = extractClaimSentence(contexts);
      expect(result.isDirectContext).toBe(true);
      expect(result.claimText).toContain("confirm their core finding");
    });
  });

  describe("TC-LOC-02: Support / Confirmation Stance", () => {
    it("classifies explicit replication and confirmation as supports with high confidence", () => {
      const analysis = analyzeStance(
        "Our randomized clinical trial results replicate Smith et al. and confirm their finding.",
        "Clinical Replication Trial",
        "We observe the same protective effect.",
        ["ResultComparison"],
      );
      expect(analysis.stance).toBe("supports");
      expect(analysis.confidence).toBeGreaterThanOrEqual(0.8);
      expect(
        analysis.matchedSignals.some(
          (s) => s.includes("supports") || s.includes("confirm"),
        ),
      ).toBe(true);
    });
  });

  describe("TC-LOC-03: Contradiction / Dispute Stance", () => {
    it("classifies explicit refutation and contradiction as contradicts", () => {
      const analysis = analyzeStance(
        "Our knockout experiments contradict the claim that protein X drives the phenotype, refuting earlier results.",
        "Mechanism Rebuttal",
        "We find no causal role.",
        ["ResultComparison"],
      );
      expect(analysis.stance).toBe("contradicts");
      expect(analysis.confidence).toBeGreaterThanOrEqual(0.8);
      expect(
        analysis.matchedSignals.some(
          (s) => s.includes("contradicts") || s.includes("refut"),
        ),
      ).toBe(true);
    });
  });

  describe("TC-LOC-04: Negation Resolution Guard", () => {
    it("correctly flips negated support ('does not support') to contradicts", () => {
      const analysis = analyzeStance(
        "Our comprehensive replication does not support the hypothesis proposed by the authors.",
        "Follow-up Evaluation",
        "Replication yields null effect.",
        ["ResultComparison"],
      );
      expect(analysis.stance).toBe("contradicts");
      expect(
        analysis.matchedSignals.some((s) => s.startsWith("negated_support")),
      ).toBe(true);
    });

    it("handles 'no evidence for' as contradiction", () => {
      const analysis = analyzeStance(
        "Unlike Johnson et al., we find no evidence for a treatment benefit in this cohort.",
        "Negative Cohort Trial",
        "No evidence observed.",
        ["ResultComparison"],
      );
      expect(analysis.stance).toBe("contradicts");
      expect(analysis.confidence).toBeGreaterThanOrEqual(0.75);
    });
  });

  describe("TC-LOC-05: Methodological Extension", () => {
    it("classifies domain adaptation and framework scaling as extends", () => {
      const analysis = analyzeStance(
        "We extend the segmentation framework of Clark et al. to pediatric imaging datasets.",
        "Pediatric Image Segmentation",
        "We generalize adult models to pediatric cohorts.",
        ["Methodology"],
      );
      expect(analysis.stance).toBe("extends");
      expect(analysis.confidence).toBeGreaterThanOrEqual(0.75);
      expect(analysis.matchedSignals.some((s) => s.includes("extends"))).toBe(
        true,
      );
    });
  });

  describe("TC-LOC-06: Neutral Background Citation", () => {
    it("classifies routine background citation as cites", () => {
      const analysis = analyzeStance(
        "For a broader review of graph layouts, see Smith et al.",
        "Graph Visualization Overview",
        "General review paper.",
        ["Background"],
      );
      expect(analysis.stance).toBe("cites");
      expect(analysis.confidence).toBeGreaterThanOrEqual(0.7);
    });
  });

  describe("TC-LOC-07: Latency Budget & Batch Classification", () => {
    it("classifies a citation locally with provider 'ithaca-local-moat' and version 8", () => {
      const input: ClassificationInput = {
        citingId: "W100",
        citedId: "W200",
        citingTitle: "Replication Study",
        citingAbstract: "We reproduce the original effect.",
        citedTitle: "Original Landmark Discovery",
        citedAbstract: "Discovery paper.",
        citationContexts: [
          "Our results corroborate the findings of the original discovery.",
        ],
        s2Intents: ["ResultComparison"],
      };

      const result = classifyCitationLocally(input);
      expect(result.citingId).toBe("W100");
      expect(result.citedId).toBe("W200");
      expect(result.edgeType).toBe("supports");
      expect(result.provider).toBe(LOCAL_PROVIDER_NAME);
      expect(result.classifierVersion).toBe(LOCAL_CLASSIFIER_VERSION);
    });

    it("satisfies the sub-15ms performance budget across 100 consecutive classifications", () => {
      const sampleInputs: ClassificationInput[] = Array.from(
        { length: 100 },
        (_, i) => ({
          citingId: `W-C-${i}`,
          citedId: `W-D-${i}`,
          citingTitle: `Paper ${i}: Empirical Evaluation`,
          citingAbstract: `Abstract for paper ${i} evaluating foundational methods.`,
          citedTitle: `Base Paper ${i}`,
          citedAbstract: `Base abstract ${i}.`,
          citationContexts: [
            i % 3 === 0
              ? "We confirm the empirical claim reported in the cited trial."
              : i % 3 === 1
                ? "We find no evidence for the effect, refuting previous conclusions."
                : "We extend the framework of the cited study to a new domain.",
          ],
          s2Intents: ["ResultComparison"],
        }),
      );

      const start = performance.now();
      const results = classifyBatchLocally(sampleInputs);
      const totalElapsedMs = performance.now() - start;
      const averageMs = totalElapsedMs / sampleInputs.length;

      expect(results.length).toBe(100);
      // Each classification must run well under 15ms (typically < 1ms on CPU)
      expect(averageMs).toBeLessThan(15);
      console.log(
        `[TC-LOC-07] 100 local classifications completed in ${totalElapsedMs.toFixed(2)}ms (avg: ${averageMs.toFixed(3)}ms/pair)`,
      );
    });
  });

  describe("AiProvenance Generation", () => {
    it("builds compliant AI provenance for local moat engine", () => {
      const prov = buildLocalMoatProvenance(
        "W-SRC",
        "W-TGT",
        "Authors confirm cited finding.",
        0.88,
      );
      expect(prov.provider).toBe(LOCAL_PROVIDER_NAME);
      expect(prov.model).toBe("sovereign-intent-v1");
      expect(prov.confidence).toBe(0.88);
      expect(prov.sourceIds).toEqual(["W-SRC", "W-TGT"]);
      expect(prov.humanReviewed).toBe(false);
      expect(prov.classifierVersion).toBe(LOCAL_CLASSIFIER_VERSION);
    });
  });
});
