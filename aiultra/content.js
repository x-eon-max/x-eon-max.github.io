(() => {
  if (window.__G1_ZERO_COST_EXT_LOADED && document.getElementById("g1-zero-cost-floating-panel")) return;
  window.__G1_ZERO_COST_EXT_LOADED = true;

  const PRESETS = window.G1_ZERO_COST_PRESETS || [];
  console.log("[G1-ZC] 预置数量 =", PRESETS.length, "→", PRESETS.map(p => p.badge).join(" | "));
  let activePreset = PRESETS[0] || null;
  let pendingTrigger = false;
  let pollTimer = null;

  function findPreset(presetId) {
    return PRESETS.find((p) => p.id === presetId) || null;
  }

  const CFG = window.G1_ZERO_COST_CFG || { includeYt: true };
  const YT_PREF_KEY = "g1ZcIncludeYt";

  function buildPresetOption(selectEl, preset, selectedId) {
    const opt = document.createElement("option");
    opt.value = preset.id;
    opt.textContent = `[${preset.badge}] ${preset.title}`;
    if (preset.id === selectedId) opt.selected = true;
    selectEl.appendChild(opt);
  }

  function fillPresetSelect(selectEl, selectedId) {
    selectEl.replaceChildren();
    PRESETS.forEach((p) => buildPresetOption(selectEl, p, selectedId));
  }

  function buildQuickButton(preset) {
    const qBtn = el(
      "button",
      "text-align:left;padding:7px 10px;border-radius:8px;border:1px solid rgba(148,163,184,0.28);background:rgba(30,41,59,0.85);color:#e2e8f0;cursor:pointer;font-size:12px;line-height:1.35;"
    );
    qBtn.dataset.presetId = preset.id;

    const topRow = el("div", "display:flex;justify-content:space-between;align-items:center;gap:6px;font-weight:600;color:#93c5fd;");
    topRow.appendChild(el("span", "", preset.title));
    topRow.appendChild(
      el("span", "font-size:10px;padding:1px 6px;border-radius:99px;background:rgba(37,99,235,0.35);color:#bfdbfe;white-space:nowrap;", preset.badge)
    );
    const subRow = el("div", "font-size:11px;color:#94a3b8;margin-top:2px;", preset.subtitle);

    qBtn.appendChild(topRow);
    qBtn.appendChild(subRow);
    qBtn.addEventListener("click", () => {
      triggerOpenCheckout(preset.id);
    });
    return qBtn;
  }

  function fillQuickList(listEl) {
    listEl.replaceChildren();
    PRESETS.forEach((p) => listEl.appendChild(buildQuickButton(p)));
  }

  function refreshPresetUi() {
    const selectEl = document.getElementById("g1-zc-preset-select");
    const quickList = document.getElementById("g1-zc-quick-list");
    const ytChk = document.getElementById("g1-zc-include-yt");
    if (ytChk) ytChk.checked = CFG.includeYt;
    const selectedId = (selectEl && selectEl.value) || (activePreset && activePreset.id) || "";
    if (selectEl) fillPresetSelect(selectEl, selectedId);
    if (quickList) fillQuickList(quickList);
  }

  function setIncludeYt(on, { persist = true, quiet = false } = {}) {
    CFG.includeYt = Boolean(on);
    if (persist) {
      try {
        if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
          chrome.storage.local.set({ [YT_PREF_KEY]: CFG.includeYt });
        }
      } catch (_) {}
    }
    refreshPresetUi();
    if (!quiet) {
      setStatus(
        CFG.includeYt ? "✅ 已改为「Ultra + YouTube 附加项」" : "✅ 已改为「仅 Ultra」，不带 YouTube 附加项",
        true,
        false
      );
    }
  }

  function loadYtPref() {
    try {
      if (typeof chrome === "undefined" || !chrome.storage || !chrome.storage.local) return;
      chrome.storage.local.get([YT_PREF_KEY], (res) => {
        const v = res && res[YT_PREF_KEY];
        if (typeof v === "boolean" && v !== CFG.includeYt) setIncludeYt(v, { persist: false, quiet: true });
      });
      if (chrome.storage.onChanged) {
        chrome.storage.onChanged.addListener((changes) => {
          const ch = changes && changes[YT_PREF_KEY];
          if (ch && typeof ch.newValue === "boolean" && ch.newValue !== CFG.includeYt) {
            setIncludeYt(ch.newValue, { persist: false, quiet: true });
          }
        });
      }
    } catch (_) {}
  }

  function setStatus(text, isSuccess = false, isError = false) {
    const el = document.getElementById("g1-zc-status");
    if (!el) return;
    el.textContent = text;
    el.style.background = isError
      ? "rgba(220, 38, 38, 0.18)"
      : isSuccess
      ? "rgba(16, 185, 129, 0.18)"
      : "rgba(59, 130, 246, 0.15)";
    el.style.borderColor = isError
      ? "rgba(248, 113, 113, 0.45)"
      : isSuccess
      ? "rgba(52, 211, 153, 0.45)"
      : "rgba(96, 165, 250, 0.4)";
    el.style.color = isError ? "#fecaca" : isSuccess ? "#a7f3d0" : "#dbeafe";
  }

  function rewriteEacquireIframe(iframeEl, preset) {
    if (!iframeEl || !preset) return false;
    const items = preset.full_items;
    if (!items) {
      setStatus(
        `⚠️ [${preset.title}] 还缺 ${preset.offerId || "offer"} 的 token —— 先在 HAR 里抓 offer 目录，或跑 Frida 拉 BillingClient`,
        false,
        true
      );
      return false;
    }
    const rawSrc = iframeEl.getAttribute("src") || iframeEl.src || "";
    if (!rawSrc || !rawSrc.includes("/eacquire")) return false;

    try {
      const u = new URL(rawSrc, location.origin);
      const earRaw = u.searchParams.get("ear");
      if (!earRaw) return false;

      const earArr = JSON.parse(earRaw);
      while (earArr.length < 25) {
        earArr.push(null);
      }

      // Keep ear[2][0] = null so Google Play uses the account's active Google Pay profile
      // without triggering IP-vs-country mismatch errors
      if (Array.isArray(earArr[2]) && earArr[2].length >= 1) {
        earArr[2][0] = null;
      }

      earArr[13] = [items];
      earArr[8] = null;
      earArr[24] = null;

      if (u.pathname.endsWith("/eacquire")) {
        u.pathname = u.pathname + "/multiline";
      }
      u.searchParams.set("ear", JSON.stringify(earArr));

      const nextUrl = u.toString();
      if (iframeEl.src !== nextUrl) {
        iframeEl.src = nextUrl;
      }
      iframeEl.dataset.g1PatchedPreset = preset.id;
      pendingTrigger = false;
      setStatus(`✅ 已打开 [${preset.title}]，请核对账单后手动确认订阅`, true, false);
      return true;
    } catch (err) {
      setStatus(`❌ 重写 eacquire 参数异常: ${err.message || err}`, false, true);
      return false;
    }
  }

  function findEacquireIframe() {
    const iframes = Array.from(document.querySelectorAll("iframe"));
    return iframes.find((f) => {
      const s = f.getAttribute("src") || f.src || "";
      return s.includes("/eacquire");
    });
  }

  function getAuthUserPrefix() {
    const m = location.pathname.match(/\/u\/(\d+)/);
    return m ? `/u/${m[1]}` : "";
  }

  function buildPlansUrl() {
    return `https://one.google.com${getAuthUserPrefix()}/plans?hl=zh-CN`;
  }

  function clickNativePlanButton() {
    const primaryRegex = /开始使用|获取优惠|获取折扣|换用此方案|Get started|Get offer|Switch|시작|始める|使ってみる/i;
    const secondaryRegex = /升级|Upgrade|更改|变更|切换|获取加购项|Get add-on|Change/i;
    const downgradeRegex = /降级|Downgrade/i;
    const allBtns = Array.from(document.querySelectorAll("button, a[role='button'], [role='button']")).filter((el) => {
      if (el.closest("#g1-zero-cost-floating-panel")) return false;
      const rect = el.getBoundingClientRect();
      return rect.width >= 20 && rect.height >= 18;
    });
    const inMain = allBtns.filter((el) => !el.closest("nav") && el.getBoundingClientRect().left >= 180);
    const pool = inMain.length > 0 ? inMain : allBtns;

    let candidates = pool.filter((el) => primaryRegex.test((el.innerText || el.textContent || "").trim()));
    if (candidates.length === 0) {
      candidates = pool.filter((el) => secondaryRegex.test((el.innerText || el.textContent || "").trim()));
    }
    if (candidates.length === 0) {
      candidates = pool.filter((el) => downgradeRegex.test((el.innerText || el.textContent || "").trim()));
    }
    if (candidates.length > 0) {
      const target = candidates[candidates.length - 1];
      target.scrollIntoView({ behavior: "smooth", block: "center" });
      target.click();
      return (target.innerText || target.textContent || "").trim();
    }
    return "";
  }

  function clickAgreeDialogIfPresent() {
    const agreeRegex = /^(同意|Agree|I agree)$/i;
    const btns = Array.from(document.querySelectorAll("button, [role='button']")).filter((el) => {
      if (el.closest("#g1-zero-cost-floating-panel")) return false;
      const rect = el.getBoundingClientRect();
      if (rect.width < 15 || rect.height < 15) return false;
      const txt = (el.innerText || el.textContent || "").trim();
      return agreeRegex.test(txt);
    });
    if (btns.length > 0) {
      btns[btns.length - 1].click();
      return true;
    }
    return false;
  }

  function triggerOpenCheckout(presetId) {
    const preset = findPreset(presetId) || activePreset || PRESETS[0];
    if (!preset) return;

    activePreset = preset;

    const selEl = document.getElementById("g1-zc-preset-select");
    if (selEl && selEl.value !== preset.id) {
      selEl.value = preset.id;
    }

    if (!location.hostname.includes("one.google.com") || (!location.pathname.includes("/plans") && !location.pathname.includes("/settings"))) {
      const payload = { presetId: preset.id, ts: Date.now(), includeYt: CFG.includeYt };
      try {
        sessionStorage.setItem("__G1_ZC_PENDING", JSON.stringify(payload));
      } catch (_) {}
      try {
        if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
          chrome.storage.local.set({ g1ZcPending: payload });
        }
      } catch (_) {}
      setStatus("⏳ 正在跳转到 Google One 方案页并自动打开付款弹窗...", false, false);
      location.href = buildPlansUrl();
      return;
    }

    const existingFr = findEacquireIframe();
    if (existingFr) {
      setStatus(`⚡ 检测到已打开弹窗，正在切换为 [${preset.title}]...`, false, false);
      rewriteEacquireIframe(existingFr, preset);
      return;
    }

    pendingTrigger = true;
    setStatus(`⏳ 正在触发原生方案按钮并加载 [${preset.title}] US$0.00 付款弹窗...`, false, false);

    let clickedText = clickNativePlanButton();
    if (!clickedText) {
      setStatus("⏳ 页面仍在渲染方案按钮，正在等待自动点击...", false, false);
    }

    if (pollTimer) clearInterval(pollTimer);
    let ticks = 0;
    pollTimer = setInterval(() => {
      ticks += 1;
      if (!pendingTrigger || ticks > 60) {
        clearInterval(pollTimer);
        pollTimer = null;
        if (pendingTrigger && !findEacquireIframe()) {
          setStatus("⚠️ 未检测到可打开结账窗的方案按钮，可先在页面手动点一次【升级/换用此方案/降级】触发弹窗后再点本按钮", false, true);
          pendingTrigger = false;
        }
        return;
      }
      const agreed = clickAgreeDialogIfPresent();
      const fr = findEacquireIframe();
      if (fr) {
        if (rewriteEacquireIframe(fr, activePreset)) {
          clearInterval(pollTimer);
          pollTimer = null;
        }
      } else if (!agreed && ticks % 6 === 0) {
        clickedText = clickNativePlanButton() || clickedText;
      }
    }, 300);
  }

  const obs = new MutationObserver(() => {
    if (!pendingTrigger || !activePreset) return;
    clickAgreeDialogIfPresent();
    const fr = findEacquireIframe();
    if (fr && fr.dataset.g1PatchedPreset !== activePreset.id) {
      rewriteEacquireIframe(fr, activePreset);
    }
  });
  obs.observe(document.documentElement || document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["src"]
  });

  function fillUsTaxFreeAddress() {
    if (!location.hostname.includes("payments.google.com")) {
      window.open("https://payments.google.com/gp/w/home/settings", "_blank");
      return;
    }
    const inputs = Array.from(document.querySelectorAll("input:not([type='hidden'])")).filter(
      (i) => i.offsetWidth > 0 && i.offsetHeight > 0
    );
    const fillMap = [
      { match: /姓名|Name|持卡人/i, val: "CARD HOLDER" },
      { match: /地址第\s*1\s*行|Address line 1|街道地址|Street address/i, val: "700 Southwest 5th Avenue" },
      { match: /城市|City/i, val: "Portland" },
      { match: /邮编|邮政编码|ZIP|Postal/i, val: "97201" }
    ];
    let filledCount = 0;
    for (const inp of inputs) {
      const label =
        inp.getAttribute("aria-label") ||
        inp.getAttribute("placeholder") ||
        (inp.closest("label") ? inp.closest("label").innerText : "") ||
        "";
      for (const item of fillMap) {
        if (item.match.test(label)) {
          inp.focus();
          inp.value = item.val;
          inp.dispatchEvent(new Event("input", { bubbles: true }));
          inp.dispatchEvent(new Event("change", { bubbles: true }));
          filledCount += 1;
          break;
        }
      }
    }
    setStatus(
      filledCount > 0
        ? `✅ 已自动填入美国俄勒冈免税州地址 (Portland, OR 97201 · 共 ${filledCount} 项)`
        : "ℹ️ 请先在 Google Pay 设置页展开创建美国 (US) 付款资料表单后再点此按钮",
      filledCount > 0,
      false
    );
  }

  function el(tag, cssText, text) {
    const node = document.createElement(tag);
    if (cssText) node.style.cssText = cssText;
    if (text !== undefined && text !== null) node.textContent = text;
    return node;
  }

  function mountFloatingPanel() {
    if (!document.body || document.getElementById("g1-zero-cost-floating-panel")) return;

    const container = el(
      "div",
      [
        "position: fixed",
        "right: 18px",
        "bottom: 18px",
        "z-index: 2147483646",
        "width: 350px",
        "background: linear-gradient(160deg, #0f172a 0%, #1e293b 100%)",
        "color: #f8fafc",
        "border: 1px solid rgba(96, 165, 250, 0.45)",
        "border-radius: 14px",
        "box-shadow: 0 18px 42px rgba(2, 6, 23, 0.65)",
        "font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        "font-size: 13px",
        "overflow: hidden",
        "transition: all 0.2s ease"
      ].join(";")
    );
    container.id = "g1-zero-cost-floating-panel";

    // Header
    const headerEl = el(
      "div",
      [
        "display: flex",
        "align-items: center",
        "justify-content: space-between",
        "padding: 10px 14px",
        "background: rgba(15, 23, 42, 0.9)",
        "border-bottom: 1px solid rgba(148, 163, 184, 0.2)",
        "cursor: pointer",
        "user-select: none"
      ].join(";")
    );
    headerEl.id = "g1-zc-header";

    const titleWrap = el("div", "display:flex;align-items:center;gap:8px;font-weight:700;font-size:13.5px;color:#60a5fa;", "⚡ Google One $0.00 付款助手 v1.2 · banxian 更新版（12个月）");
    const toggleBtn = el("button", "background:transparent;border:none;color:#94a3b8;font-size:15px;cursor:pointer;padding:2px 6px;", "−");
    toggleBtn.id = "g1-zc-toggle-btn";
    toggleBtn.title = "折叠/展开";
    headerEl.appendChild(titleWrap);
    headerEl.appendChild(toggleBtn);
    container.appendChild(headerEl);

    // Body
    const bodyEl = el("div", "padding: 12px 14px; display: flex; flex-direction: column; gap: 10px;");
    bodyEl.id = "g1-zc-body";

    const statusEl = el(
      "div",
      "padding:8px 10px;border-radius:8px;border:1px solid rgba(96,165,250,0.4);background:rgba(59,130,246,0.15);color:#dbeafe;font-size:12px;line-height:1.4;",
      "💡 登录账号后点下方任意方案，直接弹出 US$0.00 付款页面（只打开订单不点订阅）。"
    );
    statusEl.id = "g1-zc-status";
    bodyEl.appendChild(statusEl);

    // Preset selector
    const selWrap = el("div", "display:flex;flex-direction:column;gap:5px;");
    const selLabel = el("label", "font-size:11.5px;color:#cbd5e1;font-weight:600;", "选择 $0.00 方案（1个月 30TB / 20TB）：");
    const selectEl = el(
      "select",
      "width:100%;padding:7px 9px;border-radius:8px;border:1px solid rgba(148,163,184,0.35);background:#0f172a;color:#f8fafc;font-size:12px;"
    );
    selectEl.id = "g1-zc-preset-select";
    fillPresetSelect(selectEl, activePreset && activePreset.id);
    selWrap.appendChild(selLabel);
    selWrap.appendChild(selectEl);
    bodyEl.appendChild(selWrap);

    // YouTube add-on switch
    const ytWrap = el(
      "label",
      "display:flex;align-items:center;gap:8px;font-size:12px;color:#cbd5e1;cursor:pointer;user-select:none;"
    );
    const ytChk = document.createElement("input");
    ytChk.type = "checkbox";
    ytChk.id = "g1-zc-include-yt";
    ytChk.style.cssText = "width:14px;height:14px;margin:0;accent-color:#2563eb;cursor:pointer;";
    ytChk.checked = CFG.includeYt;
    ytChk.addEventListener("change", () => setIncludeYt(ytChk.checked));
    ytWrap.appendChild(ytChk);
    ytWrap.appendChild(document.createTextNode("附带 YouTube Premium (1个月免费)"));
    bodyEl.appendChild(ytWrap);

    // Primary one-click button
    const mainBtn = el(
      "button",
      "width:100%;padding:10px 12px;border-radius:9px;border:none;background:linear-gradient(135deg,#2563eb 0%,#1d4ed8 100%);color:#ffffff;font-weight:700;font-size:13.5px;cursor:pointer;box-shadow:0 4px 14px rgba(37,99,235,0.45);",
      "🚀 一键打开所选 US$0.00 付款页面"
    );
    mainBtn.id = "g1-zc-open-main-btn";
    bodyEl.appendChild(mainBtn);

    // Quick preset buttons
    const quickTitle = el("div", "font-size:11.5px;color:#94a3b8;font-weight:600;margin-top:2px;", "方案一键直达：");
    bodyEl.appendChild(quickTitle);

    const quickList = el("div", "display:flex;flex-direction:column;gap:6px;");
    quickList.id = "g1-zc-quick-list";
    fillQuickList(quickList);
    bodyEl.appendChild(quickList);

    // Footer row: US address helper
    const footerRow = el("div", "display:flex;justify-content:flex-end;align-items:center;margin-top:2px;");
    const usBtn = el(
      "button",
      "width:100%;padding:7px 9px;border-radius:7px;border:1px solid rgba(148,163,184,0.35);background:rgba(51,65,85,0.8);color:#f1f5f9;font-size:11.5px;cursor:pointer;white-space:nowrap;",
      "🇺🇸 美区免税州资料 (OR 97201)"
    );
    usBtn.id = "g1-zc-us-addr-btn";
    usBtn.title = "打开 Google Pay 设置或自动填写美国免税州地址 (OR 97201)";
    usBtn.addEventListener("click", () => fillUsTaxFreeAddress());

    footerRow.appendChild(usBtn);
    bodyEl.appendChild(footerRow);

    container.appendChild(bodyEl);
    document.body.appendChild(container);

    let collapsed = false;
    headerEl.addEventListener("click", () => {
      collapsed = !collapsed;
      bodyEl.style.display = collapsed ? "none" : "flex";
      toggleBtn.textContent = collapsed ? "+" : "−";
      container.style.width = collapsed ? "250px" : "350px";
    });

    selectEl.addEventListener("change", () => {
      const found = PRESETS.find((p) => p.id === selectEl.value);
      if (found) activePreset = found;
    });

    mainBtn.addEventListener("click", () => {
      triggerOpenCheckout(selectEl.value);
    });
  }

  function checkPendingAutoTrigger() {
    const runPendingObj = (data) => {
      if (!data || !data.presetId || Date.now() - (data.ts || 0) >= 60000) return false;
      if (typeof data.includeYt === "boolean") {
        CFG.includeYt = data.includeYt;
        refreshPresetUi();
      }
      setTimeout(() => {
        triggerOpenCheckout(data.presetId);
      }, 800);
      return true;
    };

    try {
      const raw = sessionStorage.getItem("__G1_ZC_PENDING");
      if (raw) {
        sessionStorage.removeItem("__G1_ZC_PENDING");
        const data = JSON.parse(raw);
        if (runPendingObj(data)) return;
      }
    } catch (_) {}

    try {
      if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
        chrome.storage.local.get(["g1ZcPending"], (res) => {
          const data = res && res.g1ZcPending;
          if (data) {
            chrome.storage.local.remove(["g1ZcPending"]);
            runPendingObj(data);
          }
        });
      }
    } catch (_) {}
  }

  if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.onMessage) {
    chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
      if (!msg || !msg.action) return;
      if (msg.action === "OPEN_ZERO_COST_MODAL") {
        if (typeof msg.includeYt === "boolean") {
          CFG.includeYt = msg.includeYt;
        }
        mountFloatingPanel();
        refreshPresetUi();
        triggerOpenCheckout(msg.presetId);
        sendResponse({ ok: true });
      } else if (msg.action === "GET_PAGE_STATUS") {
        sendResponse({
          ok: true,
          url: location.href,
          hasModal: Boolean(findEacquireIframe())
        });
      } else if (msg.action === "FILL_US_ADDRESS") {
        fillUsTaxFreeAddress();
        sendResponse({ ok: true });
      }
      return true;
    });
  }

  loadYtPref();

  window.__G1OpenZeroCostModal = triggerOpenCheckout;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      mountFloatingPanel();
      checkPendingAutoTrigger();
    });
  } else {
    mountFloatingPanel();
    checkPendingAutoTrigger();
  }
})();

