(() => {
  const PRESETS = window.G1_ZERO_COST_PRESETS || [];
  const CFG = window.G1_ZERO_COST_CFG || { includeYt: true };
  const YT_PREF_KEY = "g1ZcIncludeYt";
  const container = document.getElementById("preset-container");
  const statusEl = document.getElementById("popup-status");
  const usBtn = document.getElementById("popup-us-btn");
  const ytChk = document.getElementById("popup-include-yt");

  function setPopupStatus(text, isOk = false) {
    statusEl.textContent = text;
    if (isOk) {
      statusEl.style.background = "rgba(16, 185, 129, 0.2)";
      statusEl.style.borderColor = "rgba(52, 211, 153, 0.45)";
      statusEl.style.color = "#a7f3d0";
    }
  }

  function triggerPresetFromPopup(presetId) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs && tabs[0];
      if (!tab || !tab.id) return;
      const url = tab.url || "";
      const uMatch = url.match(/\/u\/(\d+)/);
      const uPrefix = uMatch ? `/u/${uMatch[1]}` : "";
      const targetPlansUrl = `https://one.google.com${uPrefix}/plans?hl=zh-CN`;

      if (url.includes("one.google.com/plans") || (url.includes("one.google.com/u/") && url.includes("/plans"))) {
        chrome.tabs.sendMessage(
          tab.id,
          { action: "OPEN_ZERO_COST_MODAL", presetId, includeYt: CFG.includeYt },
          (resp) => {
            if (chrome.runtime.lastError || !resp) {
              chrome.storage.local.set(
                { g1ZcPending: { presetId, ts: Date.now(), includeYt: CFG.includeYt } },
                () => {
                  chrome.tabs.update(tab.id, { url: targetPlansUrl });
                  window.close();
                }
              );
              return;
            }
            setPopupStatus("✅ 已在当前标签页触发打开 US$0.00 付款弹窗！", true);
            setTimeout(() => window.close(), 650);
          }
        );
      } else {
        chrome.storage.local.set(
          { g1ZcPending: { presetId, ts: Date.now(), includeYt: CFG.includeYt } },
          () => {
            chrome.tabs.update(tab.id, { url: targetPlansUrl });
            setPopupStatus("⏳ 正在跳转至 Google One 方案页并自动打开付款弹窗...", true);
            setTimeout(() => window.close(), 500);
          }
        );
      }
    });
  }

  function renderPresetList() {
    container.replaceChildren();
    PRESETS.forEach((p) => {
      const btn = document.createElement("button");
      btn.className = "preset-btn";

      const topDiv = document.createElement("div");
      topDiv.className = "preset-top";
      const titleSpan = document.createElement("span");
      titleSpan.textContent = p.title;
      const tagSpan = document.createElement("span");
      tagSpan.className = "preset-tag";
      tagSpan.textContent = p.badge;
      topDiv.appendChild(titleSpan);
      topDiv.appendChild(tagSpan);

      const subDiv = document.createElement("div");
      subDiv.className = "preset-sub";
      subDiv.textContent = p.subtitle;

      btn.appendChild(topDiv);
      btn.appendChild(subDiv);
      btn.addEventListener("click", () => triggerPresetFromPopup(p.id));
      container.appendChild(btn);
    });
  }

  function applyYtPref(on) {
    CFG.includeYt = Boolean(on);
    if (ytChk) ytChk.checked = CFG.includeYt;
    renderPresetList();
  }

  if (ytChk) {
    ytChk.addEventListener("change", () => {
      applyYtPref(ytChk.checked);
      chrome.storage.local.set({ [YT_PREF_KEY]: CFG.includeYt });
      setPopupStatus(
        CFG.includeYt ? "✅ 已改为「Ultra + YouTube 附加项」" : "✅ 已改为「仅 Ultra」，不带附加项",
        true
      );
    });
  }

  chrome.storage.local.get([YT_PREF_KEY], (res) => {
    applyYtPref(!(res && res[YT_PREF_KEY] === false));
  });

  usBtn.addEventListener("click", () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs && tabs[0];
      if (tab && tab.id && (tab.url || "").includes("payments.google.com")) {
        chrome.tabs.sendMessage(tab.id, { action: "FILL_US_ADDRESS" });
        setPopupStatus("✅ 已在 Google Pay 页面触发填写美国免税州地址 (OR 97201)", true);
      } else {
        chrome.tabs.create({ url: "https://payments.google.com/gp/w/home/settings" });
        window.close();
      }
    });
  });
})();
