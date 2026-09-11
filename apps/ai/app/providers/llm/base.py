from abc import ABC, abstractmethod
from typing import List, Dict, Optional

class LLMProvider(ABC):
    @abstractmethod
    async def chat(
        self,
        messages: List[Dict[str, str]],
        system_prompt: Optional[str] = None,
        temperature: float = 0.3,
        max_tokens: int = 4096,
    ) -> str:
        pass
    
    @abstractmethod
    async def chat_structured(
        self,
        messages: List[Dict[str, str]],
        system_prompt: Optional[str] = None,
        temperature: float = 0.1,
    ) -> dict:
        pass