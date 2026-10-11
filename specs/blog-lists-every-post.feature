@wip
Feature: Every published post appears in the blog
  The blog is personal: whatever is published shows up, whatever its category.

  Scenario: Posts of every category are listed
    Given a published post in the category "devops"
    And a published post in the category "film reviews"
    When a visitor opens the blog
    Then both posts are listed

  Scenario: Drafts stay out of the blog
    Given a post marked as a draft
    When a visitor opens the blog
    Then the draft is not listed

  Scenario: A post without translation appears in the other language with a label
    Given a post written only in Portuguese
    When a visitor opens the English blog
    Then the post is listed with a label saying it is in Portuguese
