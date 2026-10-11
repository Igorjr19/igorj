@wip
Feature: External data never breaks the site
  Music and film summaries come from Last.fm and Letterboxd, which can be slow, down or changed.
  A failure there must never break the build or the page.

  Scenario: A failed refresh keeps the last valid summary
    Given the last valid music summary was saved on 2026-10-01
    And the music service fails during the refresh on 2026-10-03
    When the site is built
    Then the listening panel shows the summary saved on 2026-10-01
    And the build succeeds

  Scenario: Data older than seven days shows its date
    Given the last valid music summary was saved on 2026-10-01
    When the site is built on 2026-10-09
    Then the listening panel says the data is from 2026-10-01

  Scenario: With no data at all the panel shows an empty state
    Given no music summary was ever saved
    When the site is built
    Then the listening panel shows an empty state
    And every other panel of the home page is complete
