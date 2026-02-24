"""Centralized loader for YAML-based prompts."""

import logging
from pathlib import Path

import yaml

from ..schemas import AssistMode
from .models import Prompt

logger = logging.getLogger(__name__)


class PromptLoader:
    """Singleton loader for YAML prompts with caching."""

    def __init__(self, prompts_dir: Path | None = None):
        """
        Initialize the prompt loader.

        Args:
            prompts_dir: Directory containing YAML prompt files.
                        Defaults to /prompts/ at project root.
        """
        if prompts_dir is None:
            # Default to /prompts/ at project root
            project_root = Path(__file__).parent.parent.parent
            prompts_dir = project_root / "prompts"

        self.prompts_dir = prompts_dir
        self._cache: dict[str, Prompt] = {}
        logger.info(f"PromptLoader initialized with directory: {self.prompts_dir}")

    def get_prompt(self, mode: AssistMode) -> Prompt:
        """
        Load and cache a prompt for the given mode.

        Args:
            mode: The assistance mode (meeting, call, interview)

        Returns:
            Validated Prompt object

        Raises:
            FileNotFoundError: If the YAML file doesn't exist
            ValueError: If YAML is invalid or validation fails
        """
        mode_str = mode.value

        # Return cached prompt if available
        if mode_str in self._cache:
            logger.debug(f"Returning cached prompt for mode '{mode_str}'")
            return self._cache[mode_str]

        # Load from YAML
        yaml_path = self.prompts_dir / f"{mode_str}.yaml"
        if not yaml_path.exists():
            raise FileNotFoundError(f"Prompt file not found for mode '{mode_str}': {yaml_path}")

        logger.info(f"Loading prompt from {yaml_path}")

        try:
            with yaml_path.open("r") as f:
                data = yaml.safe_load(f)
        except yaml.YAMLError as e:
            raise ValueError(f"Failed to parse YAML file {yaml_path}: {e}") from e

        # Validate with Pydantic
        try:
            prompt = Prompt(**data)
        except Exception as e:
            raise ValueError(f"Validation failed for {yaml_path}: {e}") from e

        # Cache and log
        self._cache[mode_str] = prompt
        logger.info(f"Loaded prompt for mode '{mode_str}' (version {prompt.metadata.version})")

        return prompt

    def clear_cache(self) -> None:
        """Clear the prompt cache (useful for testing or hot-reload)."""
        self._cache.clear()
        logger.info("Prompt cache cleared")


# Singleton instance
prompt_loader = PromptLoader()
