export default function DataNotes({ data }) {
  return (
    <div className="data-notes">
      <h2>Data Notes</h2>
      <p className="lede">
        Definitions, sources, and known limitations for every dataset behind
        this dashboard. The dashboard is rebuilt from a single clean data
        workbook; see the update process below.
      </p>

      <h3>Datasets &amp; Sources</h3>
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
            <td>2015–2025 (+partial 2026)</td>
            <td>Monthly release; used annually</td>
          </tr>
          <tr>
            <td>Border Crossings</td>
            <td>U.S. Customs and Border Protection</td>
            <td>Calais, Houlton, Van Buren ports of entry</td>
            <td>Federal FY 2019–2025</td>
            <td>Monthly release; used annually</td>
          </tr>
        </tbody>
      </table>

      <h3>Known Limitations</h3>
      <ul>
        <li>
          ACS estimates for small towns carry wide margins of error; treat small
          year-to-year changes as directional, not precise.
        </li>
        <li>
          Regional rollup values are sums of the six communities. Medians (age,
          household income) cannot be summed and are shown per community only.
        </li>
        <li>
          QCEW suppresses some industries in small areas for confidentiality,
          so industry employment may not sum to the total.
        </li>
        <li>
          Port trade values reflect goods moving through the port, not goods
          produced locally, and are nominal dollars (not inflation-adjusted).
        </li>
        <li>
          Agricultural census data (county level only) is planned for a future
          release and is not yet in this dashboard.
        </li>
      </ul>

      <h3>Update Process (Years 2 &amp; 3)</h3>
      <ol>
        <li>Refresh source files and update the clean data workbook.</li>
        <li>Run <code>python scripts/build_data.py</code> — it validates the workbook and regenerates the dashboard data file.</li>
        <li>Review the warnings it prints (missing years, missing communities, duplicates).</li>
        <li>Rebuild the site (<code>npm run build</code>) and review every community page plus the print scorecard.</li>
        <li>Publish to staging, approve, publish live, and archive the annual data snapshot.</li>
      </ol>

      <p className="source-note">
        Built from workbook: {data.meta.sourceFile}. Prepared by Camoin
        Associates for the GrowSmart Maine Roadmaps for Growth program.
      </p>
    </div>
  );
}
