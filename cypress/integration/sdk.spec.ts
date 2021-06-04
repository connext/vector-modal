/// <reference types="cypress" />

describe("SDK", () => {
  it("visit local host", () => {
    cy.visit("http://localhost:1234");
  });
});
