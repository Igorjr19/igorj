@wip
Feature: Language of the first visit
  Only the root address chooses a language. Every other address carries its language in the path,
  so a shared link always opens in the language it was shared in.

  Scenario Outline: The browser language decides where the root address leads
    Given the browser prefers "<browser language>"
    When a visitor opens the root address
    Then they land on the <site language> home page

    Examples:
      | browser language | site language |
      | pt-BR            | Portuguese    |
      | pt               | Portuguese    |
      | en-US            | English       |
      | de               | English       |

  Scenario: Without JavaScript the root address leads to English
    Given JavaScript is disabled
    When a visitor opens the root address
    Then they land on the English home page

  Scenario: A language chosen earlier wins over the browser language
    Given the visitor chose English on a previous visit
    And the browser prefers "pt-BR"
    When a visitor opens the root address
    Then they land on the English home page

  Scenario: A direct link never redirects
    Given the browser prefers "en-US"
    When a visitor opens the Portuguese home page directly
    Then they stay on the Portuguese home page
