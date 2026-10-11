@wip
Feature: Music and film summaries never show when something was consumed
  Taste is shared on the site; routine is not.

  Scenario: The listening panel shows artists without times or dates
    Given a weekly music summary whose source includes the time of each play
    When a visitor opens the home page
    Then the listening panel lists the most played artists
    And it shows no time of day and no listening date

  Scenario: The watched panel shows films and ratings without watch dates
    Given recent films whose source includes the date each one was watched
    When a visitor opens the home page
    Then the watched panel lists the films with their ratings
    And it shows no watch date
