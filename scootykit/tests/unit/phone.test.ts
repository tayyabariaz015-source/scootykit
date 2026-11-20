import { describe, expect, it } from "vitest";
import { formatPhone, isValidPakistaniPhone, maskPhone, normalizePakistaniPhone } from "@/lib/commerce/phone";

describe("Pakistani phone numbers", () => {
  it.each([
    ["03001234567", "03001234567"],
    ["+923001234567", "03001234567"],
    ["923001234567", "03001234567"],
    ["00923001234567", "03001234567"],
    ["0300-1234567", "03001234567"],
    ["+92 300 1234567", "03001234567"],
    ["3001234567", "03001234567"],
  ])("normalises %s", (input, expected) => {
    expect(normalizePakistaniPhone(input)).toBe(expected);
  });

  it.each(["", "12345", "0300123456", "030012345678", "04235761234", "+92423576123", "+1 415 555 1234", "abcdefghijk", "+9230012345a7"])(
    "rejects %s",
    (input) => {
      expect(isValidPakistaniPhone(input)).toBe(false);
    },
  );

  it("formats and masks", () => {
    expect(formatPhone("03001234567")).toBe("0300 1234567");
    expect(maskPhone("03001234567")).toBe("0300 ****567");
  });
});
