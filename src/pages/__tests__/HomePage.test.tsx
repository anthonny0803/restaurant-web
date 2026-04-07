import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import HomePage from "../HomePage";

function renderHomePage() {
  return render(
    <MemoryRouter>
      <HomePage />
    </MemoryRouter>,
  );
}

describe("HomePage", () => {
  it("renders the welcome heading", () => {
    renderHomePage();

    expect(
      screen.getByRole("heading", {
        name: "Bienvenido a nuestro restaurante",
      }),
    ).toBeInTheDocument();
  });

  it("renders CTA link to reserve", () => {
    renderHomePage();

    expect(screen.getByText("Reservar mesa")).toHaveAttribute(
      "href",
      "/reservations/new",
    );
  });

  it("renders CTA link to menu", () => {
    renderHomePage();

    expect(screen.getByText("Ver menu")).toHaveAttribute("href", "/menu");
  });
});
