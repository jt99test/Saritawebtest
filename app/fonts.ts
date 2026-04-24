import { Bodoni_Moda, Manrope } from "next/font/google";

export const fontSans = Manrope({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-manrope",
});

export const fontSerif = Bodoni_Moda({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-bodoni",
});
