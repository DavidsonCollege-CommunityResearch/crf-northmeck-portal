# Housing headline figures shown both on the housing page's Overview tab and
# in the home page's data spotlight. Computed once here so the two pages can't
# disagree. Source after R/nm.R.

local({
  towns <- c("Cornelius", "Davidson", "Huntersville")
  ri <- nm_data("housing-rent-income")
  hv <- nm_data("housing-value-income")
  rent <- function(t, y) nm_value(ri, "median_rent", town = t, year = y)
  rise <- sapply(towns, function(t) pct_change(rent(t, 2018), rent(t, 2024)))
  top <- names(which.max(rise))

  home <- sapply(towns, function(t) nm_value(hv, "median_home_value", town = t, year = 2024))
  home_top <- names(which.max(home))

  ptr <- nm_data("dlib-ptr-by-bracket")
  ptr_20_35 <- ptr$ratio[ptr$income_bracket == "$20k-$34,999"]
  # Quoted as "N+ yrs" with N = floor(min(ptr_20_35)), so it holds in every town.

  dp <- nm_data("down-payment-years")

  # U.S. comparison values (data/us-benchmarks.json): ACS 2024 5-year,
  # B25077 (median home value) and B19083 (Gini index).
  us <- nm_data("us-benchmarks")
  us_median_home <- nm_value(us, "value", measure = "median_home_value")

  housing_headlines <<- list(
    rent_top_town = top,
    rent_top_rise = rise[[top]],
    rent_top_2018 = rent(top, 2018),
    rent_top_2024 = rent(top, 2024),
    ptr_20_35_min = min(ptr_20_35),
    home_top_town = home_top,
    home_top_value = home[[home_top]],
    us_median_home = us_median_home,
    down_payment_max_years = max(dp$years),
    down_payment_max_town = dp$town[which.max(dp$years)]
  )
})
