// Snapshots MotherDuck data into public/data/*.json so the site never has to
// ship a MotherDuck token or run live queries in the browser. Run by
// .github/workflows/refresh-data.yml on a schedule, or locally by anyone
// with a MOTHERDUCK_TOKEN of their own (no token is ever committed).
//
// Usage: MOTHERDUCK_TOKEN=... node scripts/refresh-data.mjs

import { DuckDBInstance } from '@duckdb/node-api';
import { writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.resolve(__dirname, '../public/data');
const TOWNS = "('Cornelius','Davidson','Huntersville')";

const TOKEN = process.env.MOTHERDUCK_TOKEN;
if (!TOKEN) {
  console.error('MOTHERDUCK_TOKEN environment variable is required.');
  process.exit(1);
}

async function all(conn, sql) {
  const reader = await conn.runAndReadAll(sql);
  return reader.getRowObjectsJson();
}

async function writeJSON(name, rows) {
  await writeFile(path.join(OUT_DIR, `${name}.json`), JSON.stringify(rows, null, 2) + '\n');
}

// Ported verbatim from the JS `find()` helpers in housing.js blocks 14/15/16 -
// these tables' columns get discovered by name at query time rather than
// hardcoded, so a table schema change doesn't silently break the chart.
function findCol(colNames, keys) {
  return colNames.find((c) => keys.some((k) => c.toLowerCase().includes(k))) || null;
}

// Queries that don't need any dynamic column discovery: one query in, one
// JSON file out. SQL text ported verbatim from the current client-side JS -
// no changes to CAST/ROUND/WHERE logic, so displayed numbers don't shift.
const SIMPLE_QUERIES = {
  'housing-rent-income': `
    SELECT town, year, CAST(median_income AS INTEGER) AS median_income, CAST(median_rent AS INTEGER) AS median_rent
    FROM nmidw.agg_town_economic_trends
    WHERE town IN ${TOWNS}
    ORDER BY town, year
  `,
  'housing-value-income': `
    SELECT town, year,
      CAST(median_income AS INTEGER) AS median_income,
      CAST(median_home_value AS INTEGER) AS median_home_value
    FROM nmidw.agg_town_economic_trends
    ORDER BY town, year
  `,
  'housing-affordability-index': `
    SELECT town, year,
           ROUND((median_rent * 12.0 / median_income) * 100, 2) AS rti,
           ROUND(median_home_value * 1.0 / median_income, 2) AS hpti
    FROM nmidw.agg_town_economic_trends
    WHERE town IN ${TOWNS}
      AND median_income > 0
    ORDER BY town, year
  `,
  'town-population': `
    SELECT town, year, CAST(total_population AS INTEGER) AS population
    FROM nmidw.agg_town_demographics
    WHERE town IN ${TOWNS}
    ORDER BY town, year
  `,
  'town-households': `
    SELECT town, year, CAST(total_households AS INTEGER) AS total_households
    FROM nmidw.agg_town_housing_burden
    WHERE town IN ${TOWNS}
    ORDER BY town, year
  `,
  'housing-burden-trend': `
    SELECT town, year,
           CAST("housing_burden_rate_%" AS DOUBLE) AS burden_rate,
           CAST(cost_burdened_households AS INTEGER) AS cost_burdened,
           CAST(severely_cost_burdened_households AS INTEGER) AS severely_burdened,
           CAST(total_households AS INTEGER) AS total_households,
           ROUND(severely_cost_burdened_households / total_households * 100, 1) AS severe_rate
    FROM nmidw.agg_town_housing_burden
    WHERE town IN ${TOWNS}
    ORDER BY town, year
  `,
  'severely-burdened-households': `
    SELECT town, year, severely_cost_burdened_households
    FROM nmidw.agg_town_housing_burden
    WHERE town IN ${TOWNS}
    ORDER BY town, year
  `,
  'down-payment-years': `
    SELECT town, median_home_value, median_income,
      ROUND((median_home_value * 0.20) / (median_income * 0.10), 2) AS years
    FROM nmidw.agg_town_economic_trends
    WHERE year = (SELECT MAX(year) FROM nmidw.agg_town_economic_trends)
    ORDER BY years DESC
  `,
  'median-income-trend': `
    SELECT town, year, CAST(median_household_income AS INTEGER) AS income
    FROM nmidw.agg_town_demographics
    WHERE town IN ${TOWNS}
    ORDER BY town, year
  `,
  'gini-ptr-trend': `
    SELECT town, year,
           ROUND(income_inequality_gini, 4) AS gini,
           CAST(median_home_value AS INTEGER) AS home_value,
           CAST(median_income AS INTEGER) AS income,
           ROUND(median_home_value / median_income, 2) AS ptr
    FROM nmidw.agg_town_economic_trends
    WHERE town IN ${TOWNS}
    ORDER BY town, year
  `,
  'infrastructure-access': `
    SELECT town, year,
           ROUND(renter_no_car_rate_pct, 2) AS renter_no_car,
           ROUND(owner_no_car_rate_pct, 2) AS owner_no_car,
           ROUND(household_no_internet_rate_pct, 2) AS no_internet,
           ROUND(labor_force_uninsured_rate_pct, 2) AS labor_uninsured,
           ROUND(senior_uninsured_rate_pct, 2) AS senior_uninsured
    FROM nmidw.analytics_infrastructure_accesibility
    WHERE town IN ${TOWNS}
    ORDER BY town, year
  `,
  'economic-mobility': `
    SELECT town, year,
           ROUND(bachelors_masters_rate_pct, 2) AS edu,
           ROUND(poverty_rate_pct, 2) AS poverty,
           ROUND(labor_unemployment_rate_pct, 2) AS unemployment
    FROM nmidw.economic_mobility_education
    WHERE town IN ${TOWNS}
    ORDER BY town, year
  `,
  'healthcare-insurance': `
    SELECT
      hi.GEOID,
      hi.town AS "Town",
      CAST(dem.total_population AS INTEGER) AS "Tot_pop",
      hi.year,
      hi.all_ins, hi.all_unins,
      hi.ins_U18,  hi.unins_U18,
      hi.ins_19_25, hi.unins_19_25,
      hi.ins_26_34, hi.unins_26_34,
      hi.ins_35_64, hi.unins_35_64,
      hi.ins_65_over, hi.unins_65_over,
      hi.emp_based_ins, hi.dir_purchase_ins,
      hi.medicare_cov, hi.medicaid_cov,
      hi.tricare_cov, hi.va_cov AS "VA_cov", hi.other_cov_type,
      hd.emp_insured, hd.emp_uninsured,
      hd.unemp_insured, hd.unemp_uninsured,
      hd.ins_U25, hd.no_ins_U25,
      hd.ins_25_50, hd.no_ins_25_50,
      hd.ins_50_75, hd.no_ins_50_75,
      hd.ins_75_100, hd.no_ins_75_100,
      hd.ins_100_above, hd.no_ins_100_above
    FROM nmidw.main.agg_town_health_insurance hi
    JOIN nmidw.main.agg_town_health_data hd
      ON hi.GEOID = hd.GEOID AND hi.year = hd.year
    JOIN nmidw.agg_town_demographics dem
      ON hi.GEOID = dem.GEOID AND hi.year = dem.year
    ORDER BY hi.year, hi.town
  `,
  'mental-health-facilities': `
    SELECT
      ANY_VALUE(facility_name) AS facility_name,
      ANY_VALUE(street1)       AS street1,
      ANY_VALUE(city)          AS city,
      ANY_VALUE(phone)         AS phone, 
      ANY_VALUE(website)       AS website,
      latitude,
      longitude,
      STRING_AGG(DISTINCT facility_type_label, ', ') AS types
    FROM nmidw.agg_mhsu_facility_detail
    WHERE latitude IS NOT NULL AND longitude IS NOT NULL
    GROUP BY latitude, longitude
  `,
  'mh-depression': `
    SELECT town_name AS town, year_key AS year,
      data_value AS val,
      low_confidence_limit AS lo,
      high_confidence_llimit AS hi
    FROM nmidw.gold.cdc_places
    WHERE measure_id = 'DEPRESSION'
      AND data_value_type_id = 'AgeAdjPrv'
      AND town_name IN ${TOWNS}
    ORDER BY town, year
  `,
  'mh-distress': `
    SELECT town_name AS town, year_key AS year,
      data_value AS val,
      low_confidence_limit AS lo,
      high_confidence_llimit AS hi
    FROM nmidw.gold.cdc_places
    WHERE measure_id = 'MHLTH'
      AND data_value_type_id = 'AgeAdjPrv'
      AND town_name IN ${TOWNS}
    ORDER BY town, year
  `,
  'dlib-economic-trends': `
    SELECT town, year,
      CAST(median_rent AS INTEGER) AS median_rent_monthly_usd,
      CAST(median_income AS INTEGER) AS median_household_income_usd,
      CAST(median_home_value AS INTEGER) AS median_home_value_usd,
      ROUND(median_home_value * 1.0 / NULLIF(median_income,0), 2) AS home_price_to_income_ratio,
      ROUND((median_rent * 12.0) / NULLIF(median_income,0) * 100, 1) AS rent_to_income_pct,
      ROUND(income_inequality_gini, 4) AS gini_coefficient
    FROM nmidw.agg_town_economic_trends
    WHERE town IN ${TOWNS} ORDER BY town, year
  `,
  'dlib-housing-burden': `
    SELECT town, year,
      CAST(total_households AS INTEGER) AS total_households,
      CAST(cost_burdened_households AS INTEGER) AS cost_burdened_households,
      CAST(severely_cost_burdened_households AS INTEGER) AS severely_cost_burdened_households,
      ROUND(CAST("housing_burden_rate_%" AS DOUBLE), 1) AS cost_burden_rate_pct
    FROM nmidw.agg_town_housing_burden
    WHERE town IN ${TOWNS} ORDER BY town, year
  `,

  'grade-level-proficiency': `
    SELECT school, grade_span, 
      town_name AS town, 
      is_title_1,
      glp, glp_raw,
      ccr, 
    FROM nmidw.agg_school_proficiency
    WHERE town_name IN ${TOWNS}
    ORDER BY town_name, school  
  `,

  'school-academic-growth': `
    SELECT school, grade_span,
      town_name AS town,
       status, index_score
    FROM nmidw.agg_school_growth
    WHERE town_name IN ${TOWNS}
    ORDER BY town_name, school
  `,

  'four-year-school-graduation': `
    SELECT school, 
      town_name AS town,
      grad_4yr,
      grad_4yr_raw
    FROM nmidw.agg_school_graduation
    WHERE town_name IN ${TOWNS}
    ORDER BY town_name, school
  `,

  'school-achievement-and-economic-gap': `
    SELECT 
      school,
      town_name AS town,
      econ_disadv,
      not_disadv,
      gap
    FROM nmidw.agg_school_economic_gap
    WHERE town_name IN ${TOWNS}
    ORDER BY town_name, school
  `,

  'highschool-achievement-economic-gap': `
    SELECT school, 
      town_name AS town,
      econ_disadv,
      not_disadv,
      gap
    FROM nmidw.agg_school_hs_economic_gap
    WHERE town_name IN ${TOWNS}
    ORDER BY town_name, school
  `,

  'pop-growth-k12-enrollment': `
    SELECT
      town,
      year,
      total_pop_3_plus,
      n_enrolled_k12_total,
      n_enrolled_total
    FROM nmidw.agg_town_school_enrollment
    WHERE town IN ${TOWNS}
    ORDER BY town, year
  `,

  // ── United Neighborhoods: one file per topic, all five neighborhoods ────────
  // Each file has a neighborhood_name column so the JS can filter on tab/nbhd
  // switch. East Catawba has data in the DB but the UI marks it "coming soon".
  // Each table has one row per block-group (GEOID) per year; some neighborhoods
  // span 2-3 block groups. Aggregate to one row per neighborhood+year:
  //   counts  → SUM; rates/percentages/medians → recalculate from summed counts.
  // This matches the pattern already used by pottstown-demographics below.
  'nbhd-demographics': `
    SELECT
      neighborhood_name,
      year,
      CAST(SUM(total_population) AS INTEGER)                  AS total_population,
      CAST(SUM(race_white_alone) AS INTEGER)                  AS race_white,
      CAST(SUM(race_black_alone) AS INTEGER)                  AS race_black,
      CAST(SUM(race_asian_alone) AS INTEGER)                  AS race_asian,
      CAST(SUM(ethnicity_hispanic_or_latino) AS INTEGER)      AS hispanic_latino,
      ROUND(SUM(ethnicity_hispanic_or_latino) * 100.0
            / NULLIF(SUM(total_population), 0), 1)            AS hispanic_rate,
      CAST(SUM(foreign_born_population) AS INTEGER)           AS foreign_born,
      ROUND(SUM(foreign_born_population) * 100.0
            / NULLIF(SUM(total_population), 0), 1)            AS foreign_born_rate
    FROM nmidw.main.agg_neighborhood_demographics
    GROUP BY neighborhood_name, year
    ORDER BY neighborhood_name, year
  `,
  'nbhd-economic': `
    SELECT
      neighborhood_name,
      year,
      CAST(SUM(total_households) AS INTEGER)                  AS total_households,
      CAST(SUM(income_under_25k) AS INTEGER)                  AS income_under_25k,
      CAST(SUM(income_25k_50k) AS INTEGER)                    AS income_25k_50k,
      CAST(SUM(income_50k_100k) AS INTEGER)                   AS income_50k_100k,
      CAST(SUM(income_100k_plus) AS INTEGER)                  AS income_100k_plus,
      CAST(ROUND(SUM(median_household_income * total_households)
            / NULLIF(SUM(total_households), 0)) AS INTEGER)   AS median_household_income,
      ROUND(SUM(income_inequality_gini * total_households)
            / NULLIF(SUM(total_households), 0), 4)            AS gini,
      CAST(SUM(below_poverty_level) AS INTEGER)               AS below_poverty,
      ROUND(SUM(below_poverty_level) * 100.0
            / NULLIF(SUM(total_households), 0), 1)            AS poverty_rate
    FROM nmidw.main.agg_neighborhood_economic_profile
    GROUP BY neighborhood_name, year
    ORDER BY neighborhood_name, year
  `,
  'nbhd-housing': `
    SELECT
      neighborhood_name,
      year,
      CAST(SUM(total_housing_units) AS INTEGER)               AS total_housing_units,
      CAST(SUM(total_owner_occupied) AS INTEGER)              AS owner_occupied,
      CAST(SUM(total_renter_occupied) AS INTEGER)             AS renter_occupied,
      ROUND(SUM(total_owner_occupied) * 100.0
            / NULLIF(SUM(total_housing_units), 0), 1)         AS owner_rate,
      ROUND(SUM(total_renter_occupied) * 100.0
            / NULLIF(SUM(total_housing_units), 0), 1)         AS renter_rate,
      CAST(ROUND(SUM(median_gross_rent * total_renter_occupied)
            / NULLIF(SUM(total_renter_occupied), 0)) AS INTEGER) AS median_gross_rent,
      CAST(ROUND(SUM(median_home_value * total_owner_occupied)
            / NULLIF(SUM(total_owner_occupied), 0)) AS INTEGER)  AS median_home_value,
      CAST(SUM(cost_burdened_households) AS INTEGER)          AS cost_burdened,
      CAST(SUM(severely_cost_burdened_households) AS INTEGER) AS severely_burdened,
      ROUND(SUM(cost_burdened_households) * 100.0
            / NULLIF(SUM(total_renter_occupied), 0), 1)       AS burden_rate,
      CAST(SUM(owner_no_vehicle) AS INTEGER)                  AS owner_no_vehicle,
      CAST(SUM(renter_no_vehicle) AS INTEGER)                 AS renter_no_vehicle
    FROM nmidw.main.agg_neighborhood_housing
    GROUP BY neighborhood_name, year
    ORDER BY neighborhood_name, year
  `,
  'nbhd-education': `
    SELECT
      neighborhood_name,
      year,
      CAST(SUM(total_pop_25_plus) AS INTEGER)                 AS pop_25_plus,
      CAST(SUM(n_less_than_hs) AS INTEGER)                    AS n_less_than_hs,
      CAST(SUM(n_hs_or_equiv) AS INTEGER)                     AS n_hs_or_equiv,
      CAST(SUM(n_some_college) AS INTEGER)                    AS n_some_college,
      CAST(SUM(n_associates) AS INTEGER)                      AS n_associates,
      CAST(SUM(n_bachelors) AS INTEGER)                       AS n_bachelors,
      CAST(SUM(n_graduate_or_prof) AS INTEGER)                AS n_graduate_or_prof,
      ROUND(SUM(n_less_than_hs) * 100.0
            / NULLIF(SUM(total_pop_25_plus), 0), 1)           AS pct_less_than_hs,
      ROUND(SUM(n_hs_or_equiv) * 100.0
            / NULLIF(SUM(total_pop_25_plus), 0), 1)           AS pct_hs_or_equiv,
      ROUND(SUM(n_bachelors) * 100.0
            / NULLIF(SUM(total_pop_25_plus), 0), 1)           AS pct_bachelors,
      ROUND((SUM(n_bachelors) + SUM(n_graduate_or_prof)) * 100.0
            / NULLIF(SUM(total_pop_25_plus), 0), 1)           AS pct_bachelors_or_higher,
      CAST(SUM(n_enrolled_total) AS INTEGER)                  AS n_enrolled_total,
      CAST(SUM(n_enrolled_k12) AS INTEGER)                    AS n_enrolled_k12
    FROM nmidw.main.agg_neighborhood_education
    GROUP BY neighborhood_name, year
    ORDER BY neighborhood_name, year
  `,
  'nbhd-transportation': `
    SELECT
      neighborhood_name,
      year,
      CAST(SUM(total_workers) AS INTEGER)                     AS total_workers,
      CAST(SUM(commute_drove_alone) AS INTEGER)               AS drove_alone,
      CAST(SUM(commute_public_transit) AS INTEGER)            AS public_transit,
      CAST(SUM(commute_walked) AS INTEGER)                    AS walked,
      CAST(SUM(commute_bicycle) AS INTEGER)                   AS bicycle,
      CAST(SUM(commute_worked_from_home) AS INTEGER)          AS worked_from_home,
      ROUND(SUM(commute_drove_alone) * 100.0
            / NULLIF(SUM(total_workers), 0), 1)               AS pct_drove_alone,
      ROUND(SUM(commute_public_transit) * 100.0
            / NULLIF(SUM(total_workers), 0), 1)               AS pct_public_transit,
      ROUND(SUM(commute_worked_from_home) * 100.0
            / NULLIF(SUM(total_workers), 0), 1)               AS pct_worked_from_home,
      ROUND(SUM(aggregate_commute_minutes)
            / NULLIF(SUM(total_workers), 0), 1)               AS avg_commute_minutes,
      CAST(SUM(households_no_vehicle) AS INTEGER)             AS households_no_vehicle
    FROM nmidw.main.agg_neighborhood_transportation
    GROUP BY neighborhood_name, year
    ORDER BY neighborhood_name, year
  `,
  'nbhd-childcare': `
    SELECT
      neighborhood_name,
      year,
      CAST(SUM(total_children_under_18) AS INTEGER)                AS total_under_18,
      CAST(SUM(children_under6) AS INTEGER)                        AS children_under6,
      CAST(SUM(children_6_17) AS INTEGER)                          AS children_6_17,
      CAST(SUM(under6_likely_needs_childcare) AS INTEGER)          AS under6_needs_childcare,
      ROUND(SUM(under6_likely_needs_childcare) * 100.0
            / NULLIF(SUM(children_under6), 0), 1)                  AS pct_under6_needs_childcare,
      CAST(SUM(age6_17_likely_needs_afterschool) AS INTEGER)       AS age6_17_needs_afterschool,
      ROUND(SUM(age6_17_likely_needs_afterschool) * 100.0
            / NULLIF(SUM(children_6_17), 0), 1)                    AS pct_6_17_needs_afterschool,
      CAST(SUM(grandparent_caregiver_households) AS INTEGER)       AS grandparent_caregivers
    FROM nmidw.main.agg_neighborhood_childcare
    GROUP BY neighborhood_name, year
    ORDER BY neighborhood_name, year
  `,

};

async function run() {
  await mkdir(OUT_DIR, { recursive: true });

  // Pass the token via the environment variable the motherduck extension
  // reads natively, rather than interpolating it into a SQL string - keeps
  // it out of query text entirely, so it can't end up echoed back in a
  // DuckDB error message or query log.
  process.env.motherduck_token = TOKEN;

  const instance = await DuckDBInstance.create(':memory:');
  const conn = await instance.connect();

  await all(conn, 'INSTALL motherduck');
  await all(conn, 'LOAD motherduck');
  await all(conn, `ATTACH 'md:'`);

  let hadUnexpectedFailure = false;

  for (const [name, sql] of Object.entries(SIMPLE_QUERIES)) {
    try {
      const rows = await all(conn, sql);
      await writeJSON(name, rows);
      console.log(`✓ ${name}: ${rows.length} rows`);
    } catch (err) {
      hadUnexpectedFailure = true;
      console.error(`✗ ${name}: ${err.message}`);
      await writeJSON(name, []);
    }
  }

  // ALICE household data - two queries run concurrently in housing.js Block 21
  try {
    const [townRows, countyRows] = await Promise.all([
      all(
        conn,
        `SELECT town, year, total_households, poverty_households, alice_households, above_alice_households
         FROM nmidw.agg_town_alice_household
         WHERE town IN ${TOWNS}
         ORDER BY town, year`
      ),
      all(
        conn,
        `SELECT county, year, total_households, poverty_households, alice_households, above_alice_households
         FROM nmidw.agg_county_alice_household
         ORDER BY county, year`
      ),
    ]);
    await writeJSON('alice-town', townRows);
    await writeJSON('alice-county', countyRows);
    console.log(`✓ alice-town: ${townRows.length} rows`);
    console.log(`✓ alice-county: ${countyRows.length} rows`);
  } catch (err) {
    hadUnexpectedFailure = true;
    console.error(`✗ alice-town/alice-county: ${err.message}`);
    await writeJSON('alice-town', []);
    await writeJSON('alice-county', []);
  }

  // race-summary - housing.js Block 14 (DESCRIBE-driven column discovery)
  try {
    const colRows = await all(conn, 'DESCRIBE nmidw.agg_town_demographics');
    const colNames = colRows.map((r) => r.column_name);
    const races = [
      { label: 'White, not Hispanic', col: colNames.find((c) => c.includes('white') && !c.includes('alone')) || colNames.find((c) => c.includes('white')) },
      { label: 'Black or African American', col: colNames.find((c) => c.includes('black')) },
      { label: 'Hispanic or Latino', col: colNames.find((c) => c.includes('hispanic') || c.includes('latino')) },
      { label: 'Asian', col: colNames.find((c) => c.includes('asian')) },
    ].filter((r) => r.col);
    const totalCol = colNames.find((c) => c.includes('total_pop') || c.includes('total_population'));
    const sql = `
      SELECT town,
        ${totalCol ? `CAST(${totalCol} AS INTEGER) AS total_pop` : '0 AS total_pop'}
        ${races.map((r) => `, CAST(${r.col} AS INTEGER) AS "${r.label}"`).join('')}
      FROM nmidw.agg_town_demographics
      WHERE town IN ${TOWNS} AND year = 2024
    `;
    const rows = await all(conn, sql);
    await writeJSON('race-summary', rows);
    console.log(`✓ race-summary: ${rows.length} rows`);
  } catch (err) {
    hadUnexpectedFailure = true;
    console.error(`✗ race-summary: ${err.message}`);
    await writeJSON('race-summary', []);
  }

  // race-composition - housing.js Block 15 (DESCRIBE + MAX(year) + final query)
  try {
    const colRows = await all(conn, 'DESCRIBE nmidw.agg_town_demographics');
    const colNames = colRows.map((r) => r.column_name);
    const totalCol = findCol(colNames, ['total_pop', 'total_population', 'population']);
    const whiteCol = findCol(colNames, ['white']);
    const blackCol = findCol(colNames, ['black']);
    const asianCol = findCol(colNames, ['asian']);
    const hispanicCol = findCol(colNames, ['hispanic', 'latino']);
    const twoMoreCol = findCol(colNames, ['two_or_more', 'two or more', 'multiracial']);
    const nativeCol = findCol(colNames, ['american_indian', 'native_american', 'aian']);
    const nhpiCol = findCol(colNames, ['native_hawaiian', 'pacific_islander', 'nhpi']);
    const otherCol = findCol(colNames, ['some_other', 'other_race']);
    const yearCol = findCol(colNames, ['year']);
    const townCol = findCol(colNames, ['town']);
    const maxYearRows = await all(conn, `SELECT MAX(${yearCol}) as yr FROM nmidw.agg_town_demographics`);
    const maxYear = maxYearRows[0].yr;
    const sql = `SELECT ${townCol} as town, ${totalCol} as total, ${whiteCol} as white, ${blackCol} as black, ${asianCol} as asian, ${hispanicCol} as hispanic, ${twoMoreCol || '0'} as two_more, ${nativeCol || '0'} as native, ${nhpiCol || '0'} as nhpi, ${otherCol || '0'} as other FROM nmidw.agg_town_demographics WHERE ${yearCol} = ${maxYear} AND ${townCol} IN ${TOWNS}`;
    const rows = await all(conn, sql);
    await writeJSON('race-composition', rows);
    console.log(`✓ race-composition: ${rows.length} rows`);
  } catch (err) {
    hadUnexpectedFailure = true;
    console.error(`✗ race-composition: ${err.message}`);
    await writeJSON('race-composition', []);
  }

  // race-trend - housing.js Block 16 (DESCRIBE-driven column discovery)
  try {
    const colRows = await all(conn, 'DESCRIBE nmidw.agg_town_demographics');
    const colNames = colRows.map((r) => r.column_name);
    const totalCol = findCol(colNames, ['total_pop', 'total_population', 'population']);
    const whiteCol = findCol(colNames, ['white']);
    const blackCol = findCol(colNames, ['black']);
    const hispanicCol = findCol(colNames, ['hispanic', 'latino']);
    const asianCol = findCol(colNames, ['asian']);
    if (!totalCol || !whiteCol) throw new Error(`Expected race columns not found. Have: ${colNames.join(', ')}`);
    const selects = [
      `CAST(${totalCol} AS INTEGER) AS total`,
      whiteCol ? `CAST(${whiteCol} AS INTEGER) AS white` : '0 AS white',
      blackCol ? `CAST(${blackCol} AS INTEGER) AS black` : '0 AS black',
      hispanicCol ? `CAST(${hispanicCol} AS INTEGER) AS hispanic` : '0 AS hispanic',
      asianCol ? `CAST(${asianCol} AS INTEGER) AS asian` : '0 AS asian',
    ].join(', ');
    const sql = `
      SELECT town, year, ${selects}
      FROM nmidw.agg_town_demographics
      WHERE town IN ${TOWNS}
      ORDER BY town, year
    `;
    const rows = await all(conn, sql);
    await writeJSON('race-trend', rows);
    console.log(`✓ race-trend: ${rows.length} rows`);
  } catch (err) {
    hadUnexpectedFailure = true;
    console.error(`✗ race-trend: ${err.message}`);
    await writeJSON('race-trend', []);
  }

  // pottstown-demographics - kept for backward compat with neighborhoods.js
  // which still loads this file directly. The broader nbhd-demographics.json
  // (in SIMPLE_QUERIES above) supersedes it for new chart code; once the JS
  // is updated to use that file instead, this block can be removed.
  try {
    const sql = `
      SELECT
        year,
        SUM(CAST(total_population AS INTEGER))             AS total_population,
        SUM(CAST(race_white_alone AS INTEGER))             AS race_white,
        SUM(CAST(race_black_alone AS INTEGER))             AS race_black,
        SUM(CAST(race_asian_alone AS INTEGER))             AS race_asian,
        SUM(CAST(ethnicity_hispanic_or_latino AS INTEGER)) AS hispanic_latino,
        ROUND(SUM(ethnicity_hispanic_or_latino) * 100.0
              / NULLIF(SUM(total_population), 0), 1)       AS hispanic_rate
      FROM nmidw.main.agg_neighborhood_demographics
      WHERE neighborhood_name = 'Pottstown'
      GROUP BY year
      ORDER BY year
    `;
    const rows = await all(conn, sql);
    await writeJSON('pottstown-demographics', rows);
    console.log(`✓ pottstown-demographics: ${rows.length} rows`);
  } catch (err) {
    hadUnexpectedFailure = true;
    console.error(`✗ pottstown-demographics: ${err.message}`);
    await writeJSON('pottstown-demographics', []);
  }

  // dlib-demographics - total_households lives in agg_town_housing_burden,
  // not agg_town_demographics, so we JOIN the two tables on GEOID + year.
  try {
    const sql = `
      SELECT t.town, t.year,
        CAST(t.total_population AS INTEGER)       AS total_population,
        CAST(h.total_households AS INTEGER)       AS total_households,
        CAST(t.median_household_income AS INTEGER) AS median_household_income_usd
      FROM nmidw.agg_town_demographics AS t
      JOIN nmidw.agg_town_housing_burden AS h
        ON t.GEOID = h.GEOID AND t.year = h.year
      WHERE t.town IN ${TOWNS}
      ORDER BY t.town, t.year
    `;
    const rows = await all(conn, sql);
    await writeJSON('dlib-demographics', rows);
    console.log(`✓ dlib-demographics: ${rows.length} rows`);
  } catch (err) {
    hadUnexpectedFailure = true;
    console.error(`✗ dlib-demographics: ${err.message}`);
    await writeJSON('dlib-demographics', []);
  }

  if (hadUnexpectedFailure) {
    console.error('\nOne or more datasets failed to refresh unexpectedly (see ✗ markers above).');
    console.error('Other datasets were still written successfully.');
    process.exit(1);
  }
  console.log('\nAll datasets refreshed successfully.');
}

run().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
