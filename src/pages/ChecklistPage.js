export function createChecklistPageMarkup() {
  return `
    <section class="section section-surface" id="travel-checklist" data-page="checklist" hidden aria-labelledby="checklistTitle">
      <div class="container">
        <div class="section-head">
          <div>
            <p class="section-kicker" data-i18n="prepKicker">Persiapan Sebelum Berangkat</p>
            <h2 id="checklistTitle" data-i18n="prepTitle">Checklist Perjalanan Ramah Muslim</h2>
            <p class="section-sub" data-i18n="prepSub">
              Tandai kelengkapan perjalanan Anda. Kemajuan tersimpan otomatis pada perangkat ini.
            </p>
          </div>
          <div class="prep-summary-meta">
            <span class="tabular-nums" id="prepProgressText">0 / 6</span>
            <button type="button" class="btn btn-outline btn-sm" id="resetPrepBtn" data-i18n="btnResetPrep">Reset</button>
            <a href="/rencana-trip" class="btn btn-light btn-sm" data-nav-page="planner" data-i18n="navPlan">Rencana Trip</a>
            <a href="/ringkasan" class="btn btn-primary btn-sm" data-nav-page="summary">
              <span data-i18n="openSummaryPageBtn">Lihat Ringkasan &amp; Total</span> →
            </a>
          </div>
        </div>

        <div class="progress-track" aria-hidden="true">
          <div class="progress-fill" id="prepProgressBar"></div>
        </div>

        <div class="checklist-grid" id="prepChecklistGrid"></div>
      </div>
    </section>
  `;
}
