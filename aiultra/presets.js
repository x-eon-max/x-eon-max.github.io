(() => {
  const SUB_PREFIX = "subs:com.google.android.apps.subscriptions.red:";
  const YT_SKU = "g1.youtube_premium_individual_add_on";

  // ===== offer token（2026-11-17 从 BillingClient 实测抓取，账号 zhoubanxian68@gmail.com）=====
  const TOKENS = {
    // Google AI Ultra 5x / 20TB —— offer eft-12month（12 个月免费）
    TOK_PLAY_20TB_12M:
      "AYrTWi65Jbm3KRubLXLLA3Re29zKibSnRbvAJEPfxEIVs/d57w8vEhsU7hSkSAfGyjZH8B7/5aj5UTlidbsEwUH8aPN2RTA6pKiltA==",
    // Google AI Ultra 5x / 20TB —— offer eft-1month
    TOK_PLAY_20TB_1M:
      "AYrTWi5QWD5gc0ZxMJHAAUvXbYRFJgI6w5vnF9PKIFg1DFQML36iijrmN5Vum7u9ty2JnHvt9JFLgsfGKwScJcfZaKttqn0hSX4Fnpdn9No=",
    // Google AI Ultra 20x / 30TB —— offer eft-1mo（20x 无 12 个月档，只保留 1 个月）
    TOK_PLAY_AI_PRO_1MO:
      "AYrTWi7nBQ2Zn0z4s+QJOwg9kQRwH3+z+HXpzRqw9IIU4/C48vPvjH32Bub8SHrWq3YX+yI4g1wJgviYiLCobJNqc9DqRd9WZnDdaQ==",
    // YouTube Premium 附加项（1 个月免费，老 token）
    YT_FREE_TOK:
      "AVbCH/eW4Nfp8KBl0zlm7x9PhaiCvpnqwUuL2D8NFPBQgmM9+HuYS1h2xH5lLWU/BsBj775LK5GqK8UHKqoSzhDDz+PqP3paNesqLU0r9i6XCrYa"
  };

  const CFG = {
    includeYt: true
  };

  function makeItem(skuShort, token) {
    return [[`${SUB_PREFIX}${skuShort}`, 21], null, null, null, 1, [token]];
  }

  function makePreset(spec) {
    const preset = { id: spec.id, badge: spec.badge, sku: spec.sku, offerId: spec.offerId || null };

    Object.defineProperty(preset, "title", {
      get: () => `${spec.planTitle}${CFG.includeYt ? " + YouTube (1个月免费)" : ""}`
    });
    Object.defineProperty(preset, "subtitle", {
      get: () => (CFG.includeYt ? spec.ytSubtitle : spec.planSubtitle)
    });
    Object.defineProperty(preset, "ready", {
      get: () => true
    });
    Object.defineProperty(preset, "full_items", {
      get: () => {
        const items = [makeItem(spec.sku, spec.token())];
        if (CFG.includeYt) items.push(makeItem(YT_SKU, TOKENS.YT_FREE_TOK));
        return items;
      }
    });

    return preset;
  }

  // 全部方案都带 YouTube Premium 附加项
  const PRESETS = [
    makePreset({
      id: "ultra20tb_12m_withyt",
      badge: "12个月 · 20TB",
      planTitle: "Ultra 5x 20TB (12个月免费)",
      planSubtitle: "今天 US$0.00 · 12 个月 Ultra 5x",
      ytSubtitle: "今天 US$0.00 · 12 个月 Ultra 5x + YouTube 1 个月",
      sku: "g1.play.20tb",
      offerId: "eft-12month",
      token: () => TOKENS.TOK_PLAY_20TB_12M
    }),
    makePreset({
      id: "ultra20tb_1m_yt",
      badge: "1个月 · 20TB",
      planTitle: "Ultra 20TB (1个月免费)",
      planSubtitle: "今天 US$0.00 · 1 个月 Ultra 20TB",
      ytSubtitle: "今天 US$0.00 · 1 个月 Ultra 20TB + YouTube",
      sku: "g1.play.20tb",
      offerId: "eft-1month",
      token: () => TOKENS.TOK_PLAY_20TB_1M
    }),
    makePreset({
      id: "ultra30tb_1m_yt",
      badge: "1个月 · 30TB",
      planTitle: "Ultra 30TB (1个月免费)",
      planSubtitle: "今天 US$0.00 · 1 个月 Ultra 30TB",
      ytSubtitle: "今天 US$0.00 · 1 个月 Ultra 30TB + YouTube",
      sku: "g1.play.ai.pro",
      offerId: "eft-1mo",
      token: () => TOKENS.TOK_PLAY_AI_PRO_1MO
    })
  ];

  window.G1_ZERO_COST_PRESETS = PRESETS;
  window.G1_ZERO_COST_TOKENS = TOKENS;
  window.G1_ZERO_COST_CFG = CFG;
})();
