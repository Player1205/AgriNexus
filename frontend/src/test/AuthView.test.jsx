import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import AuthView from "../components/AuthView";

vi.mock("../services/auth", () => ({
  login: vi.fn(),
  register: vi.fn(),
}));

describe("AuthView Light Botanical Reference Suite", () => {
  it("renders AgriNexus brand, AI tagline, and Welcome Back heading", () => {
    render(<AuthView onAuthenticated={vi.fn()} />);

    expect(screen.getByText("AgriNexus")).toBeInTheDocument();
    expect(screen.getByText(/AI-POWERED CROP INTELLIGENCE/i)).toBeInTheDocument();
    expect(screen.getByText("Welcome Back")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Enter your email")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Enter your password")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Login/i })).toBeInTheDocument();
  });

  it("does not include Google authentication", () => {
    render(<AuthView onAuthenticated={vi.fn()} />);

    expect(screen.queryByText(/Continue with Google/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Google/i)).not.toBeInTheDocument();
  });

  it("switches to Register mode when clicking Register Now", () => {
    render(<AuthView onAuthenticated={vi.fn()} />);

    expect(screen.queryByPlaceholderText("Enter your full name")).not.toBeInTheDocument();

    const registerLink = screen.getByRole("button", { name: /Register Now/i });
    fireEvent.click(registerLink);

    expect(screen.getByPlaceholderText("Enter your full name")).toBeInTheDocument();
    expect(screen.getAllByText("Create Account").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByRole("button", { name: /Create Account/i })).toBeInTheDocument();
  });

  it("populates demo credentials on clicking Fill demo account", () => {
    render(<AuthView onAuthenticated={vi.fn()} />);

    const demoBtn = screen.getByRole("button", { name: /Fill demo account/i });
    fireEvent.click(demoBtn);

    const emailInput = screen.getByPlaceholderText("Enter your email");
    const passwordInput = screen.getByPlaceholderText("Enter your password");

    expect(emailInput.value).toBe("farmer@example.com");
    expect(passwordInput.value).toBe("FarmerDemo123!");
  });

  it("toggles password visibility", () => {
    render(<AuthView onAuthenticated={vi.fn()} />);

    const passwordInput = screen.getByPlaceholderText("Enter your password");
    expect(passwordInput.type).toBe("password");

    const toggleBtn = screen.getByTitle(/Show password/i);
    fireEvent.click(toggleBtn);

    expect(passwordInput.type).toBe("text");
  });

  it("dynamically switches language using the language dropdown", () => {
    render(<AuthView onAuthenticated={vi.fn()} />);

    const langBtn = screen.getByTitle("Select Language");
    fireEvent.click(langBtn);

    const hindiBtn = screen.getByRole("button", { name: "हिन्दी" });
    fireEvent.click(hindiBtn);

    expect(screen.getByText("स्वागत है")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("अपना ईमेल दर्ज करें")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /लॉगिन करें/i })).toBeInTheDocument();
  });
});
