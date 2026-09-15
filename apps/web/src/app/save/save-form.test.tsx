import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const push = vi.fn();
const refresh = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, refresh }),
}));

const createItem = vi.fn();
vi.mock("@/lib/api", () => ({ createItem: (url: string) => createItem(url) }));

const { SaveForm } = await import("./save-form");

describe("SaveForm", () => {
  beforeEach(() => {
    push.mockClear();
    refresh.mockClear();
    createItem.mockReset();
  });

  it("saves the pasted URL and navigates back to the feed", async () => {
    createItem.mockResolvedValue({});
    const user = userEvent.setup();
    render(<SaveForm />);

    await user.type(screen.getByPlaceholderText("Paste a link…"), "https://example.com/article");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(createItem).toHaveBeenCalledWith("https://example.com/article");
    expect(push).toHaveBeenCalledWith("/");
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it("shows an error message and does not navigate when saving fails", async () => {
    createItem.mockRejectedValue(new Error("Failed to save item"));
    const user = userEvent.setup();
    render(<SaveForm />);

    await user.type(screen.getByPlaceholderText("Paste a link…"), "https://example.com/article");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(await screen.findByText("Failed to save item")).toBeTruthy();
    expect(push).not.toHaveBeenCalled();
  });
});
