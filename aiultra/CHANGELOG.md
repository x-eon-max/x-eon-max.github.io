# Changelog

## [1.1.0] - 2026-11-17
### Added
- YouTube Premium add-on is now optional: `presets.js` builds `full_items` from `CFG.includeYt`, so each preset yields either `Ultra + YouTube` or `Ultra` alone.
- Switch in both surfaces (floating panel `#g1-zc-include-yt`, popup `#popup-include-yt`), persisted in `chrome.storage.local` (`g1ZcIncludeYt`, default `true`) and synced across panel/popup via `chrome.storage.onChanged`.
- Panel preset `<select>` and quick-button list are re-rendered on toggle, so titles/subtitles always match the current state.
- `includeYt` now travels with `OPEN_ZERO_COST_MODAL` and with the `g1ZcPending` / sessionStorage payload, and is applied before the trigger — a preset click that beats the async `storage.onChanged` no longer re-adds YouTube.
### Changed
- Preset titles/subtitles/badges are getters; badge no longer hardcodes `+YT`, extension renamed to `(1个月版)`.

## [1.0.0] - 2026-11-17
### Added
- Extracted standalone 1-month YouTube edition `google-one-zero-cost-extension-1m-yt` containing only `ultra30tb_1m_yt` (`g1.play.ai.pro` 1M + `g1.youtube_premium_individual_add_on` 1M) and `ultra20tb_1m_yt` (`g1.play.20tb` 1M + `g1.youtube_premium_individual_add_on` 1M).
- Removed all 12-month plans, Gmail add-on (`g1.workspace_addon`) presets, multi-layer stacking queues, and 24-char subscription ID UI.
- Preserved `TrustedHTML`-compliant DOM creation, `ear[2][0] = null` cross-country safety, `/u/N/` multi-account routing, and Oregon (`OR 97201`) Google Pay address helper.
