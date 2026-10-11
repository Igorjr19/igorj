Feature: Content is readable without JavaScript
  Recruiters, search engines and résumé screeners read the HTML as it is delivered.
  Everything the site says must be in that HTML before any script runs.

  Background:
    Given JavaScript is disabled

  Scenario: The home page shows every section with its items
    When a visitor opens the English home page
    Then they see the "Posts" section listing "Fixture post"
    And they see the "Projects" section listing "Fixture project"

  Scenario: A post shows its full text
    When a visitor opens the post "Fixture post"
    Then they see the title "Fixture post"
    And they see the whole text of the post
