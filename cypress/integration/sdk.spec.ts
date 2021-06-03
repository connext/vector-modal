/// <reference types="cypress" />

describe("SDK", () => {
  it("visit local host", () => {
    cy.exec("yarn clean:app && yarn start:app", { log: true, failOnNonZeroExit: false, timeout: 60000 })
      .its("code")
      .should("eq", 0);

    cy.visit("http://localhost:1234");
  });
});
