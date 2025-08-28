
import os

class LLMClient:
    def __init__(self, provider: str = "none", model: str = None):
        self.provider = (provider or "none").lower()
        self.model = model or {
            "openai": os.getenv("OPENAI_MODEL", "gpt-4o-mini"),
            "gemini": os.getenv("GEMINI_MODEL", "gemini-1.5-flash"),
            "ollama": os.getenv("OLLAMA_MODEL", "llama3"),
        }.get(self.provider, "none")

    def available(self) -> bool:
        if self.provider == "openai":
            return bool(os.getenv("OPENAI_API_KEY"))
        if self.provider == "gemini":
            return bool(os.getenv("GOOGLE_API_KEY"))
        if self.provider == "ollama":
            return True
        return False

    def complete(self, system_prompt: str, user_prompt: str, max_tokens: int = 600) -> str:
        if self.provider == "none" or not self.available():
            return self._fallback(user_prompt)

        if self.provider == "openai":
            try:
                import openai  # type: ignore
                client = openai.OpenAI()
                resp = client.chat.completions.create(
                    model=self.model,
                    messages=[{"role":"system","content":system_prompt},
                              {"role":"user","content":user_prompt}],
                    temperature=0.2,
                    max_tokens=max_tokens
                )
                return resp.choices[0].message.content
            except Exception as e:
                return self._fallback(user_prompt, err=str(e))

        if self.provider == "gemini":
            try:
                import google.generativeai as genai  # type: ignore
                genai.configure(api_key=os.environ["GOOGLE_API_KEY"])
                model = genai.GenerativeModel(self.model)
                resp = model.generate_content([system_prompt, user_prompt])
                return resp.text
            except Exception as e:
                return self._fallback(user_prompt, err=str(e))

        if self.provider == "ollama":
            try:
                import requests  # type: ignore
                r = requests.post("http://localhost:11434/api/generate",
                                  json={"model": self.model, "prompt": f"{system_prompt}\n\n{user_prompt}","stream":False},
                                  timeout=60)
                if r.ok:
                    return r.json().get("response","").strip()
                return self._fallback(user_prompt, err=r.text)
            except Exception as e:
                return self._fallback(user_prompt, err=str(e))

        return self._fallback(user_prompt)

    def _fallback(self, user_prompt: str, err: str = "") -> str:
        note = f"\\n\\n[FALLBACK {err}]" if err else ""
        return (user_prompt[:800] + note)
