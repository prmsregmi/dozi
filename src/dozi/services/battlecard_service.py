"""Service for generating AI-powered battle cards from transcripts."""

import json

from groq import AsyncGroq
from openai import AsyncOpenAI

from ..models.schemas import AssistMode, BattleCard, Insight, PromptOverride, UserSettings
from ..prompts.loader import prompt_loader
from ..prompts.models import Prompt
from ..settings import provider_for_model, settings


class BattleCardService:
    """Generates battle cards with insights and recommendations from transcripts."""

    def __init__(self):
        """Initialize the battle card service with LLM clients."""
        self.openai_client = AsyncOpenAI(api_key=settings.openai_api_key)
        self.groq_client = (
            AsyncGroq(api_key=settings.groq_api_key) if settings.groq_api_key else None
        )

    async def generate_battlecard(
        self, transcript: str, mode: AssistMode, user_settings: UserSettings | None = None
    ) -> BattleCard:
        """
        Generate a battle card from a transcript.

        Args:
            transcript: The conversation transcript
            mode: The assistance mode (meeting, call, interview)
            user_settings: Optional user settings for model/temp/prompt overrides

        Returns:
            BattleCard with insights and recommendations
        """
        prompt_config = prompt_loader.get_prompt(mode)

        # Apply prompt overrides if present
        prompt_override: PromptOverride | None = None
        if user_settings and user_settings.prompt_overrides:
            prompt_override = user_settings.prompt_overrides.get(mode.value)

        response = await self._generate(
            prompt_config, transcript, user_settings=user_settings, prompt_override=prompt_override
        )

        # Parse JSON response
        try:
            data = json.loads(response)
            insights = [Insight(**insight) for insight in data.get("insights", [])]

            return BattleCard(
                mode=mode,
                insights=insights,
                summary=data.get("summary", ""),
                recommendations=data.get("recommendations", []),
            )
        except (json.JSONDecodeError, ValueError) as e:
            # Fallback if JSON parsing fails
            return BattleCard(
                mode=mode,
                insights=[
                    Insight(
                        type="error",
                        content=f"Failed to parse AI response: {e}",
                        priority="high",
                    )
                ],
                summary="Error generating battle card",
                recommendations=[],
            )

    async def _generate(
        self,
        prompt: Prompt,
        transcript: str,
        user_settings: UserSettings | None = None,
        prompt_override: PromptOverride | None = None,
    ) -> str:
        """Generate response using the configured LLM provider."""
        user_message = prompt.format(transcript=transcript)
        system_message = prompt.system_message

        # Apply prompt overrides
        if prompt_override:
            if prompt_override.user_message is not None:
                user_message = prompt_override.user_message.replace("{transcript}", transcript)
            if prompt_override.system_message is not None:
                system_message = prompt_override.system_message

        model = user_settings.llm_model if user_settings else settings.llm_model
        provider = provider_for_model(model)
        temperature = (
            user_settings.temperature if user_settings else prompt.metadata.model_params.temperature
        )

        messages = [
            {"role": "system", "content": system_message},
            {"role": "user", "content": user_message},
        ]

        if provider == "groq":
            if not self.groq_client:
                raise RuntimeError(
                    f"Model '{model}' requires Groq but GROQ_API_KEY is not configured"
                )
            return await self._generate_with_groq(messages, model, temperature)

        return await self._generate_with_openai(messages, model, temperature, prompt)

    async def _generate_with_groq(
        self,
        messages: list[dict],
        model: str,
        temperature: float,
    ) -> str:
        """Generate response using Groq (OpenAI-compatible API)."""
        response = await self.groq_client.chat.completions.create(
            model=model,
            messages=messages,
            response_format={"type": "json_object"},
            temperature=temperature,
        )
        return response.choices[0].message.content or ""

    async def _generate_with_openai(
        self,
        messages: list[dict],
        model: str,
        temperature: float,
        prompt: Prompt,
    ) -> str:
        """Generate response using OpenAI."""
        response = await self.openai_client.chat.completions.create(
            model=model,
            messages=messages,
            response_format={"type": prompt.metadata.model_params.response_format},  # type: ignore[invalid-argument-type]
            temperature=temperature,
        )
        return response.choices[0].message.content or ""
