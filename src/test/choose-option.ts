import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

/** Opens a themed SimpleSelect by its accessible name and picks an option. */
export async function chooseOption(label: string, option: string | RegExp) {
  await userEvent.click(screen.getByRole("combobox", { name: label }));
  await userEvent.click(await screen.findByRole("option", { name: option }));
}
