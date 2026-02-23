"""Service for generating AI-powered battle cards from transcripts."""

import json

from openai import AsyncOpenAI

from ..models.schemas import AssistMode, BattleCard, Insight
from ..prompts.loader import prompt_loader
from ..prompts.models import Prompt
from ..settings import settings


class BattleCardService:
    """Generates battle cards with insights and recommendations from transcripts."""

    def __init__(self):
        """Initialize the battle card service with OpenAI."""
        self.openai_client = AsyncOpenAI(api_key=settings.openai_api_key)

    async def generate_battlecard(self, transcript: str, mode: AssistMode) -> BattleCard:
        """
        Generate a battle card from a transcript.

        Args:
            transcript: The conversation transcript
            mode: The assistance mode (meeting, call, interview)

        Returns:
            BattleCard with insights and recommendations
        """
        prompt_config = prompt_loader.get_prompt(mode)
        response = await self._generate_with_openai(prompt_config, transcript)

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

    async def _generate_with_openai(self, prompt: Prompt, transcript: str) -> str:
        """Generate response using OpenAI with prompt configuration."""
        user_message = prompt.format(transcript=transcript)

        response = await self.openai_client.chat.completions.create(
            model=settings.llm_model,
            messages=[
                {"role": "system", "content": prompt.system_message},
                {"role": "user", "content": user_message},
            ],
            response_format={"type": prompt.metadata.model_params.response_format},  # type: ignore[invalid-argument-type]
            temperature=prompt.metadata.model_params.temperature,
        )

        return response.choices[0].message.content or ""
