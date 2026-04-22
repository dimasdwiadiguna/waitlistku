"use client";
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { id, en, Lang } from "./lang";

interface LangContextType {
  lang: Lang;
  locale: "id" | "en";
  toggleLang: () => void;
}

const LangContext = createContext<LangContextType>({
  lang: id,
  locale: "id",
  toggleLang: () => {},
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<"id" | "en">("id");

  useEffect(() => {
    const saved = localStorage.getItem("waitlistku_lang");
    if (saved === "en") setLocale("en");
  }, []);

  const toggleLang = () => {
    const next = locale === "id" ? "en" : "id";
    setLocale(next);
    localStorage.setItem("waitlistku_lang", next);
  };

  return (
    <LangContext.Provider value={{ lang: locale === "id" ? id : en, locale, toggleLang }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  return useContext(LangContext);
}
