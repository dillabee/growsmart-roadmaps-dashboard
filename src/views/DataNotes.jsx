export default function DataNotes({ data }) {
  const limitations = [
    "ACS estimates for small towns carry wide margins of error; treat small year-to-year changes as directional, not precise.",
    "Regional rollup values are sums of the six communities. Medians (age, household income) cannot be summed and are shown per community only.",
    "QCEW suppresses some industries in small areas for confidentiality, so industry employment may not sum to the total.",
    "Port trade values reflect goods moving through the port, not goods produced locally, and are nominal dollars (not inflation-adjusted).",
    "Agricultural census data (county level only) is planned for a future release and is not yet in this dashboard.",
  ];

  const updateSteps = [
    "Refresh source files and update the clean data workbook.",
    "Run python scripts/build_data.py - it validates the workbook and regenerates the dashboard data file.",
    "Review the warnings it prints (missing years, missing communities, duplicates).",
    "Rebuild the site (npm run build) and review every community page plus the print scorecard.",
    "Publish to staging, approve, publish live, and archive the annual data snapshot.",
  ];

  return (
    <div className="data-notes">
      <div className="notes-hero">
        <div>
          <h2>Data Notes</h2>
          <p className="lede">
            Definitions, sources, and known limitations for every dataset behind
            this dashboard. The dashboard is rebuilt from a single clean data
            workbook; see the update process below.
          </p>
        </div>
        <div className="notes-source-card">
          <span>Source workbook</span>
          <strong>{data.meta.sourceFile}</strong>
        </div>
      </div>

      <section className="notes-panel">
        <h3>Datasets &amp; Sources</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Dataset</th><th>Source</th><th>Geography</th><th>Years</th><th>Update cadence</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Demographic &amp; Socioeconomic Context</td>
                <td>U.S. Census Bureau, American Community Survey (ACS) 5-Year Estimates</td>
                <td>Six communities, Aroostook &amp; Washington counties, Maine</td>
                <td>2014, 2019, 2024 (5-year period endpoints)</td>
                <td>Annual (each December release)</td>
              </tr>
              <tr>
                <td>Economic Base</td>
                <td>Maine Department of Labor, Quarterly Census of Employment and Wages (QCEW)</td>
                <td>Six communities, both counties, Maine</td>
                <td>2019, 2025 annual averages</td>
                <td>Annual</td>
              </tr>
              <tr>
                <td>Port Trade</td>
                <td>U.S. Census Bureau, USA Trade Online (port-level)</td>
                <td>Calais, Houlton, Van Buren ports</td>
                <td>2015-2025 (+partial 2026)</td>
                <td>Monthly release; used annually</td>
              </tr>
              <tr>
                <td>Border Crossings</td>
                <td>U.S. Customs and Border Protection</td>
                <td>Calais, Houlton, Van Buren ports of entry</td>
                <td>Federal FY 2019-2025</td>
                <td>Monthly release; used annually</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <div className="notes-grid">
        <section className="notes-panel">
          <h3>Known Limitations</h3>
          <div className="limitation-list">
            {limitations.map((item) => (
              <div className="limitation-card" key={item}>
                <span aria-hidden="true" />
                <p>{item}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="notes-panel">
          <h3>Update Process (Years 2 &amp; 3)</h3>
          <ol className="process-list">
            {updateSteps.map((step, index) => (
              <li key={step}>
                <span>{index + 1}</span>
                <p>
                  {step.includes("python scripts/build_data.py") ? (
                    <>
                      Run <code>python scripts/build_data.py</code> - it validates the workbook and regenerates the dashboard data file.
                    </>
                  ) : step.includes("npm run build") ? (
                    <>
                      Rebuild the site (<code>npm run build</code>) and review every community page plus the print scorecard.
                    </>
                  ) : (
                    step
                  )}
                </p>
              </li>
            ))}
          </ol>
        </section>
      </div>

      <p className="source-note">
        Built from workbook: {data.meta.sourceFile}. Prepared by Camoin
        Associates for the GrowSmart Maine Roadmaps for Growth program.
      </p>
    </div>
  );
}
